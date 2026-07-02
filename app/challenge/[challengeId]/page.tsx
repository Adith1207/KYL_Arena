import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import ChallengeClient from "./ChallengeClient";

interface PageProps {
  params: Promise<{ challengeId: string }>;
}

export const metadata = {
  title: "Challenge Details",
  description: "View community challenge goal, timeline, standings, and sign up to participate.",
};

export default async function ChallengeDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const challengeId = resolvedParams.challengeId;

  try {
    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();

    // Verify session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      redirect("/login");
    }

    // Fetch current user profile
    let profile = null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        profile = data;
      }
    } catch (e) {
      console.error("Failed to query profile on challenge detail page:", e);
    }

    if (!profile || profile.id !== user.id) {
      redirect("/login");
    }

    // Fetch challenge detail
    let challenge = null;
    try {
      const { data, error } = await supabaseAdmin
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
      if (!error && data) {
        challenge = data;
      }
    } catch (e) {
      console.error("Failed to query challenge details:", e);
    }

    if (!challenge) {
      // If challenge does not exist, redirect to dashboard
      redirect("/dashboard");
    }

    // Compile leaderboard standing and participant details
    let leaderboard: any[] = [];
    let userJoined = false;
    let participantsCount = 0;
    let userRank = null;
    let userProgress = 0;

    try {
      const { data: participations, error: partError } = await supabaseAdmin
        .from("challenge_participants")
        .select("*")
        .eq("challenge_id", challengeId);

      if (!partError && participations) {
        participantsCount = participations.length;
        userJoined = participations.some((p: any) => p.user_id === user.id);

        const participantUserIds = participations.map((p: any) => p.user_id);
        if (participantUserIds.length > 0) {
          // Fetch profiles of all participants
          const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select("id, name, avatar")
            .in("id", participantUserIds);

          // Fetch activities of all participants within challenge date range
          const challengeStart = `${challenge.start_date}T00:00:00Z`;
          const challengeEnd = `${challenge.end_date}T23:59:59Z`;

          const { data: actData } = await supabaseAdmin
            .from("activities")
            .select("user_id, distance, total_elevation_gain, moving_time, start_date, sport_type")
            .in("user_id", participantUserIds)
            .gte("start_date", challengeStart)
            .lte("start_date", challengeEnd);

          // Calculate progress for each user
          const userTotals: Record<string, number> = {};
          participantUserIds.forEach(uid => { userTotals[uid] = 0; });

          actData?.forEach((act: any) => {
            const matchesSport = 
              challenge.sport_type === "Multisport" ||
              act.sport_type?.toLowerCase() === challenge.sport_type?.toLowerCase() ||
              (challenge.sport_type === "Ride" && act.sport_type === "VirtualRide");

            if (matchesSport) {
              if (challenge.goal_metric === "Distance") {
                userTotals[act.user_id] += Number(act.distance || 0) / 1000;
              } else if (challenge.goal_metric === "Elevation") {
                userTotals[act.user_id] += Number(act.total_elevation_gain || 0);
              } else if (challenge.goal_metric === "Time" || challenge.goal_metric === "Duration") {
                userTotals[act.user_id] += Number(act.moving_time || 0) / 3600;
              }
            }
          });

          leaderboard = participations.map((p: any) => {
            const prof = profiles?.find((pr: any) => pr.id === p.user_id);
            return {
              userId: p.user_id,
              name: prof?.name || "Athlete",
              avatar: prof?.avatar || "",
              completed: Number((userTotals[p.user_id] || 0).toFixed(1))
            };
          });

          // Sort descending by progress
          leaderboard.sort((a, b) => b.completed - a.completed);

          const rankIndex = leaderboard.findIndex(item => item.userId === user.id);
          userRank = rankIndex !== -1 ? rankIndex + 1 : null;
          userProgress = userTotals[user.id] || 0;
        }
      }
    } catch (e) {
      console.error("Failed to compile challenge standings:", e);
    }

    // Parse challenge format matching dashboard
    const challengeDetails = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description || "",
      sportType: challenge.sport_type,
      goalType: challenge.goal_metric,
      goalTarget: Number(challenge.goal_target),
      startDate: challenge.start_date,
      endDate: challenge.end_date,
      bannerUrl: challenge.banner_url || "",
      status: challenge.status,
      userJoined,
      participantsCount,
      userRank,
      userProgress: Number(userProgress.toFixed(1)),
      leaderboard: leaderboard.slice(0, 5), // Top 5
    };

    return (
      <ChallengeClient
        profile={profile}
        challenge={challengeDetails}
      />
    );
  } catch (e: any) {
    if (e.digest?.startsWith("NEXT_REDIRECT") || e.digest === "DYNAMIC_SERVER_USAGE" || e.message?.includes("Dynamic server usage") || e.name === "DynamicServerError") {
      throw e;
    }
    console.error("Challenge Details server rendering crashed:", e);
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 max-w-md w-full text-center shadow-lg">
          <h2 className="text-xl font-bold text-white mb-2">Failed to load Challenge Details</h2>
          <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
            An error occurred while loading this challenge. Please try again or return to the dashboard.
          </p>
          <div className="flex gap-3 justify-center">
            <a href={`/challenge/${challengeId}`} className="px-4 py-2 bg-lime-500 text-black text-xs font-bold rounded-lg hover:bg-lime-400 transition">Retry Loading</a>
            <a href="/dashboard" className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-700 transition">Back to Dashboard</a>
          </div>
        </div>
      </div>
    );
  }
}
