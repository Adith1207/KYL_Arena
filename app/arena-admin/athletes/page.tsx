import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AthletesClient from "./AthletesClient";
import Link from "next/link";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Athlete Intelligence Center",
  description: "KYL Arena Community Athlete Management and Synchronization Health Control Panel",
};

export default async function AthletesAdminPage() {
  try {
    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    // Verify session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      redirect("/login");
    }

    // Fetch user profile to check role
    let profile = null;
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileError && data) {
        profile = data;
      }
    } catch (e) {
      console.error("Failed to fetch profile in athletes admin route:", e);
    }

    // Auto-recreate profile if missing
    if (!profile || profile.id !== user.id) {
      const var_name = user.user_metadata?.full_name || user.user_metadata?.name || "Athlete";
      const var_avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
      const var_provider = user.app_metadata?.provider || "google";

      const { data: newProfile, error: createProfileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          name: var_name,
          avatar: var_avatar,
          auth_provider: var_provider,
          strava_connected: var_provider === "strava",
          strava_athlete_id: var_provider === "strava" ? user.user_metadata?.sub : null
        })
        .select()
        .single();

      if (createProfileError || !newProfile) {
        console.error(`Failed to recreate profile for admin check:`, createProfileError || "No data returned");
        redirect("/api/auth/logout?error=unauthorized");
      } else {
        profile = newProfile;
      }
    }

    // Check roles: athlete is unauthorized. Admins are: super_admin, challenge_admin, organization_admin
    const allowedRoles = ["super_admin", "challenge_admin", "organization_admin"];
    const userRole = profile?.role || "athlete";
    const isAuthorized = allowedRoles.includes(userRole);

    if (!isAuthorized) {
      // Render 403 Access Denied
      return (
        <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-red-500 selection:text-white flex flex-col justify-between items-center px-4 py-12">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3">
            <svg className="h-8 w-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g fill="#ef4444"><circle cx="48" cy="20" r="7" /><path d="M 28 69 C 14 78, 12 79, 10 80 Z" /></g>
            </svg>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black tracking-wider text-white leading-none">
                KYL <span className="text-lime-400">ARENA</span>
              </span>
              <span className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                Know Your Limits
              </span>
            </div>
          </div>

          <div className="relative z-10 my-auto max-w-md w-full bg-zinc-900/30 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 sm:p-10 text-center shadow-[0_12px_40px_rgba(239,68,68,0.05)] space-y-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/5 text-red-400 font-mono text-[9px] font-extrabold uppercase tracking-widest">
                Security Violation • Error 403
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Access Denied
              </h1>
              <p className="text-zinc-400 text-xs leading-relaxed max-w-xs mx-auto">
                You do not possess the necessary credentials to view the admin console. This gateway is restricted to community organizers.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link href="/dashboard" passHref legacyBehavior>
                <Button className="w-full bg-white text-black hover:bg-zinc-200 text-xs font-bold h-11 rounded-xl shadow-lg flex items-center justify-center gap-2 transition duration-300">
                  <ArrowLeft className="h-4 w-4" /> Return to Dashboard
                </Button>
              </Link>
              <Link href="/api/auth/logout" passHref legacyBehavior>
                <Button variant="ghost" className="w-full hover:bg-white/5 text-zinc-500 hover:text-white text-xs font-bold h-11 rounded-xl transition duration-300 flex items-center justify-center gap-2">
                  <LogOut className="h-4 w-4" /> Disconnect Session
                </Button>
              </Link>
            </div>
          </div>

          <p className="relative z-10 text-[9px] font-mono text-zinc-650 uppercase tracking-widest">
            KYL Security Firewall v4.0.2
          </p>
        </div>
      );
    }

    // Fetch all profiles
    let dbProfiles: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("name", { ascending: true });
      if (!error && data) dbProfiles = data;
    } catch (e) {
      console.error("Failed to fetch profiles in athletes page:", e);
    }

    // Fetch all connections
    let dbStravaConns: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("strava_connections")
        .select("*");
      if (!error && data) dbStravaConns = data;
    } catch (e) {
      console.error("Failed to fetch connections in athletes page:", e);
    }

    // Fetch all challenges
    let dbChallenges: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("challenges")
        .select("*");
      if (!error && data) dbChallenges = data;
    } catch (e) {
      console.error("Failed to fetch challenges in athletes page:", e);
    }

    // Fetch all participations
    let dbParticipations: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("challenge_participants")
        .select("*");
      if (!error && data) dbParticipations = data;
    } catch (e) {
      console.error("Failed to fetch participations in athletes page:", e);
    }

    // Fetch all activities
    let dbActivities: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("activities")
        .select("*")
        .order("start_date", { ascending: false });
      if (!error && data) dbActivities = data;
    } catch (e) {
      console.error("Failed to fetch activities in athletes page:", e);
    }

    return (
      <AthletesClient
        profile={profile}
        userRole={userRole}
        initialProfiles={dbProfiles}
        initialStravaConns={dbStravaConns}
        initialChallenges={dbChallenges}
        initialParticipations={dbParticipations}
        initialActivities={dbActivities}
      />
    );
  } catch (e: any) {
    if (e.digest?.startsWith("NEXT_REDIRECT") || e.digest === "DYNAMIC_SERVER_USAGE" || e.message?.includes("Dynamic server usage") || e.name === "DynamicServerError") {
      throw e;
    }
    console.error("Admin Athletes Directory server rendering crashed:", e);
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 max-w-md w-full text-center shadow-lg">
          <h2 className="text-xl font-bold text-white mb-2">Failed to load Athletes Directory</h2>
          <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
            An error occurred while compiling athletes records, workouts sync status, or challenge data. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/arena-admin/athletes" className="px-4 py-2 bg-lime-500 text-black text-xs font-bold rounded-lg hover:bg-lime-400 transition">Retry Loading</a>
            <a href="/arena-admin" className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-700 transition">Back to Admin</a>
          </div>
        </div>
      </div>
    );
  }
}
