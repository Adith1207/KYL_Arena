import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Route Handler: GET /auth/callback
 * Exchanges the temporary authorization code returned by Supabase Auth Providers
 * for a permanent cookie session, then redirects the user to the dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const host = request.headers.get("x-forwarded-host") || new URL(request.url).host;
      const protocol = request.headers.get("x-forwarded-proto") || (new URL(request.url).protocol === "https:" ? "https" : "http");
      return NextResponse.redirect(`${protocol}://${host}${next}`);
    }
  }

  // Fallback if the code exchange fails
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
