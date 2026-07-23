import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard",
  description: "Manage your connected trackers, view active challenges, and customize your athlete profile.",
};

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  console.log("Dashboard mounted");
  
  const resolvedParams = await searchParams;
  const error = typeof resolvedParams.error === "string" ? resolvedParams.error : undefined;
  const info = typeof resolvedParams.info === "string" ? resolvedParams.info : undefined;
  const stravaConnected = typeof resolvedParams.strava_connected === "string" ? resolvedParams.strava_connected : undefined;

  try {
    const requiredEnvVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar] || process.env[envVar]?.includes("placeholder")) {
        console.warn(`[WARNING] Missing or placeholder environment variable: ${envVar}`);
      }
    }

    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();
    
    // Verify user session
    let user = null;
    let authError = null;
    try {
      const result = await supabase.auth.getUser();
      user = result.data?.user;
      authError = result.error;
    } catch (e) {
      console.error("Failed to fetch user session:", e);
      authError = e;
    }
    
    if (authError || !user) {
      redirect("/login");
    }

    console.log("Fetching profile");
    let profile = null;
    let profileLookupResult = "";
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (!profileError && data) {
        profile = data;
        profileLookupResult = `Success`;
      } else {
        profileLookupResult = `Failed: ${profileError?.message || "No profile found"}`;
      }
    } catch (e: unknown) {
      console.error("Failed to query profiles for dashboard page:", e);
      profileLookupResult = `Error: Exception`;
    }
    console.log(profile);

    // Verify profile exists
    if (!profile || profile.id !== user.id) {
      const var_name = user.user_metadata?.full_name || user.user_metadata?.name || "Athlete";
      const var_avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
      const var_provider = user.app_metadata?.provider || "google";

      try {
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

        if (!createProfileError && newProfile) {
          profile = newProfile;
          profileLookupResult = `Recreated Profile`;
        }
      } catch (e) {
        console.error("Failed to insert recreated profile:", e);
      }
    }

    if (profile && profile.role === "organization_admin") {
      redirect("/arena-admin");
    }

    console.log("Fetching daily goals");
    let dailyGoal = null;
    try {
      const { data, error } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (!error && data) {
        dailyGoal = data;
      }
    } catch (e) {
      console.error("Daily goals failed", e);
    }
    console.log(dailyGoal);

    let dailyGoalHistory = null;
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("daily_goal_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .single();
      if (!error && data) {
        dailyGoalHistory = data;
      }
    } catch (e) {
      console.error("Failed to query daily_goal_history:", e);
    }

    let stravaConnection = null;
    let activities: any[] = [];
    let activitiesCount = 0;
    let allActivities: any[] = [];

    if (profile?.strava_connected) {
      try {
        const { data: connData, error: connError } = await supabaseAdmin
          .from("strava_connections")
          .select("athlete_name, athlete_username, athlete_avatar, created_at")
          .eq("user_id", user.id)
          .single();
        if (!connError && connData) {
          stravaConnection = connData;
        }
      } catch (e) {
        console.error("Failed to query strava_connections:", e);
      }

      try {
        const { data: actData, error: actError } = await supabase
          .from("activities")
          .select("name, sport_type, distance, moving_time, start_date, average_speed, total_elevation_gain")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false })
          .limit(5);
        if (!actError && actData) {
          activities = actData;
        }
      } catch (e) {
        console.error("Failed to query latest 5 activities:", e);
      }

      try {
        const { data: allActData, error: allActError } = await supabase
          .from("activities")
          .select("name, sport_type, distance, total_elevation_gain, moving_time, start_date, average_speed")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false });
        if (!allActError && allActData) {
          allActivities = allActData;
        }
      } catch (e) {
        console.error("Failed to query all activities:", e);
      }

      try {
        const { count, error: countError } = await supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        if (!countError && count !== null) {
          activitiesCount = count;
        }
      } catch (e) {
        console.error("Failed to query activities count:", e);
      }
    }

    let totalConnectionsCount = 0;
    try {
      const { count, error: countError } = await supabaseAdmin
        .from("strava_connections")
        .select("*", { count: "exact", head: true });
      if (!countError && count !== null) {
        totalConnectionsCount = count;
      }
    } catch (e) {
      console.error("Failed to fetch overall db connection count:", e);
    }

    console.log("Fetching challenges");
    const activeChallenges: any[] = [];
    let dbChallenges = null;
    try {
      const { data, error: challengesError } = await supabaseAdmin
        .from("challenges")
        .select("*")
        .in("status", ["active", "upcoming"])
        .order("created_at", { ascending: false });
      if (!challengesError && data) {
        dbChallenges = data;
      }
    } catch (e) {
      console.error("Failed to fetch challenges:", e);
    }
    
    if (dbChallenges) {
        let dbParticipations: any[] = [];
        try {
          const { data } = await supabaseAdmin
            .from("challenge_participants")
            .select("*");
          dbParticipations = data || [];
        } catch (e) {
          console.error("Failed to query challenge participants:", e);
        }

        for (const c of dbChallenges) {
          try {
            const challengeParts = dbParticipations.filter((p: any) => p.challenge_id === c.id);
            const participantUserIds = challengeParts.map((p: any) => p.user_id);
            
            let userRank = null;
            let leaderboard: any[] = [];

            if (participantUserIds.length > 0) {
              let actData: any[] = [];
              try {
                const { data } = await supabaseAdmin
                  .from("activities")
                  .select("user_id, distance, total_elevation_gain, moving_time, start_date, sport_type")
                  .in("user_id", participantUserIds)
                  .gte("start_date", `${c.start_date}T00:00:00Z`)
                  .lte("start_date", `${c.end_date}T23:59:59Z`);
                actData = data || [];
              } catch (e) {
                console.error(`Failed to fetch activities for challenge ${c.id}:`, e);
              }

              const userTotals: Record<string, number> = {};
              participantUserIds.forEach(uid => { userTotals[uid] = 0; });

              actData.forEach((act: any) => {
                const matchesSport = 
                  c.sport_type === "Multisport" || 
                  act.sport_type?.toLowerCase() === c.sport_type?.toLowerCase();

                if (matchesSport) {
                  if (c.goal_metric === "Distance") {
                    userTotals[act.user_id] += Number(act.distance || 0) / 1000;
                  } else if (c.goal_metric === "Elevation") {
                    userTotals[act.user_id] += Number(act.total_elevation_gain || 0);
                  } else if (c.goal_metric === "Time" || c.goal_metric === "Duration") {
                    userTotals[act.user_id] += Number(act.moving_time || 0) / 3600;
                  }
                }
              });

              let profiles: any[] = [];
              try {
                const { data } = await supabaseAdmin
                  .from("profiles")
                  .select("id, name, avatar")
                  .in("id", participantUserIds);
                profiles = data || [];
              } catch (e) {
                console.error(`Failed to fetch profiles for challenge ${c.id}:`, e);
              }

              leaderboard = challengeParts.map((p: any) => {
                const prof = profiles.find((pr: any) => pr.id === p.user_id);
                return {
                  userId: p.user_id,
                  name: prof?.name || "Athlete",
                  avatar: prof?.avatar || "",
                  completed: userTotals[p.user_id] || 0
                };
              });

              leaderboard.sort((a, b) => b.completed - a.completed);
              const rankIndex = leaderboard.findIndex(item => item.userId === user.id);
              userRank = rankIndex !== -1 ? rankIndex + 1 : null;
            }

            activeChallenges.push({
              id: c.id,
              title: c.title,
              description: c.description || "",
              sportType: c.sport_type,
              goalType: c.goal_metric,
              goalTarget: Number(c.goal_target),
              startDate: c.start_date,
              endDate: c.end_date,
              bannerUrl: c.banner_url || "",
              status: c.status,
              userJoined: participantUserIds.includes(user.id),
              participantsCount: participantUserIds.length,
              userRank,
              leaderboard: leaderboard.slice(0, 5),
              slug: c.slug || c.title?.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-"),
            });
          } catch (e) {
            console.error(`Failed to compile challenge ${c.id} standing:`, e);
          }
        }
    }
    console.log(activeChallenges);

    console.log("Fetching community feed");
    let communityFeed: any[] = [];
    try {
      const { data, error: feedError } = await supabaseAdmin
        .from("community_feed")
        .select("*")
        .order("created_at", { ascending: false });
      if (!feedError && data) {
        communityFeed = data;
      }
    } catch (e) {
      console.error("Failed to query community feed on server:", e);
    }
    console.log(communityFeed);

    const combinedProfile = {
      ...profile,
      strava_connection: stravaConnection,
      activities,
      activities_count: activitiesCount,
      all_activities: allActivities,
      dailyGoal,
      dailyGoalHistory,
    };

    const diagnostics = {
      supabaseUser: {
        id: user.id,
        email: user.email || "N/A",
        provider: user.app_metadata?.provider || "N/A",
        lastSignIn: user.last_sign_in_at || "N/A",
      },
      athleteId: profile?.strava_athlete_id || "N/A",
      existingConnectionCount: totalConnectionsCount,
      oauthCallbackResult: error ? `Error: ${error}` : (stravaConnected ? `Success: ${stravaConnected}` : (info ? `Info: ${info}` : "No callback active")),
      profileLookupResult: profileLookupResult,
    };

    console.log("Dashboard render completed");
    return (
      <DashboardClient 
        initialProfile={combinedProfile as any} 
        errorParam={error}
        infoParam={info}
        diagnostics={diagnostics}
        activeChallenges={activeChallenges}
        communityFeed={communityFeed}
      />
    );
  } catch (e: any) {
    if (e.digest?.startsWith("NEXT_REDIRECT") || e.digest === "DYNAMIC_SERVER_USAGE" || e.message?.includes("Dynamic server usage") || e.name === "DynamicServerError") {
      throw e;
    }
    console.error("Dashboard server-side rendering crashed:", e);
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 max-w-md w-full text-center shadow-lg">
          <h2 className="text-xl font-bold text-white mb-2">Dashboard failed to load</h2>
          <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
            {e instanceof Error ? e.message : "An unknown error occurred."}
          </p>
        </div>
      </div>
    );
  }
}
