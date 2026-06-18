import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import ChallengeInsightsClient from "./ChallengeInsightsClient";
import Link from "next/link";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Challenge Standings & Insights",
  description: "Monitor athlete activity data and challenge leaderboard standings.",
};

interface PageProps {
  params: Promise<{ challengeId: string }>;
}

// Mock challenges to match IDs on the server
const mockChallenges = [
  {
    id: "1",
    title: "KYL Summer Century",
    description: "Pedal your way to 100 kilometers over the month of June. Ride together, check your limits.",
    sportType: "Ride",
    goalType: "Distance",
    goalTarget: 100,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    bannerUrl: "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?auto=format&fit=crop&w=400&q=80",
    status: "active" as const
  },
  {
    id: "2",
    title: "June Run Challenge",
    description: "Lace up and complete 50 kilometers of running. Stay consistent throughout June.",
    sportType: "Run",
    goalType: "Distance",
    goalTarget: 50,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    bannerUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80",
    status: "active" as const
  },
  {
    id: "3",
    title: "July Elevation Climb",
    description: "Climb 2,000 meters of total elevation gain. Any run, walk, or cycle counts.",
    sportType: "Multisport",
    goalType: "Elevation",
    goalTarget: 2000,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    bannerUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80",
    status: "upcoming" as const
  },
  {
    id: "4",
    title: "May Walkathon",
    description: "Cover 30 kilometers of walking to kickstart your summer fitness habit.",
    sportType: "Walk",
    goalType: "Distance",
    goalTarget: 30,
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    bannerUrl: "https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=400&q=80",
    status: "archived" as const
  }
];

export default async function ChallengeInsightsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const challengeId = resolvedParams.challengeId;

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
    console.error("Failed to fetch profile in challenge route:", e);
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

    if (createProfileError) {
      console.error(`Failed to recreate profile for admin check:`, createProfileError);
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
              Your profile is currently registered as <span className="text-white font-bold">{userRole.toUpperCase()}</span>. You do not have authorization to access the KYL Arena admin tools or challenge insights.
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

        {/* Footer */}
        <div className="relative z-10 text-[10px] text-zinc-650">
          <span>© 2026 KYL Arena. Security Operations Center.</span>
        </div>
      </div>
    );
  }

  // Find the challenge matching the route parameter, or default to a mock challenge if not found
  const challenge = mockChallenges.find(c => c.id === challengeId) || {
    id: challengeId,
    title: "KYL Arena Event",
    description: "A custom community event. Pedaling, running, and conquering limits together.",
    sportType: "Multisport",
    goalType: "Distance",
    goalTarget: 100,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    bannerUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80",
    status: "active" as const
  };

  return (
    <ChallengeInsightsClient
      profile={profile}
      userRole={userRole}
      challenge={challenge}
    />
  );
}
