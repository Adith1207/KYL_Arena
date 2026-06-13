import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard — KYL Arena",
  description: "Manage your connected trackers, view active challenges, and customize your athlete profile.",
};

/**
 * Server Component: /dashboard
 * Resolves authentication status and fetches public profile data server-side.
 * Renders the interactive DashboardClient component.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Verify user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Fetch corresponding profile records from the database
  let profile = null;
  try {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
      
    if (!profileError && data) {
      profile = data;
    }
  } catch (e) {
    // Fallback if public profile query fails
    profile = null;
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
  let activities: any[] = [];
  let activitiesCount = 0;

  if (profile.strava_connected) {
    try {
      const { data: connData, error: connError } = await supabase
        .from("strava_connections")
        .select("athlete_name, athlete_username, athlete_avatar")
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

  const combinedProfile = {
    ...profile,
    strava_connection: stravaConnection,
    activities,
    activities_count: activitiesCount,
  };

  return <DashboardClient initialProfile={combinedProfile} />;
}
