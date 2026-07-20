import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import ChallengesClient from "./ChallengesClient";
import Link from "next/link";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Challenges Admin - KYL Arena",
  description: "KYL Arena Challenges Oversight",
};

export default async function ChallengesAdminPage() {
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
    console.error("Failed to fetch profile in admin route:", e);
  }

  // Check roles: athlete is unauthorized. Admins are: super_admin, challenge_admin, organization_admin
  const allowedRoles = ["super_admin", "challenge_admin", "organization_admin"];
  const userRole = profile?.role || "athlete";
  const isAuthorized = allowedRoles.includes(userRole);

  if (!isAuthorized) {
    // Render the premium 403 Access Denied UI
    return (
      <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-red-500 selection:text-white flex flex-col justify-between items-center px-4 py-12">
        {/* Background Ambient Glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Header Logo */}
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

        {/* 403 Content Card */}
        <div className="relative z-10 my-auto max-w-md w-full bg-zinc-900/30 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 sm:p-10 text-center shadow-[0_12px_40px_rgba(239,68,68,0.05)] space-y-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/5 text-red-400 font-mono text-[9px] font-extrabold uppercase tracking-widest">
              Security Violation • Error 403
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic">
              Access <span className="text-red-500 not-italic">Denied</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium leading-relaxed">
              Your profile is currently registered as <span className="text-white font-bold">{userRole.toUpperCase()}</span>. You do not have authorization to access the KYL Arena admin tools or command console.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="flex-1 h-12 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
              asChild
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
            <Button
              className="h-12 px-5 border border-red-950 hover:border-red-900 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
              asChild
            >
              <Link href="/api/auth/logout">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative z-10 text-[10px] text-zinc-650">
          <span>© 2026 KYL Arena. Security Operations Center.</span>
        </div>
      </div>
    );
  }

  // Fetch real challenges from public.challenges
  let dbChallenges: any[] = [];
  try {
    const { data, error: fetchChallengesError } = await supabaseAdmin
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });
    if (!fetchChallengesError && data) {
      dbChallenges = data;
    }
  } catch (e) {
    console.error("Failed to fetch challenges in admin route:", e);
  }

  // Fetch all challenge participants
  let dbParticipations: any[] = [];
  try {
    const { data, error: partError } = await supabaseAdmin
      .from("challenge_participants")
      .select("*");
    if (!partError && data) {
      dbParticipations = data;
    }
  } catch (e) {
    console.error("Failed to fetch challenge participants in admin route:", e);
  }

  // Fetch all profiles
  let dbProfiles: any[] = [];
  try {
    const { data, error: profError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!profError && data) {
      dbProfiles = data;
    }
  } catch (e) {
    console.error("Failed to fetch profiles in admin route:", e);
  }

  // Fetch all activities 
  let dbActivities: any[] = [];
  try {
    const { data, error: actError } = await supabaseAdmin
      .from("activities")
      .select("id, user_id, strava_activity_id, name, distance, moving_time, total_elevation_gain, start_date, sport_type")
      .order("start_date", { ascending: false });
    if (!actError && data) {
      dbActivities = data;
    }
  } catch (e) {
    console.error("Failed to fetch activities in admin route:", e);
  }

  return (
    <ChallengesClient
      profile={profile}
      userRole={userRole}
      initialChallenges={dbChallenges}
      initialParticipations={dbParticipations}
      initialProfiles={dbProfiles}
      initialActivities={dbActivities}
    />
  );
}
