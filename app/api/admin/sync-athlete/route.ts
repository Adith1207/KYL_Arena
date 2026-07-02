import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { syncUserActivities } from "@/app/api/strava/sync/route";

/**
 * Route Handler: POST /api/admin/sync-athlete
 * Triggers activity synchronization for a specific user ID.
 * Accessible only by administrators (super_admin, challenge_admin, organization_admin).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Verify authenticated session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Unauthorized sync request:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch user profile to verify admin role
    const supabaseAdmin = await createAdminClient();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Failed to verify user profile during admin sync:", profileError);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ["super_admin", "challenge_admin", "organization_admin"];
    if (!allowedRoles.includes(profile.role)) {
      console.warn(`User ${user.id} with role ${profile.role} attempted single user sync`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse target athlete's userId from request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // 4. Trigger sync for the selected user
    console.log(`Starting forced sync for athlete ${userId}...`);
    const syncResult = await syncUserActivities(userId);

    if (!syncResult.success) {
      return NextResponse.json({
        success: false,
        error: syncResult.error || "Failed to sync athlete activities"
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      activitiesCount: syncResult.activitiesCount || 0
    });
  } catch (error: any) {
    console.error("Critical error in single athlete sync route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
