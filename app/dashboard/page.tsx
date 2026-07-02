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

/**
 * Server Component: /dashboard
 * Resolves authentication status, query params, and fetches public profile data server-side.
 * Renders the interactive DashboardClient component with diagnostics.
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = await searchParams;
  const error = typeof resolvedParams.error === "string" ? resolvedParams.error : undefined;
  const info = typeof resolvedParams.info === "string" ? resolvedParams.info : undefined;
  const stravaConnected = typeof resolvedParams.strava_connected === "string" ? resolvedParams.strava_connected : undefined;

  try {
    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();
    
    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      redirect("/login");
    }

    // Fetch corresponding profile records from the database
    let profile = null;
    let profileLookupResult = "";
    try {
      console.log("Starting dashboard query: Fetch profiles");
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      console.log(`Finished dashboard query: Fetch profiles. Query returned ${data ? 1 : 0} rows`);
        
      if (!profileError && data) {
        profile = data;
        profileLookupResult = `Success (strava_connected: ${data.strava_connected})`;
      } else {
        profileLookupResult = `Failed: ${profileError?.message || "No profile found"}`;
      }
    } catch (e: unknown) {
      console.error("Failed to query profiles for dashboard page:", e);
      const errMsg = e instanceof Error ? e.message : "Unexpected exception";
      profileLookupResult = `Error: ${errMsg}`;
    }

    // Verify that the profile exists and matches the user ID exactly. If missing, automatically recreate it.
    if (!profile || profile.id !== user.id) {
      console.log(`Profile missing or mismatched for authenticated user ${user.id}. Recreating from session metadata...`);
      const var_name = user.user_metadata?.full_name || user.user_metadata?.name || "Athlete";
      const var_avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
      const var_provider = user.app_metadata?.provider || "google";

      try {
        console.log("Starting dashboard query: Recreate profile");
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
        console.log(`Finished dashboard query: Recreate profile. Query returned ${newProfile ? 1 : 0} rows`);

        if (createProfileError || !newProfile) {
          console.error(`Failed to recreate profile for user ${user.id}:`, createProfileError || "No data returned");
          redirect("/api/auth/logout?error=unauthorized");
        } else {
          profile = newProfile;
          profileLookupResult = `Recreated Profile (strava_connected: ${newProfile.strava_connected})`;
        }
      } catch (e) {
        if (e instanceof Error && (e as any).digest?.startsWith("NEXT_REDIRECT")) throw e;
        console.error("Failed to insert recreated profile:", e);
        redirect("/api/auth/logout?error=unauthorized");
      }
    }

    // Redirect ORGANIZATION_ADMIN to the admin route as their primary experience
    if (profile && profile.role === "organization_admin") {
      redirect("/arena-admin");
    }

    // Fetch associated athlete details if Strava is connected
    let stravaConnection = null;
    let activities: {
      name: string;
      sport_type: string;
      distance: number;
      moving_time: number;
      start_date: string;
    }[] = [];
    let activitiesCount = 0;
    let allActivities: any[] = [];

    if (profile.strava_connected) {
      try {
        console.log("Starting dashboard query: Fetch strava_connections");
        const { data: connData, error: connError } = await supabaseAdmin
          .from("strava_connections")
          .select("athlete_name, athlete_username, athlete_avatar, created_at")
          .eq("user_id", user.id)
          .single();
        console.log(`Finished dashboard query: Fetch strava_connections. Query returned ${connData ? 1 : 0} rows`);
        
        if (!connError && connData) {
          stravaConnection = connData;
        }
      } catch (e) {
        console.error("Failed to query strava_connections:", e);
      }

      // Fetch latest 5 activities
      try {
        console.log("Starting dashboard query: Fetch latest 5 activities");
        const { data: actData, error: actError } = await supabase
          .from("activities")
          .select("name, sport_type, distance, moving_time, start_date, average_speed, total_elevation_gain")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false })
          .limit(5);
        console.log(`Finished dashboard query: Fetch latest 5 activities. Query returned ${actData?.length || 0} rows`);

        if (!actError && actData) {
          activities = actData;
        }
      } catch (e) {
        console.error("Failed to query latest 5 activities:", e);
      }

      // Fetch all user activities for dynamic challenge progress calculations
      try {
        console.log("Starting dashboard query: Fetch all activities");
        const { data: allActData, error: allActError } = await supabase
          .from("activities")
          .select("name, sport_type, distance, total_elevation_gain, moving_time, start_date, average_speed")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false });
        console.log(`Finished dashboard query: Fetch all activities. Query returned ${allActData?.length || 0} rows`);

        if (!allActError && allActData) {
          allActivities = allActData;
        }
      } catch (e) {
        console.error("Failed to query all activities:", e);
      }

      // Fetch count of all activities
      try {
        console.log("Starting dashboard query: Fetch activities count");
        const { count, error: countError } = await supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        console.log(`Finished dashboard query: Fetch activities count. Query returned count ${count || 0}`);

        if (!countError && count !== null) {
          activitiesCount = count;
        }
      } catch (e) {
        console.error("Failed to query activities count:", e);
      }
    }

    // Fetch overall db connections count using admin client
    let totalConnectionsCount = 0;
    try {
      console.log("Starting dashboard query: Fetch total connections count");
      const { count, error: countError } = await supabaseAdmin
        .from("strava_connections")
        .select("*", { count: "exact", head: true });
      console.log(`Finished dashboard query: Fetch total connections count. Query returned count ${count || 0}`);
      if (!countError && count !== null) {
        totalConnectionsCount = count;
      }
    } catch (e) {
      console.error("Failed to fetch overall db connection count:", e);
    }

    // Fetch active challenges and calculate leaderboard & standings dynamically on the server
    const activeChallenges: any[] = [];
    try {
      console.log("Starting dashboard query: Fetch active challenges");
      const { data: dbChallenges, error: challengesError } = await supabaseAdmin
        .from("challenges")
        .select("*")
        .in("status", ["active", "upcoming"])
        .order("created_at", { ascending: false });
      console.log(`Finished dashboard query: Fetch active challenges. Query returned ${dbChallenges?.length || 0} rows`);

      if (!challengesError && dbChallenges) {
        console.log("Starting dashboard query: Fetch challenge participations");
        let dbParticipations: any[] = [];
        try {
          const { data } = await supabaseAdmin
            .from("challenge_participants")
            .select("*");
          dbParticipations = data || [];
        } catch (e) {
          console.error("Failed to query challenge participants:", e);
        }
        console.log(`Finished dashboard query: Fetch challenge participations. Query returned ${dbParticipations.length} rows`);

        for (const c of dbChallenges) {
          try {
            const challengeParts = dbParticipations.filter((p: any) => p.challenge_id === c.id);
            const participantUserIds = challengeParts.map((p: any) => p.user_id);
            
            let userRank = null;
            let leaderboard: any[] = [];

            if (participantUserIds.length > 0) {
              // Fetch activities of all challenge participants within challenge date range
              console.log(`Starting dashboard query: Fetch activities for challenge ${c.id}`);
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
              console.log(`Finished dashboard query: Fetch activities for challenge ${c.id}. Query returned ${actData.length} rows`);

              // Group by user
              const userTotals: Record<string, number> = {};
              participantUserIds.forEach(uid => { userTotals[uid] = 0; });

              actData.forEach((act: any) => {
                const matchesSport = 
                  c.sport_type === "Multisport" || 
                  act.sport_type?.toLowerCase() === c.sport_type?.toLowerCase();

                if (matchesSport) {
                  if (c.goal_metric === "Distance") {
                    userTotals[act.user_id] += Number(act.distance) / 1000;
                  } else if (c.goal_metric === "Elevation") {
                    userTotals[act.user_id] += Number(act.total_elevation_gain || 0);
                  } else if (c.goal_metric === "Time" || c.goal_metric === "Duration") {
                    userTotals[act.user_id] += Number(act.moving_time || 0) / 3600;
                  }
                }
              });

              // Fetch profiles to get names/avatars
              console.log(`Starting dashboard query: Fetch profiles for challenge ${c.id}`);
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
              console.log(`Finished dashboard query: Fetch profiles for challenge ${c.id}. Query returned ${profiles.length} rows`);

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
              leaderboard: leaderboard.slice(0, 5), // Top 5
              slug: c.slug || c.title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-"),
            });
          } catch (e) {
            console.error(`Failed to compile challenge ${c.id} standing:`, e);
          }
        }
      }
    } catch (e) {
      console.error("Failed to compile active challenges on server:", e);
    }

    const combinedProfile = {
      ...profile,
      strava_connection: stravaConnection,
      activities,
      activities_count: activitiesCount,
      all_activities: allActivities,
    };

    // Build diagnostics bundle
    const diagnostics = {
      supabaseUser: {
        id: user.id,
        email: user.email || "N/A",
        provider: user.app_metadata?.provider || "N/A",
        lastSignIn: user.last_sign_in_at || "N/A",
      },
      athleteId: profile.strava_athlete_id || "N/A",
      existingConnectionCount: totalConnectionsCount,
      oauthCallbackResult: error ? `Error: ${error}` : (stravaConnected ? `Success: ${stravaConnected}` : (info ? `Info: ${info}` : "No callback active")),
      profileLookupResult: profileLookupResult,
    };

    return (
      <DashboardClient 
        initialProfile={combinedProfile} 
        errorParam={error}
        infoParam={info}
        diagnostics={diagnostics}
        activeChallenges={activeChallenges}
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
          <h2 className="text-xl font-bold text-white mb-2">Failed to load Dashboard</h2>
          <p className="text-zinc-400 text-xs mb-4 leading-relaxed">
            An error occurred while loading your profile and fitness challenges. This might be due to a database connection timeout or configuration setup.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/dashboard" className="px-4 py-2 bg-lime-500 text-black text-xs font-bold rounded-lg hover:bg-lime-400 transition">Reload Page</a>
            <a href="/api/auth/logout" className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-700 transition">Sign Out</a>
          </div>
        </div>
      </div>
    );
  }
}
