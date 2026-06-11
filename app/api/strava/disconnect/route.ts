import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Route Handler: POST /api/strava/disconnect
 * Disconnects the athlete's Strava account.
 * Deletes the stored credentials from public.strava_connections and clears flags on public.profiles.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify active user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Remove credential entry from database
  const { error: deleteError } = await supabase
    .from("strava_connections")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Failed to delete credentials during disconnect:", deleteError);
    return NextResponse.json({ error: "Database error deleting credentials" }, { status: 500 });
  }

  // 2. Clear profiles table connection status
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      strava_connected: false,
      strava_athlete_id: null,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Failed to reset connection flags on user profile:", profileError);
    return NextResponse.json({ error: "Database error resetting profile flags" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
