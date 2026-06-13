import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";


/**
 * Route Handler: GET /api/strava/callback
 * Handles the OAuth redirect redirect from Strava.
 * Validates the state parameter against the user session to mitigate CSRF attacks.
 * Exchanges the code parameter for tokens (access, refresh, expiry) and athlete info.
 * Supports a simulated mock connection pathway if running in Mock Mode.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const isMockParam = searchParams.get("mock") === "true";

  if (!code || !state) {
    console.error("Missing code or state params in callback.");
    return NextResponse.redirect(new URL("/dashboard?error=missing_params", origin));
  }

  // Get active authenticated session user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Unauthorized callback request:", authError);
    return NextResponse.redirect(new URL("/login?error=unauthorized", origin));
  }

  // Security Check: Confirm state matches user ID to verify request origin
  if (state !== user.id) {
    console.error("CSRF warning: Callback state mismatch.", { state, userId: user.id });
    return NextResponse.redirect(new URL("/dashboard?error=invalid_state", origin));
  }

  // Check if Strava API connection should be mocked
  const clientId = process.env.STRAVA_CLIENT_ID || process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const isMock = 
    isMockParam ||
    !clientId || 
    clientId.includes("placeholder") || 
    !clientSecret || 
    clientSecret.includes("placeholder");

  if (isMock) {
    const mockAthleteId = `mock_athlete_${user.id.substring(0, 8)}`;
    const mockExpiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

    console.log("Simulating Strava connection callback in Mock Mode.");

    // 1. Save mock connection details
    const supabaseAdmin = await createAdminClient();
    const { error: insertError } = await supabaseAdmin
      .from("strava_connections")
      .upsert({
        user_id: user.id,
        strava_athlete_id: mockAthleteId,
        athlete_name: user.user_metadata?.full_name || "Athlete",
        athlete_username: user.user_metadata?.preferred_username || "athlete_username",
        athlete_avatar: user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
        access_token: "mock_access_token_12345",
        refresh_token: "mock_refresh_token_12345",
        expires_at: mockExpiresAt,
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed to save mock Strava connection details:", insertError);
      return NextResponse.redirect(new URL("/dashboard?error=db_insert_failed", origin));
    }

    // 2. Update user profile flags
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        strava_connected: true,
        strava_athlete_id: mockAthleteId,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Failed to update profile table flags for mock Strava:", profileError);
    }

    return NextResponse.redirect(new URL("/dashboard?strava_connected=success", origin));
  }

  // Real OAuth token exchange
  try {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Strava OAuth exchange failed with status:", res.status, errText);
      return NextResponse.redirect(new URL("/dashboard?error=oauth_exchange_failed", origin));
    }

    const data = await res.json();
    const expiresAtDate = new Date(data.expires_at * 1000).toISOString();
    const athlete = data.athlete;
    const athleteName = [athlete.firstname, athlete.lastname].filter(Boolean).join(" ");

    // 1. Save token credentials and athlete metadata
    const supabaseAdmin = await createAdminClient();
    const { error: insertError } = await supabaseAdmin
      .from("strava_connections")
      .upsert({
        user_id: user.id,
        strava_athlete_id: String(athlete.id),
        athlete_name: athleteName || null,
        athlete_username: athlete.username || null,
        athlete_avatar: athlete.profile || null,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expiresAtDate,
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed to store Strava credentials in database:", insertError);
      return NextResponse.redirect(new URL("/dashboard?error=db_insert_failed", origin));
    }

    // 2. Update public profile connected flags
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        strava_connected: true,
        strava_athlete_id: String(athlete.id),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Failed to update profiles table connection flags:", profileError);
    }

    return NextResponse.redirect(new URL("/dashboard?strava_connected=success", origin));
  } catch (err) {
    console.error("Exceptional error during Strava OAuth callback handler:", err);
    return NextResponse.redirect(new URL("/dashboard?error=exceptional_failure", origin));
  }
}
