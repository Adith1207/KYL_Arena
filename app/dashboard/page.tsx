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

  return <DashboardClient initialProfile={profile} />;
}
