import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AdminDashboardClient from "./AdminDashboardClient";
import Link from "next/link";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Control Center",
  description: "KYL Arena Community Management and Challenges Oversight",
};

/**
 * Server Component: /arena-admin
 * Verifies user session and admin roles (super_admin, challenge_admin, organization_admin).
 * Renders a stylized 403 page for unauthorized athletes, or the Admin Dashboard Client.
 */
export default async function AdminPage() {
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
          {/* Neon Red Shield Icon */}
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

        {/* Footer */}
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

  // Fetch all challenge participants (for dynamic metrics and completion rate)
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

  const participantCounts: Record<string, number> = {};
  dbParticipations.forEach((p: any) => {
    participantCounts[p.challenge_id] = (participantCounts[p.challenge_id] || 0) + 1;
  });

  // Fetch all profiles for search and inspector
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

  // Fetch all Strava connections to enrich athlete profiles
  let dbStravaConns: any[] = [];
  try {
    const { data, error: connError } = await supabaseAdmin
      .from("strava_connections")
      .select("user_id, athlete_name, athlete_username");
    if (!connError && data) {
      dbStravaConns = data;
    }
  } catch (e) {
    console.error("Failed to fetch Strava connections in admin route:", e);
  }

  // Fetch all activities to calculate total distance, community growth, and global feed
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

  // Calculate dynamic stats
  const totalMembers = dbProfiles.length;
  const activeAthletes = dbProfiles.filter(p => p.strava_connected).length;
  const activeChallenges = dbChallenges.filter(c => c.status === "active").length;
  const syncedActivities = dbActivities.length;

  const totalDistanceM = dbActivities.reduce((sum, act) => sum + Number(act.distance || 0), 0);
  const totalDistanceKm = Number((totalDistanceM / 1000).toFixed(1));

  // Compute average completion rate across all participations
  let completedParticipations = 0;
  let totalParticipations = dbParticipations.length;

  dbParticipations.forEach((p: any) => {
    const challenge = dbChallenges.find(c => c.id === p.challenge_id);
    if (!challenge) return;

    const challengeStart = `${challenge.start_date}T00:00:00Z`;
    const challengeEnd = `${challenge.end_date}T23:59:59Z`;

    // Filter matching activities
    const userActs = dbActivities.filter((act: any) => {
      if (act.user_id !== p.user_id) return false;
      if (act.start_date < challengeStart || act.start_date > challengeEnd) return false;
      const matchesSport = 
        challenge.sport_type === "Multisport" ||
        act.sport_type?.toLowerCase() === challenge.sport_type?.toLowerCase();
      return matchesSport;
    });

    let completedVal = 0;
    userActs.forEach((act: any) => {
      if (challenge.goal_metric === "Distance") {
        completedVal += Number(act.distance || 0) / 1000;
      } else if (challenge.goal_metric === "Elevation") {
        completedVal += Number(act.total_elevation_gain || 0);
      } else if (challenge.goal_metric === "Time" || challenge.goal_metric === "Duration") {
        completedVal += Number(act.moving_time || 0) / 3600;
      }
    });

    if (completedVal >= Number(challenge.goal_target)) {
      completedParticipations++;
    }
  });

  const averageCompletionRate = totalParticipations > 0 
    ? Math.round((completedParticipations / totalParticipations) * 100) 
    : 0;

  // Build global recent activity feed
  const recentActivities = dbActivities.slice(0, 10).map((act: any) => {
    const profile = dbProfiles.find(p => p.id === act.user_id);
    return {
      id: String(act.strava_activity_id || act.id),
      name: profile?.name || "Athlete",
      avatar: profile?.avatar || "",
      action: `logged ${act.name || "Workout"}`,
      sportType: act.sport_type,
      displayValue: `${(Number(act.distance || 0) / 1000).toFixed(1)} km`,
      time: act.start_date ? new Date(act.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recently",
      participantId: act.user_id
    };
  });

  // Prepare enriched athlete details for global search and inspection
  const athletes = dbProfiles.map((prof: any) => {
    const stravaConn = dbStravaConns.find(sc => sc.user_id === prof.id);
    
    // Calculate total distance inside any challenge
    let challengeDistance = 0;
    const userParticipations = dbParticipations.filter(p => p.user_id === prof.id);
    
    userParticipations.forEach((p: any) => {
      const challenge = dbChallenges.find(c => c.id === p.challenge_id);
      if (!challenge) return;

      const challengeStart = `${challenge.start_date}T00:00:00Z`;
      const challengeEnd = `${challenge.end_date}T23:59:59Z`;

      const matchingActs = dbActivities.filter((act: any) => {
        if (act.user_id !== prof.id) return false;
        if (act.start_date < challengeStart || act.start_date > challengeEnd) return false;
        const matchesSport = 
          challenge.sport_type === "Multisport" ||
          act.sport_type?.toLowerCase() === challenge.sport_type?.toLowerCase();
        return matchesSport;
      });

      matchingActs.forEach((act: any) => {
        challengeDistance += Number(act.distance || 0) / 1000;
      });
    });

    const userRecentActs = dbActivities
      .filter(act => act.user_id === prof.id)
      .slice(0, 5)
      .map(act => ({
        id: String(act.strava_activity_id || act.id),
        name: act.name || "Workout",
        sportType: act.sport_type || "Ride",
        distance: Number(((act.distance || 0) / 1000).toFixed(1)),
        movingTime: Number(act.moving_time || 0),
        elevationGain: Number(act.total_elevation_gain || 0),
        startDate: act.start_date ? new Date(act.start_date).toISOString().split("T")[0] : ""
      }));

    return {
      id: prof.id,
      name: prof.name || "Athlete",
      email: prof.email || "",
      avatar: prof.avatar || "",
      athleteId: prof.strava_athlete_id || "N/A",
      stravaAthleteName: stravaConn?.athlete_name || "",
      stravaAthleteUsername: stravaConn?.athlete_username || "",
      joinedAt: prof.created_at ? new Date(prof.created_at).toISOString().split("T")[0] : "N/A",
      stravaConnected: prof.strava_connected,
      challengeDistance: Number(challengeDistance.toFixed(1)),
      recentActivities: userRecentActs
    };
  });

  const challenges = dbChallenges.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description || "",
    sportType: c.sport_type,
    goalType: c.goal_metric,
    goalTarget: Number(c.goal_target),
    startDate: c.start_date,
    endDate: c.end_date,
    bannerUrl: c.banner_url || "",
    status: c.status as "active" | "upcoming" | "archived",
    participantsCount: participantCounts[c.id] || 0,
    challenge_code: c.challenge_code || `KYL-${new Date(c.start_date).getFullYear()}-${c.id.substring(0,3).toUpperCase()}`,
    slug: c.slug || c.title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-"),
  }));

  const metrics = {
    totalMembers,
    activeAthletes,
    activeChallenges,
    syncedActivities,
    totalDistance: totalDistanceKm,
    averageCompletionRate
  };

  // Otherwise, load and render the Admin Dashboard Client Component
  return (
    <AdminDashboardClient
      profile={profile}
      userRole={userRole}
      initialChallenges={challenges}
      initialMetrics={metrics}
      allAthletes={athletes}
      recentFeed={recentActivities}
    />
  );
}
