import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Route Handler: GET /api/strava/connect
 * Initiates the Strava OAuth process.
 * Verifies that the user is authenticated with Supabase.
 * Redirects to the Strava authorization page or simulates the connection in Mock Mode.
 */
export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || requestUrl.host;
    const protocol = request.headers.get("x-forwarded-proto") || (requestUrl.protocol === "https:" ? "https" : "http");
    const origin = `${protocol}://${host}`;

    // 1. Check for active user session (if any)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If already connected, redirect back to dashboard
    // Use admin client to protect sensitive tokens from unauthorized read permissions
    if (user) {
      try {
        const supabaseAdmin = await createAdminClient();
        const { data: connection } = await supabaseAdmin
          .from("strava_connections")
          .select("strava_athlete_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (connection) {
          console.log(`User ${user.id} is already connected to Strava Athlete ${connection.strava_athlete_id}. Redirecting to dashboard.`);
          return NextResponse.redirect(new URL("/dashboard?info=already_connected", origin));
        }
      } catch (e) {
        console.error("Failed to query strava_connections in connect route:", e);
      }
    }

    // Generate a cryptographically secure state parameter to mitigate CSRF attacks
    const csrfState = crypto.randomUUID();
    const state = user ? `${user.id}:${csrfState}` : `auth:${csrfState}`;

    // Store the CSRF token in an HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("strava-oauth-state", csrfState, {
      path: "/",
      httpOnly: true,
      secure: protocol === "https",
      sameSite: "lax",
      maxAge: 600, // 10 minutes expiry
    });

    // 2. Detect Mock Mode
    const clientId = process.env.STRAVA_CLIENT_ID || process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const isMock = 
      process.env.NODE_ENV !== "production" && (
        !clientId || 
        clientId.includes("placeholder") || 
        !clientSecret || 
        clientSecret.includes("placeholder")
      );

    const callbackUrl = `${origin}/api/strava/callback`;

    if (isMock) {
      console.log(`Redirecting to simulated Strava callback in Mock Mode. State: ${state}`);
      // Simulate Strava callback by redirecting to /api/strava/callback with mock parameters
      const mockCallbackUrl = new URL("/api/strava/callback", origin);
      mockCallbackUrl.searchParams.set("code", "mock_code");
      mockCallbackUrl.searchParams.set("state", state);
      mockCallbackUrl.searchParams.set("mock", "true");
      
      return NextResponse.redirect(mockCallbackUrl.toString());
    }

    // 3. Build live Strava OAuth authorization redirect URL
    // Scope requested: read, activity:read_all to access basic info and fitness activities
    // Add re-auth parameter if config flag FORCE_STRAVA_REAUTH is enabled
    const forceReauth = process.env.FORCE_STRAVA_REAUTH === "true";
    let stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=read,activity:read_all&state=${state}`;
    if (forceReauth) {
      stravaAuthUrl += "&approval_prompt=force";
    }

    console.log("Diagnostic Log - Strava Connect Flow:");
    console.log(`- client ID loaded? ${clientId ? "yes" : "no"} (${clientId})`);
    console.log(`- client secret loaded? ${clientSecret ? "yes" : "no"}`);
    console.log(`- callback URL: ${callbackUrl}`);
    console.log(`- force re-auth parameter: ${forceReauth}`);
    console.log(`- generated Strava authorization URL: ${stravaAuthUrl}`);
    console.log(`- isMock mode? ${isMock ? "yes" : "no"}`);

    return NextResponse.redirect(stravaAuthUrl);
  } catch (error: any) {
    console.error("Critical error in Strava connect API route:", error);
    // Secure redirect fallback to login page
    const requestUrl = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || requestUrl.host;
    const protocol = request.headers.get("x-forwarded-proto") || (requestUrl.protocol === "https:" ? "https" : "http");
    return NextResponse.redirect(`${protocol}://${host}/dashboard?error=exceptional_failure`);
  }
}
