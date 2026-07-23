import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-safe Supabase session refresher for proxy.ts.
 * Uses only request/response cookies — no next/headers, no Node.js APIs.
 * Refreshes the session JWT on every proxied request so it doesn't expire.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isMock = 
    process.env.NODE_ENV !== "production" && (
      !url || 
      url.includes("placeholder") || 
      !anonKey || 
      anonKey.includes("placeholder")
    );

  if (isMock) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        const rememberCookie = request.cookies.get("kyl-remember-device")?.value === "true";
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          let updatedOptions = { ...options };
          if (name.startsWith("sb-")) {
            if (rememberCookie) {
              updatedOptions.maxAge = 30 * 24 * 3600;
              if (updatedOptions.expires) {
                updatedOptions.expires = new Date(Date.now() + 30 * 24 * 3600 * 1000);
              }
            } else {
              delete updatedOptions.maxAge;
              delete updatedOptions.expires;
            }
          }
          supabaseResponse.cookies.set(name, value, updatedOptions);
        });
      },
    },
  });

  // Skip token refresh logic for asset requests and next internals
  const path = request.nextUrl.pathname;
  if (
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.includes(".")
  ) {
    return supabaseResponse;
  }

  // Refresh the session token
  await supabase.auth.getUser();

  return supabaseResponse;
}
