import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";


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

  // Get active authenticated session user (if any)
  const supabase = await createClient();
  let { data: { user } } = await supabase.auth.getUser();

  // Determine if this is a fresh login request vs linking an existing user
  const isFreshLogin = state === "auth";

  if (!isFreshLogin) {
    if (!user) {
      console.error("Unauthorized callback request: state suggests linking but no active session.");
      return NextResponse.redirect(new URL("/login?error=unauthorized", origin));
    }
    if (state !== user.id) {
      console.error("CSRF warning: Callback state mismatch.", { state, userId: user.id });
      return NextResponse.redirect(new URL("/dashboard?error=invalid_state", origin));
    }
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
    let finalUserId = user?.id || "mock-uuid-12345678";
    const mockAthleteId = `mock_athlete_${finalUserId.substring(0, 8)}`;
    const mockExpiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

    console.log("Simulating Strava connection callback in Mock Mode. isFreshLogin:", isFreshLogin);

    // If it's a fresh login, set the mock cookies to sign them in!
    const cookieStore = await cookies();
    if (isFreshLogin) {
      cookieStore.set("kyl-mock-auth", "true", { path: "/" });
      cookieStore.set("kyl-mock-provider", "strava", { path: "/" });
    }
    cookieStore.set("kyl-mock-strava-linked", "true", { path: "/" });

    // 1. Save mock connection details
    const supabaseAdmin = await createAdminClient();
    const { error: insertError } = await supabaseAdmin
      .from("strava_connections")
      .upsert({
        user_id: finalUserId,
        strava_athlete_id: mockAthleteId,
        athlete_name: isFreshLogin ? "Adith Strava" : (user?.user_metadata?.full_name || "Athlete"),
        athlete_username: isFreshLogin ? "adith_strava" : (user?.user_metadata?.preferred_username || "athlete_username"),
        athlete_avatar: isFreshLogin 
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
          : (user?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"),
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
      .eq("id", finalUserId);

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

    // If this is a fresh login, we must establish a user session in Supabase first!
    if (isFreshLogin) {
      const email = athlete.email || `strava-${athlete.id}@kylarena.com`;
      const password = `strava-oauth-secret-${athlete.id}-${clientSecret}`;

      // Try signing in
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Create user using admin client
        const supabaseAdmin = await createAdminClient();
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: athleteName || "Strava Athlete",
            avatar_url: athlete.profile || "",
          },
        });

        if (createError) {
          console.error("Failed to create Supabase user for Strava login:", createError);
          return NextResponse.redirect(new URL("/login?error=signup_failed", origin));
        }

        user = createData.user;

        // Sign in
        const { error: secondSignInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (secondSignInError) {
          console.error("Failed to sign in after user creation:", secondSignInError);
          return NextResponse.redirect(new URL("/login?error=signin_failed", origin));
        }
      } else {
        user = signInData.user;
      }
    }

    if (!user) {
      console.error("No authenticated user session available to link Strava.");
      return NextResponse.redirect(new URL("/login?error=unauthorized", origin));
    }

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
      return NextResponse.redirect(new URL("/login?error=db_insert_failed", origin));
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
    return NextResponse.redirect(new URL("/login?error=exceptional_failure", origin));
  }
}
