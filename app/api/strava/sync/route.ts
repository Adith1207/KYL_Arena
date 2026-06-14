import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getValidStravaAccessToken } from "@/lib/strava/token";

/**
 * Route Handler: GET /api/strava/sync
 * Triggers activity synchronization for the authenticated athlete.
 * Fetches the latest 30 activities from Strava API (or simulates in Mock Mode).
 * Upserts them into public.activities and updates last_synced_at.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  // 1. Verify active user session
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Unauthorized sync request:", authError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Fetch Strava Connection from Database to check linking status
  const supabaseAdmin = await createAdminClient();
  const { data: connection, error: connError } = await supabaseAdmin
    .from("strava_connections")
    .select("strava_athlete_id")
    .eq("user_id", user.id)
    .single();

  if (connError || !connection) {
    console.error("Missing Strava connection for sync request:", connError);
    return NextResponse.json({ error: "Strava account is not connected" }, { status: 400 });
  }

  // 3. Obtain a guaranteed valid access token (refreshes if required)
  const accessToken = await getValidStravaAccessToken(user.id);
  if (!accessToken) {
    console.error("Failed to obtain valid Strava token during sync for user:", user.id);
    return NextResponse.json({ error: "Your Strava session has expired. Please disconnect and reconnect your Strava account." }, { status: 400 });
  }

  // 4. Detect Mock Mode
  const clientId = process.env.STRAVA_CLIENT_ID || process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const isMock = 
    !clientId || 
    clientId.includes("placeholder") || 
    !clientSecret || 
    clientSecret.includes("placeholder");

  let activities: any[] = [];
  const nowStr = new Date().toISOString();

  if (isMock) {
    console.log("Simulating activity fetch in Mock Mode for user:", user.id);
    activities = generateMockActivities(user.id);
  } else {
    console.log("Fetching live athlete activities from Strava API for user:", user.id);
    try {
      const response = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=30", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (response.status === 429) {
        console.error("Strava API rate limit exceeded (HTTP 429)");
        return NextResponse.json({ error: "Strava API rate limit exceeded. Please try again later." }, { status: 429 });
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error("Failed to fetch activities from Strava. Status:", response.status, errText);
        return NextResponse.json({ error: "Failed to fetch activities from Strava." }, { status: 400 });
      }

      const rawActivities = await response.json();
      console.log(`Successfully fetched ${rawActivities.length} activities from Strava.`);

      // Format activities to match DB schema
      activities = rawActivities.map((act: any) => ({
        user_id: user.id,
        strava_activity_id: act.id,
        name: act.name || "Untitled Activity",
        distance: act.distance || 0,
        moving_time: act.moving_time || 0,
        elapsed_time: act.elapsed_time || 0,
        sport_type: act.sport_type || act.type || "Workout",
        start_date: act.start_date,
        start_date_local: act.start_date_local || null,
        average_speed: act.average_speed || null,
        total_elevation_gain: act.total_elevation_gain || null,
        raw_data: act,
      }));
    } catch (err) {
      console.error("Exceptional error during live Strava activity sync:", err);
      return NextResponse.json({ error: "Network error fetching activities from Strava." }, { status: 500 });
    }
  }

  // 5. Upsert retrieved activities into database
  if (activities.length > 0) {
    console.log(`Upserting ${activities.length} activities into public.activities table...`);
    const { error: upsertError } = await supabaseAdmin
      .from("activities")
      .upsert(activities, { onConflict: "strava_activity_id" });

    if (upsertError) {
      console.error("Database error upserting Strava activities:", upsertError);
      return NextResponse.json({ error: "Failed to store activities in the database." }, { status: 500 });
    }
  }

  // 6. Update user profile last_synced_at timestamp
  console.log("Updating profile last_synced_at timestamp...");
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ last_synced_at: nowStr })
    .eq("id", user.id);

  if (profileError) {
    console.error("Database error updating profile last_synced_at:", profileError);
  }

  // 7. Retrieve updated total count and latest 5 activities for response state updates
  let totalCount = 0;
  try {
    const { count, error: countError } = await supabaseAdmin
      .from("activities")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (!countError && count !== null) {
      totalCount = count;
    }
  } catch (e) {
    console.error("Failed to query total activities count:", e);
  }

  let latestActivities: any[] = [];
  try {
    const { data: actData, error: actError } = await supabaseAdmin
      .from("activities")
      .select("name, sport_type, distance, moving_time, start_date")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })
      .limit(5);
    if (!actError && actData) {
      latestActivities = actData;
    }
  } catch (e) {
    console.error("Failed to query latest activities:", e);
  }

  console.log(`Sync complete for user ${user.id}. Total count: ${totalCount}.`);
  return NextResponse.json({
    success: true,
    stats: {
      fetched: activities.length,
    },
    last_synced_at: nowStr,
    activities_count: totalCount,
    latest_activities: latestActivities,
  });
}

/**
 * Helper: Generates 30 high-quality mock Strava activities for Mock Mode.
 */
function generateMockActivities(userId: string): any[] {
  const activities = [];
  const sportTypes = ["Ride", "Run", "Walk"];
  const names = {
    "Ride": ["Morning Ride 🚴", "Weekend Century 🚴‍♂️", "Sunset Cruise 🌅", "Interval Training 🔥", "Commute to Office 💼"],
    "Run": ["Evening Jog 🏃", "Interval Session ⚡", "Long Run 🌳", "Recovery Run 🍃", "Morning Miles 🌅"],
    "Walk": ["Lunch Walk 🚶", "Evening Stroll 🌇", "Dog Walk 🐾", "Park Wander 🌲", "Morning Coffee Walk ☕"]
  };

  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const sportType = sportTypes[i % sportTypes.length];
    const sportNames = names[sportType as keyof typeof names];
    const name = sportNames[i % sportNames.length];

    // Distances in meters
    let distance = 0;
    let movingTime = 0; // seconds
    let elevationGain = 0;

    if (sportType === "Ride") {
      distance = Math.round((20 + (i * 2.5)) * 1000); // 20km to 92.5km
      movingTime = Math.round((distance / 25) * 3.6); // approx 25 km/h
      elevationGain = Math.round(150 + (i * 35));
    } else if (sportType === "Run") {
      distance = Math.round((5 + (i * 0.5)) * 1000); // 5km to 19.5km
      movingTime = Math.round((distance / 10) * 3.6); // approx 10 km/h
      elevationGain = Math.round(20 + (i * 5));
    } else {
      distance = Math.round((2 + (i * 0.2)) * 1000); // 2km to 7.8km
      movingTime = Math.round((distance / 5) * 3.6); // approx 5 km/h
      elevationGain = Math.round(5 + i);
    }

    const startDate = new Date(now.getTime() - (i * 1.5 * 24 * 60 * 60 * 1000)); // One activity every 36 hours

    activities.push({
      user_id: userId,
      strava_activity_id: 1000000000 + i, // Unique mock ID
      name,
      distance,
      moving_time: movingTime,
      elapsed_time: movingTime + 120, // Add 2 minutes buffer
      sport_type: sportType,
      start_date: startDate.toISOString(),
      start_date_local: startDate.toISOString(),
      average_speed: Number((distance / movingTime).toFixed(2)),
      total_elevation_gain: elevationGain,
      raw_data: { mock: true, index: i },
    });
  }

  return activities;
}
