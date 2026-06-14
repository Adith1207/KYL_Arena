import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard — KYL Arena",
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
    // Fallback if public profile query fails
    profile = null;
    const errMsg = e instanceof Error ? e.message : "Unexpected exception";
    profileLookupResult = `Error: ${errMsg}`;
  }

  // If profile is missing (e.g. database trigger didn't run), construct a fallback from metadata
  if (!profile) {
    const isStrava = user.app_metadata?.provider === "strava";
    profile = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || "Athlete",
      avatar: user.user_metadata?.avatar_url || "",
      auth_provider: user.app_metadata?.provider || "google",
      strava_connected: isStrava,
      strava_athlete_id: isStrava ? "strava-athlete-999" : null,
    };
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
      const { data: connData, error: connError } = await supabase
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
    const supabaseAdmin = await createAdminClient();
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
