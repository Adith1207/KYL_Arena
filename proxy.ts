import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

/**
 * Root Next.js proxy function (Next.js 16+ convention — replaces deprecated middleware.ts).
 *
 * Authentication strategy (Edge-safe, zero server-only APIs):
 *   - Session cookie refresh is delegated to lib/supabase/session.ts via updateSession().
 *     That helper uses createServerClient from @supabase/ssr with request/response cookies only.
 *   - Route-guard checks use a lightweight Supabase auth-token cookie presence check.
 *     No next/headers, no cookies(), no draftMode(), no createServerClient() called here.
 *   - Full JWT verification happens inside server components / route handlers that run in
 *     the Node.js runtime where next/headers and createClient() are available.
 *
 * Authentication Flow:
 *   1. Browser → /dashboard (or any protected path)
 *   2. proxy.ts: updateSession refreshes JWT in the response cookies
 *   3. proxy.ts: cookie-presence check decides whether to redirect to /login
 *   4. Server component (app/dashboard/page.tsx): supabase.auth.getUser() verifies JWT
 *   5. Dashboard renders (or redirects to /login if session truly invalid)
 */
export async function proxy(request: NextRequest) {
  // --- Step 1: Refresh Supabase session cookies (Edge-safe) ---
  const response = await updateSession(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isMock =
    process.env.NODE_ENV !== "production" &&
    (!url || url.includes("placeholder") || !anonKey || anonKey.includes("placeholder"));

  const path = request.nextUrl.pathname;

  const isProtectedPath =
    path.startsWith("/dashboard") ||
    path.startsWith("/arena-admin") ||
    path.startsWith("/admin") ||
    path.startsWith("/api/strava/sync") ||
    path.startsWith("/api/strava/disconnect");

  const isLoginPath = path.startsWith("/login");

  if (isProtectedPath || isLoginPath) {
    let isAuthenticated = false;

    if (isMock) {
      // Mock mode: read the lightweight dev-only cookie
      isAuthenticated = request.cookies.get("kyl-mock-auth")?.value === "true";
    } else {
      // Production: check for the Supabase auth-token session cookie.
      // This is a presence check only — full JWT verification is deferred to
      // the server component. This keeps proxy.ts entirely Node-API-free.
      const allCookies = request.cookies.getAll();
      isAuthenticated = allCookies.some(
        (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
      );
    }

    if (isProtectedPath && !isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return redirectResponse;
    }
  }

  // --- Cache-Control: prevent bfcache on protected pages ---
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
     * Match all request paths except for the paths starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Image assets (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
