import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Route Handler: GET /api/strava/connect
 * Initiates the Strava OAuth process.
 * Verifies that the user is authenticated with Supabase.
 * Redirects to the Strava authorization page or simulates the connection in Mock Mode.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  // 1. Check for active user session (if any)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Determine the state parameter: if user is logged in, pass user.id to link their account.
  // Otherwise, pass "auth" to indicate a new login request.
  const state = user ? user.id : "auth";

  // 2. Detect Mock Mode
  const clientId = process.env.STRAVA_CLIENT_ID || process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const isMock = 
    !clientId || 
    clientId.includes("placeholder") || 
    !clientSecret || 
    clientSecret.includes("placeholder");

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
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=read,activity:read_all&state=${state}`;

  console.log("Diagnostic Log - Strava Connect Flow:");
  console.log(`- client ID loaded? ${clientId ? "yes" : "no"} (${clientId})`);
  console.log(`- client secret loaded? ${clientSecret ? "yes" : "no"}`);
  console.log(`- callback URL: ${callbackUrl}`);
  console.log(`- generated Strava authorization URL: ${stravaAuthUrl}`);
  console.log(`- isMock mode? ${isMock ? "yes" : "no"}`);

  return NextResponse.redirect(stravaAuthUrl);
}
