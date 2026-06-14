import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard",
  description: "Manage your connected trackers, view active challenges, and customize your athlete profile.",
};

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Server Component: /dashboard
 * Resolves authentication status, query params, and fetches public profile data server-side.
 * Renders the interactive DashboardClient component with diagnostics.
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = await searchParams;
  const error = typeof resolvedParams.error === "string" ? resolvedParams.error : undefined;
  const info = typeof resolvedParams.info === "string" ? resolvedParams.info : undefined;
  const stravaConnected = typeof resolvedParams.strava_connected === "string" ? resolvedParams.strava_connected : undefined;

  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();
  
  // Verify user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Fetch corresponding profile records from the database
  let profile = null;
  let profileLookupResult = "";
  try {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
      
    if (!profileError && data) {
      profile = data;
      profileLookupResult = `Success (strava_connected: ${data.strava_connected})`;
    } else {
      profileLookupResult = `Failed: ${profileError?.message || "No profile found"}`;
    }
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : "Unexpected exception";
    profileLookupResult = `Error: ${errMsg}`;
  }

  // Verify that the profile exists and matches the user ID exactly. If missing, automatically recreate it.
  if (!profile || profile.id !== user.id) {
    console.log(`Profile missing or mismatched for authenticated user ${user.id}. Recreating from session metadata...`);
    const var_name = user.user_metadata?.full_name || user.user_metadata?.name || "Athlete";
    const var_avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
    const var_provider = user.app_metadata?.provider || "google";

    const { data: newProfile, error: createProfileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        name: var_name,
        avatar: var_avatar,
        auth_provider: var_provider,
        strava_connected: var_provider === "strava",
        strava_athlete_id: var_provider === "strava" ? user.user_metadata?.sub : null
      })
      .select()
      .single();

    if (createProfileError) {
      console.error(`Failed to recreate profile for user ${user.id}:`, createProfileError);
      redirect("/api/auth/logout?error=unauthorized");
    } else {
      profile = newProfile;
      profileLookupResult = `Recreated Profile (strava_connected: ${newProfile.strava_connected})`;
    }
  }

  // Fetch associated athlete details if Strava is connected
  let stravaConnection = null;
  let activities: {
    name: string;
    sport_type: string;
    distance: number;
    moving_time: number;
    start_date: string;
  }[] = [];
  let activitiesCount = 0;

  if (profile.strava_connected) {
    try {
      const { data: connData, error: connError } = await supabaseAdmin
        .from("strava_connections")
        .select("athlete_name, athlete_username, athlete_avatar, created_at")
        .eq("user_id", user.id)
        .single();
      
      if (!connError && connData) {
        stravaConnection = connData;
      }
    } catch (e) {
      console.error("Failed to query strava_connections:", e);
    }

    try {
      // Fetch latest 5 activities
      const { data: actData, error: actError } = await supabase
        .from("activities")
        .select("name, sport_type, distance, moving_time, start_date")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false })
        .limit(5);

      if (!actError && actData) {
        activities = actData;
      }

      // Fetch count of all activities
      const { count, error: countError } = await supabase
        .from("activities")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (!countError && count !== null) {
        activitiesCount = count;
      }
    } catch (e) {
      console.error("Failed to query activities for dashboard page:", e);
    }
  }

  // Fetch overall db connections count using admin client
  let totalConnectionsCount = 0;
  try {
    const { count, error: countError } = await supabaseAdmin
      .from("strava_connections")
      .select("*", { count: "exact", head: true });
    if (!countError && count !== null) {
      totalConnectionsCount = count;
    }
  } catch (e) {
    console.error("Failed to fetch overall db connection count:", e);
  }

  const combinedProfile = {
    ...profile,
    strava_connection: stravaConnection,
    activities,
    activities_count: activitiesCount,
  };

  // Build diagnostics bundle
  const diagnostics = {
    supabaseUser: {
      id: user.id,
      email: user.email || "N/A",
      provider: user.app_metadata?.provider || "N/A",
      lastSignIn: user.last_sign_in_at || "N/A",
    },
    athleteId: profile.strava_athlete_id || "N/A",
    existingConnectionCount: totalConnectionsCount,
    oauthCallbackResult: error ? `Error: ${error}` : (stravaConnected ? `Success: ${stravaConnected}` : (info ? `Info: ${info}` : "No callback active")),
    profileLookupResult: profileLookupResult,
  };

  return (
    <DashboardClient 
      initialProfile={combinedProfile} 
      errorParam={error}
      infoParam={info}
      diagnostics={diagnostics}
    />
  );
}
