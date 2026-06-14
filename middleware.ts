import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Root Next.js middleware function.
 * Manages route protection for /dashboard and /login routes.
 * Supports transparent redirect logic for Mock Mode and live Supabase auth.
 */
export async function middleware(request: NextRequest) {
  // Update Supabase request session cookie
  const response = await updateSession(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isMock = 
    !url || 
    url.includes("placeholder") || 
    !anonKey || 
    anonKey.includes("placeholder");

  const path = request.nextUrl.pathname;

  const isProtectedPath = 
    path.startsWith("/dashboard") || 
    path.startsWith("/api/strava/sync") || 
    path.startsWith("/api/strava/disconnect") ||
    path.startsWith("/challenges");

  const isLoginPath = path.startsWith("/login");

  if (isProtectedPath || isLoginPath) {
    let isAuthenticated = false;

    if (isMock) {
      isAuthenticated = request.cookies.get("kyl-mock-auth")?.value === "true";
    } else {
      try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        isAuthenticated = !!user;
      } catch {
        isAuthenticated = false;
      }
    }

    if (isProtectedPath && !isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return redirectResponse;
    }

    if (isLoginPath && isAuthenticated) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Set Cache-Control headers on all protected HTML pages to prevent browser back-forward cache (bfcache)
  if (path.startsWith("/dashboard") || path.startsWith("/challenges")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Image assets (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
