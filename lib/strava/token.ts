import { createClient } from "@/lib/supabase/server";

/**
 * Server-side utility to retrieve a valid Strava access token for a user.
 * Automatically handles token refresh using the stored refresh token if expired or near expiration.
 * Transparently supports simulated refresh if running in Mock Mode.
 */
export async function getValidStravaToken(userId: string): Promise<string | null> {
  const supabase = await createClient();

  // Retrieve the athlete's token entry
  const { data: conn, error } = await supabase
    .from("strava_connections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !conn) {
    console.error("No Strava connection found for user:", userId, error);
    return null;
  }

  const expiresAt = new Date(conn.expires_at).getTime();
  const now = Date.now();
  const bufferWindow = 10 * 60 * 1000; // 10 minutes buffer

  // If token is still valid, return it directly
  if (expiresAt > now + bufferWindow) {
    return conn.access_token;
  }

  // Token is expired/expiring. Refresh is required.
  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const isMock = 
    !clientId || 
    clientId.includes("placeholder") || 
    !clientSecret || 
    clientSecret.includes("placeholder");

  if (isMock) {
    const mockAccessToken = `mock_access_token_${Math.random().toString(36).substring(7)}`;
    const mockExpiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(); // 6 hours validity

    const { error: updateError } = await supabase
      .from("strava_connections")
      .update({
        access_token: mockAccessToken,
        expires_at: mockExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Failed to update mock Strava credentials:", updateError);
      return null;
    }

    return mockAccessToken;
  }

  // Perform live credentials refresh
  try {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: conn.refresh_token,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Strava OAuth refresh request rejected:", errText);
      return null;
    }

    const data = await res.json();
    const expiresAtDate = new Date(data.expires_at * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("strava_connections")
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expiresAtDate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Failed to save refreshed Strava tokens to db:", updateError);
      return null;
    }

    return data.access_token;
  } catch (err) {
    console.error("Exceptional error during Strava OAuth refresh:", err);
    return null;
  }
}
