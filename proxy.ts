import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

/**
 * Root Next.js proxy function (Next.js 16+ convention — replaces deprecated middleware.ts).
 *
 * Authentication strategy (fully Edge-safe):
 *   - Session cookie refresh is delegated to lib/supabase/session.ts via updateSession().
 *   - Route-guard uses createServerClient from @supabase/ssr with request cookies only.
 *     No next/headers, no cookies(), no draftMode() — all Edge-compatible.
 *   - Full JWT verification also happens inside server components for double safety.
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
      isAuthenticated = request.cookies.get("kyl-mock-auth")?.value === "true";
    } else {
      // Use createServerClient with request cookies only — this is Edge-safe.
      // No next/headers, no Node.js APIs. The @supabase/ssr client reads the
      // chunked auth-token cookies (sb-xxx-auth-token.0, .1, etc.) correctly.
      try {
        const supabase = createServerClient(url!, anonKey!, {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll() { /* no-op in proxy — updateSession handles cookie writing */ },
          },
        });
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
