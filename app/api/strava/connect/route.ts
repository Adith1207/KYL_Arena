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

  // 1. Verify active user session
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Unauthorized connection request:", authError);
    return NextResponse.redirect(new URL("/login?error=unauthorized", origin));
  }

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
    console.log("Redirecting to simulated Strava callback in Mock Mode.");
    // Simulate Strava callback by redirecting to /api/strava/callback with mock parameters
    const mockCallbackUrl = new URL("/api/strava/callback", origin);
    mockCallbackUrl.searchParams.set("code", "mock_code");
    mockCallbackUrl.searchParams.set("state", user.id);
    mockCallbackUrl.searchParams.set("mock", "true");
    
    return NextResponse.redirect(mockCallbackUrl.toString());
  }

  // 3. Build live Strava OAuth authorization redirect URL
  // Scope requested: read, activity:read_all to access basic info and fitness activities
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=read,activity:read_all&state=${user.id}`;

  console.log("Redirecting user to live Strava OAuth flow.");
  return NextResponse.redirect(stravaAuthUrl);
}
