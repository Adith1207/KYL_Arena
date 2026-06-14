import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const cookiesToClear = [
    "kyl-mock-auth",
    "kyl-mock-provider",
    "kyl-mock-strava-linked",
    "kyl-mock-activities-synced",
    "kyl-mock-last-synced-at",
    "strava-oauth-state",
  ];

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
