import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const cookiesToClear = [
  "kyl-mock-auth",
  "kyl-mock-provider",
  "kyl-mock-strava-linked",
  "kyl-mock-activities-synced",
  "kyl-mock-last-synced-at",
  "kyl-mock-user-id",
  "kyl-mock-user-email",
  "kyl-mock-user-name",
  "kyl-mock-user-avatar",
  "strava-oauth-state",
];

/**
 * Route Handler: POST /api/auth/logout
 * Signs out of Supabase and clears all application cookies on the server.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (e) {
    console.error("Supabase signOut error:", e);
  }

  const response = NextResponse.json({ success: true });
  const cookieStore = await cookies();

  // Clear any active session cookies starting with 'sb-' or 'kyl-mock-', and static list
  const allCookies = cookieStore.getAll();
  allCookies.forEach((c) => {
    if (c.name.startsWith("sb-") || c.name.startsWith("kyl-mock-") || cookiesToClear.includes(c.name)) {
      response.cookies.set(c.name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        sameSite: "lax",
      });
    }
  });

  // Extra safety explicit clearing
  cookiesToClear.forEach((name) => {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
    });
  });

  return response;
}

/**
 * Route Handler: GET /api/auth/logout
 * Clears session cookies and redirects to login, with optional error parameters.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  const redirectTo = error ? `/login?error=${error}` : "/login";

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (e) {
    console.error("Supabase signOut error on GET:", e);
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  const cookieStore = await cookies();

  // Clear any active session cookies starting with 'sb-' or 'kyl-mock-', and static list
  const allCookies = cookieStore.getAll();
  allCookies.forEach((c) => {
    if (c.name.startsWith("sb-") || c.name.startsWith("kyl-mock-") || cookiesToClear.includes(c.name)) {
      response.cookies.set(c.name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        sameSite: "lax",
      });
    }
  });

  // Extra safety explicit clearing
  cookiesToClear.forEach((name) => {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
    });
  });

  return response;
}
