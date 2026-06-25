import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { syncUserActivities } from "@/app/api/strava/sync/route";

/**
 * Route Handler: POST /api/admin/sync-all
 * Triggers activity synchronization for all profiles connected to Strava.
 * Accessible only by administrators (super_admin, challenge_admin, organization_admin).
 */
export async function POST() {
  try {
    const supabase = await createClient();
    
    // 1. Verify authenticated session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Unauthorized bulk sync request:", authError);
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
      console.error("Failed to verify user profile during bulk sync:", profileError);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ["super_admin", "challenge_admin", "organization_admin"];
    if (!allowedRoles.includes(profile.role)) {
      console.warn(`User ${user.id} with role ${profile.role} attempted bulk sync`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Fetch all profiles connected to Strava
    const { data: connectedAthletes, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id, name")
      .eq("strava_connected", true);

    if (fetchError) {
      console.error("Failed to fetch connected athletes for bulk sync:", fetchError);
      return NextResponse.json({ error: "Failed to retrieve connected athletes" }, { status: 500 });
    }

    if (!connectedAthletes || connectedAthletes.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No athletes connected to Strava found. Nothing to sync.",
        results: []
      });
    }

    // 4. Sync activities for each athlete sequentially
    console.log(`Starting admin bulk sync for ${connectedAthletes.length} connected athletes...`);
    const results = [];
    
    for (const athlete of connectedAthletes) {
      try {
        console.log(`Syncing athlete ${athlete.name} (${athlete.id})...`);
        const syncResult = await syncUserActivities(athlete.id);
        
        results.push({
          id: athlete.id,
          name: athlete.name,
          success: syncResult.success,
          activitiesCount: syncResult.activitiesCount || 0,
          error: syncResult.error
        });
      } catch (err: any) {
        console.error(`Error syncing athlete ${athlete.name} during bulk sync:`, err);
        results.push({
          id: athlete.id,
          name: athlete.name,
          success: false,
          activitiesCount: 0,
          error: err.message || "Unknown error"
        });
      }
    }

    const totalSyncedCount = results.reduce((sum, res) => sum + res.activitiesCount, 0);
    const successfulCount = results.filter(r => r.success).length;

    console.log(`Bulk sync finished. Successfully synced ${successfulCount}/${connectedAthletes.length} athletes. Total activities: ${totalSyncedCount}.`);

    return NextResponse.json({
      success: true,
      stats: {
        totalAthletes: connectedAthletes.length,
        successfulSyncs: successfulCount,
        totalActivitiesSynced: totalSyncedCount
      },
      results
    });
  } catch (error: any) {
    console.error("Critical error in bulk sync route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
