"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cpu, Trophy, UserCheck, Users, Activity, Layers, Award, Compass, 
  BarChart3, Download, Settings, Bell, LogOut, Menu, Calendar, X, 
  Search, ArrowRight, CheckCircle, RefreshCw, AlertTriangle, AlertCircle, 
  Sparkles, ShieldCheck, Flame, ChevronRight, Send, Check, ShieldAlert,
  ArrowLeft, Clock, HelpCircle, Loader2, Play, Milestone
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfilesProps {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  auth_provider: string | null;
  strava_connected: boolean;
  strava_athlete_id: string | null;
  role: string;
  created_at: string;
  last_synced_at: string | null;
}

interface StravaConnsProps {
  user_id: string;
  strava_athlete_id: string;
  athlete_name: string | null;
  athlete_username: string | null;
  athlete_avatar: string | null;
  expires_at: string;
}

interface ChallengesProps {
  id: string;
  title: string;
  description: string | null;
  sport_type: string;
  goal_metric: string;
  goal_target: number;
  start_date: string;
  end_date: string;
  banner_url: string | null;
  status: string;
  challenge_code?: string;
  slug?: string;
}

interface ParticipationsProps {
  challenge_id: string;
  user_id: string;
  joined_at: string;
}

interface ActivitiesProps {
  id: string;
  user_id: string;
  strava_activity_id: number | null;
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number | null;
  start_date: string;
  sport_type: string;
}

interface AthletesClientProps {
  profile: ProfilesProps;
  userRole: string;
  initialProfiles: ProfilesProps[];
  initialStravaConns: StravaConnsProps[];
  initialChallenges: ChallengesProps[];
  initialParticipations: ParticipationsProps[];
  initialActivities: ActivitiesProps[];
}

export default function AthletesClient({
  profile,
  userRole,
  initialProfiles,
  initialStravaConns,
  initialChallenges,
  initialParticipations,
  initialActivities,
}: AthletesClientProps) {
  const router = useRouter();

  // Toast notifications state
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; type: "success" | "error" | "info" | "warning" }[]>([]);
  const addNotification = (title: string, message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // all, connected, disconnected, active_week, cyclist, runner, walker
  const [activeSort, setActiveSort] = useState("distance"); // distance, activities, rank, active
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  // Notifications dropdown menu state
  const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false);

  // Admin action states
  const [syncingAthlete, setSyncingAthlete] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationText, setNotificationText] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const getInitials = (n: string | null) => {
    if (!n) return "A";
    return n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  };

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout failed:", e);
      addNotification("Logout Failed", "An error occurred during sign out.", "error");
    } finally {
      localStorage.removeItem("kyl_mock_user");
      localStorage.removeItem("kyl_mock_strava_linked");
      localStorage.removeItem("kyl_mock_activities_synced");
      localStorage.removeItem("kyl_mock_last_synced_at");
      localStorage.removeItem("kyl_mock_role");
      localStorage.removeItem("kyl_remember_device");
      document.cookie = "kyl-remember-device=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      setLoadingLogout(false);
      window.location.href = "/";
    }
  };

  // Enrich & calculate athlete details
  const athletes = useMemo(() => {
    // 1. Calculate base athlete details
    const parsed = initialProfiles.map((prof) => {
      const conn = initialStravaConns.find(c => c.user_id === prof.id);
      const userActs = initialActivities.filter(a => a.user_id === prof.id);

      // Calculate total distance (all activities)
      const totalDistance = userActs.reduce((sum, act) => sum + Number(act.distance || 0), 0) / 1000;

      // Calculate elevation gain (all activities)
      const totalElevation = userActs.reduce((sum, act) => sum + Number(act.total_elevation_gain || 0), 0);

      // Calculate dominant sport type
      const sportCounts = { Ride: 0, Run: 0, Walk: 0 };
      userActs.forEach(act => {
        const t = act.sport_type;
        if (t === "Ride" || t === "VirtualRide") sportCounts.Ride++;
        else if (t === "Run") sportCounts.Run++;
        else if (t === "Walk" || t === "Hike") sportCounts.Walk++;
      });

      let dominantSport = "Cyclist";
      if (sportCounts.Run > sportCounts.Ride && sportCounts.Run > sportCounts.Walk) dominantSport = "Runner";
      else if (sportCounts.Walk > sportCounts.Ride && sportCounts.Walk > sportCounts.Run) dominantSport = "Walker";
      else if (userActs.length === 0) dominantSport = "N/A";

      // Calculate Streak
      const dates = userActs
        .map(act => act.start_date ? act.start_date.split("T")[0] : "")
        .filter(Boolean);
      const uniqueSortedDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));

      let streak = 0;
      if (uniqueSortedDates.length > 0) {
        streak = 1;
        // Verify if streak is current (latest activity is today or yesterday)
        const todayStr = new Date().toISOString().split("T")[0];
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const latest = uniqueSortedDates[0];
        if (latest === todayStr || latest === yesterdayStr) {
          for (let i = 0; i < uniqueSortedDates.length - 1; i++) {
            const current = new Date(uniqueSortedDates[i]);
            const next = new Date(uniqueSortedDates[i + 1]);
            const diffTime = Math.abs(current.getTime() - next.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              streak++;
            } else {
              break;
            }
          }
        } else {
          // If latest activity was older, current streak is 0
          streak = 0;
        }
      }

      // Enrolled challenges details
      const athleteParticipations = initialParticipations.filter(p => p.user_id === prof.id);
      const enrolledChallenges = athleteParticipations.map(p => {
        const challenge = initialChallenges.find(c => c.id === p.challenge_id);
        if (!challenge) return null;

        const challengeStart = `${challenge.start_date}T00:00:00Z`;
        const challengeEnd = `${challenge.end_date}T23:59:59Z`;

        const matchingActs = userActs.filter(act => {
          if (act.start_date < challengeStart || act.start_date > challengeEnd) return false;
          const matchesSport = 
            challenge.sport_type === "Multisport" ||
            act.sport_type?.toLowerCase() === challenge.sport_type?.toLowerCase() ||
            (challenge.sport_type === "Ride" && act.sport_type === "VirtualRide");
          return matchesSport;
        });

        let progress = 0;
        matchingActs.forEach(act => {
          if (challenge.goal_metric === "Distance") {
            progress += Number(act.distance || 0) / 1000;
          } else if (challenge.goal_metric === "Elevation") {
            progress += Number(act.total_elevation_gain || 0);
          } else if (challenge.goal_metric === "Time" || challenge.goal_metric === "Duration") {
            progress += Number(act.moving_time || 0) / 3600;
          }
        });

        // Compute rank of this athlete in this specific challenge
        const otherParticipants = initialParticipations.filter(part => part.challenge_id === challenge.id);
        const standings = otherParticipants.map(part => {
          const pActs = initialActivities.filter(a => a.user_id === part.user_id);
          const pMatchingActs = pActs.filter(act => {
            if (act.start_date < challengeStart || act.start_date > challengeEnd) return false;
            const matchesSport = 
              challenge.sport_type === "Multisport" ||
              act.sport_type?.toLowerCase() === challenge.sport_type?.toLowerCase() ||
              (challenge.sport_type === "Ride" && act.sport_type === "VirtualRide");
            return matchesSport;
          });

          let pProgress = 0;
          pMatchingActs.forEach(act => {
            if (challenge.goal_metric === "Distance") {
              pProgress += Number(act.distance || 0) / 1000;
            } else if (challenge.goal_metric === "Elevation") {
              pProgress += Number(act.total_elevation_gain || 0);
            } else if (challenge.goal_metric === "Time" || challenge.goal_metric === "Duration") {
              pProgress += Number(act.moving_time || 0) / 3600;
            }
          });
          return { user_id: part.user_id, progress: pProgress };
        });

        standings.sort((a, b) => b.progress - a.progress);
        const rank = standings.findIndex(s => s.user_id === prof.id) + 1;

        return {
          id: challenge.id,
          title: challenge.title,
          goalMetric: challenge.goal_metric,
          goalTarget: Number(challenge.goal_target),
          progress: Number(progress.toFixed(1)),
          percentage: Math.min(100, Math.round((progress / Number(challenge.goal_target)) * 100)),
          rank: rank > 0 ? rank : standings.length + 1,
          status: challenge.status
        };
      }).filter((ec): ec is NonNullable<typeof ec> => ec !== null);

      // Sum of distance logged inside any challenge
      let challengeDistance = 0;
      enrolledChallenges.forEach(ec => {
        if (ec.goalMetric === "Distance") {
          challengeDistance += ec.progress;
        }
      });

      return {
        id: prof.id,
        name: prof.name || "Athlete",
        email: prof.email || "",
        avatar: prof.avatar || "",
        athleteId: prof.strava_athlete_id || "N/A",
        stravaConnected: prof.strava_connected,
        joinedAt: prof.created_at ? new Date(prof.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
        totalDistance: Number(totalDistance.toFixed(1)),
        totalActivities: userActs.length,
        elevationGain: Math.round(totalElevation),
        activeStreak: streak,
        sportType: dominantSport,
        lastSyncTime: prof.last_synced_at ? new Date(prof.last_synced_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never",
        rawLastSyncTime: prof.last_synced_at,
        challengeDistance: Number(challengeDistance.toFixed(1)),
        currentRank: 0,
        enrolledChallenges,
        recentActivities: userActs.slice(0, 8).map(act => ({
          id: act.id,
          name: act.name || "Workout",
          sportType: act.sport_type || "Workout",
          distance: Number((Number(act.distance || 0) / 1000).toFixed(1)),
          movingTime: Number(act.moving_time || 0),
          startDate: act.start_date ? new Date(act.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"
        })),
        latestActivityDate: userActs.length > 0 ? userActs[0].start_date : null
      };
    });

    // 2. Compute dynamic rank sorted by challenge distance descending
    const sortedByChallenge = [...parsed].sort((a, b) => b.challengeDistance - a.challengeDistance);
    parsed.forEach(ath => {
      ath.currentRank = sortedByChallenge.findIndex(s => s.id === ath.id) + 1;
    });

    return parsed;
  }, [initialProfiles, initialStravaConns, initialChallenges, initialParticipations, initialActivities]);

  // Sidebar Links
  const sidebarLinks = [
    { title: "Dashboard", icon: Cpu, active: false, href: "/arena-admin" },
    { title: "Challenges", icon: Trophy, active: false, href: "/arena-admin" },
    { title: "Participants", icon: UserCheck, active: false, href: "/arena-admin" },
    { title: "Athletes", icon: Users, active: true, href: "/arena-admin/athletes" },
    { title: "Activities", icon: Activity, active: false, href: "/arena-admin" },
    { title: "Leaderboard", icon: Layers, active: false, href: "/arena-admin" },
    { title: "Achievements", icon: Award, active: false, href: "/arena-admin" },
    { title: "Community", icon: Compass, active: false, href: "/arena-admin" },
    { title: "Performance", icon: BarChart3, active: false, href: "/arena-admin" },
    { title: "Reports", icon: Download, active: false, href: "/arena-admin" },
    { title: "Sync Health", icon: RefreshCw, active: false, href: "/arena-admin" },
    { title: "Integrations", icon: Settings, active: false, href: "/arena-admin" },
  ];

  // Filters & Sorting logic
  const filteredAthletes = useMemo(() => {
    return athletes
      .filter((ath) => {
        // Search query check
        const matchQuery = 
          ath.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ath.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ath.athleteId.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchQuery) return false;

        // Filter state check
        if (activeFilter === "connected") return ath.stravaConnected;
        if (activeFilter === "disconnected") return !ath.stravaConnected;
        if (activeFilter === "active_week") {
          if (!ath.latestActivityDate) return false;
          const activityTime = new Date(ath.latestActivityDate).getTime();
          return (Date.now() - activityTime) <= 7 * 24 * 3600 * 1000;
        }
        if (activeFilter === "cyclist") return ath.sportType === "Cyclist";
        if (activeFilter === "runner") return ath.sportType === "Runner";
        if (activeFilter === "walker") return ath.sportType === "Walker";
        
        return true;
      })
      .sort((a, b) => {
        if (activeSort === "distance") return b.totalDistance - a.totalDistance;
        if (activeSort === "activities") return b.totalActivities - a.totalActivities;
        if (activeSort === "rank") return a.currentRank - b.currentRank;
        if (activeSort === "active") {
          if (!a.latestActivityDate) return 1;
          if (!b.latestActivityDate) return -1;
          return new Date(b.latestActivityDate).getTime() - new Date(a.latestActivityDate).getTime();
        }
        return 0;
      });
  }, [athletes, searchQuery, activeFilter, activeSort]);

  // Selected athlete detail
  const selectedAthlete = useMemo(() => {
    if (!selectedAthleteId) return null;
    return athletes.find(a => a.id === selectedAthleteId) || null;
  }, [athletes, selectedAthleteId]);

  // Force Sync selected athlete
  const handleForceSync = async (userId: string) => {
    if (!selectedAthlete) return;
    setSyncingAthlete(true);
    addNotification("Sync Action Triggered", `Initializing Strava refresh pipeline for ${selectedAthlete.name}...`, "info");
    
    try {
      const res = await fetch("/api/admin/sync-athlete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        addNotification("Sync Finished", `Successfully synchronized ${data.activitiesCount} workouts for ${selectedAthlete.name}.`, "success");
        router.refresh();
      } else {
        addNotification("Sync Action Failed", data.error || "Strava connection synchronization timed out.", "error");
      }
    } catch (err: any) {
      addNotification("Connection Error", err.message || "Could not contact admin operations pipeline.", "error");
    } finally {
      setSyncingAthlete(false);
    }
  };

  // Export CSV Report
  const handleExportAthleteReport = (ath: typeof athletes[0]) => {
    const headers = "Activity Name,Sport Type,Distance (km),Moving Time (sec),Date Synced\n";
    const rows = ath.recentActivities.map(act => 
      `"${act.name.replace(/"/g, '""')}",${act.sportType},${act.distance},${act.movingTime},"${act.startDate}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kyl_arena_${ath.name.replace(/\s+/g, '_').toLowerCase()}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification("CSV Exported", `Community metrics report downloaded for ${ath.name}.`, "success");
  };

  const handleSendNotificationSubmit = async () => {
    if (!selectedAthlete || !notificationText.trim()) return;
    setSendingNotification(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setSendingNotification(false);
    setIsNotificationModalOpen(false);
    setNotificationText("");
    addNotification("System Dispatch Alert", `Push notification broadcast to ${selectedAthlete.name} successfully.`, "success");
  };

  // Helper to determine sync health status
  const getSyncHealthStatus = (ath: typeof athletes[0]) => {
    if (!ath.stravaConnected) return { color: "red", label: "NOT LINKED", text: "Athlete hasn't completed Strava auth connection." };
    if (!ath.rawLastSyncTime) return { color: "yellow", label: "NEVER SYNCED", text: "Connected but no activity import completed yet." };
    
    const syncTime = new Date(ath.rawLastSyncTime).getTime();
    const daysSinceSync = (Date.now() - syncTime) / (1000 * 60 * 60 * 24);
    
    if (daysSinceSync <= 7) {
      return { color: "green", label: "HEALTHY", text: "Synchronization pipeline active and healthy." };
    } else {
      return { color: "yellow", label: "WARNING", text: "Sync active, but no refresh has occurred in the past 7 days." };
    }
  };

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans overflow-hidden selection:bg-lime-400 selection:text-black">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
      <div className="fixed bottom-10 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse" />

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className="pointer-events-auto flex gap-3 p-4 bg-zinc-900/95 border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md items-start text-left"
            >
              {n.type === "success" && <CheckCircle className="h-5 w-5 text-lime-400 shrink-0 mt-0.5" />}
              {n.type === "error" && <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
              {n.type === "info" && <Sparkles className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />}
              {n.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase text-white tracking-wide">{n.title}</p>
                <p className="text-[10px] text-zinc-400 mt-1 leading-normal font-medium">{n.message}</p>
              </div>
              <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-zinc-550 hover:text-white shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 bg-zinc-950 shrink-0 relative z-20">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <svg className="h-7 w-7 transition-transform duration-500 hover:rotate-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g fill="#22c55e"><circle cx="48" cy="20" r="7" /><path d="M 28 69 C 14 78, 12 79, 10 80 Z" /></g>
          </svg>
          <div className="flex flex-col text-left">
            <span className="text-sm font-black tracking-wider text-white leading-none">
              KYL <span className="text-lime-400">ARENA</span>
            </span>
            <span className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
              ADMIN CONSOLE
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          <span className="text-[8px] uppercase tracking-widest text-zinc-650 font-black px-3 block mb-2">Navigation</span>
          {sidebarLinks.map((link) => (
            <button
              key={link.title}
              onClick={() => {
                if (link.href && link.title !== "Athletes") {
                  router.push(link.href);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] uppercase font-bold tracking-wide transition-all group ${
                link.active 
                  ? "bg-lime-400/10 text-lime-400 border border-lime-400/20" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <link.icon className={`h-4 w-4 shrink-0 transition-transform ${link.active ? "text-lime-400" : "text-zinc-500 group-hover:text-white"}`} />
                <span>{link.title}</span>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* MOBILE HEADER SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 z-50 bg-zinc-950 border-r border-white/5 flex flex-col justify-between lg:hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g fill="#22c55e"><circle cx="48" cy="20" r="7" /><path d="M 28 69 C 14 78, 12 79, 10 80 Z" /></g>
                  </svg>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-black tracking-wider text-white leading-none">
                      KYL <span className="text-lime-400">ARENA</span>
                    </span>
                    <span className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                      ADMIN CONSOLE
                    </span>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-405 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
                {sidebarLinks.map((link) => (
                  <button
                    key={link.title}
                    onClick={() => {
                      setIsSidebarOpen(false);
                      if (link.href && link.title !== "Athletes") {
                        router.push(link.href);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] uppercase font-bold tracking-wide transition-all ${
                      link.active 
                        ? "bg-lime-400/10 text-lime-400 border border-lime-400/20" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="h-4 w-4 shrink-0" />
                      <span>{link.title}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto z-10 relative">
        
        {/* TOP STATUS UTILITY BAR (Polished Header controls top-right permanently) */}
        <header className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-zinc-450 hover:text-white hover:bg-zinc-900 rounded-lg">
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:flex flex-col text-left">
              <h1 className="text-sm font-black uppercase tracking-wider text-white">Athlete Intelligence Center</h1>
              <p className="text-[9px] text-zinc-400 font-medium font-mono">OPERATIONAL INTELLIGENCE & SYNC PIPELINE</p>
            </div>
            <div className="lg:hidden flex flex-col text-left">
              <span className="text-xs font-black uppercase tracking-wider text-white">KYL <span className="text-lime-400">ARENA</span></span>
            </div>
          </div>

          {/* Accounts Controls */}
          <div className="flex items-center gap-3">
            
            {/* Switch to Athlete View */}
            <Link 
              href="/dashboard"
              className="hidden sm:inline-flex h-9 px-3.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 hover:text-white font-extrabold rounded-xl transition-all items-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer"
            >
              Switch to Athlete View
            </Link>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsMenuOpen(!isNotificationsMenuOpen)}
                className={`p-2.5 text-zinc-450 hover:text-white bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 rounded-xl transition-all relative ${isNotificationsMenuOpen ? "border-lime-400/30 text-white" : ""}`}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
              </button>

              <AnimatePresence>
                {isNotificationsMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsNotificationsMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-white/10 rounded-2xl p-4 shadow-[0_15px_45px_rgba(0,0,0,0.8)] z-40 text-left"
                    >
                      <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-3 font-mono flex items-center justify-between">
                        <span>System Notifications</span>
                        <span className="px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-400 text-[8px] font-bold border border-lime-400/20">Active</span>
                      </h3>
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-thin">
                        <div className="p-2 bg-zinc-900/40 rounded-lg border border-white/5">
                          <p className="text-[10px] font-bold text-white uppercase font-mono">Sync Pipeline Stable</p>
                          <p className="text-[9px] text-zinc-400 mt-0.5 leading-normal">All Strava sync instances completed without fatal errors today.</p>
                          <span className="text-[8px] text-zinc-550 font-mono mt-1 block">1 hour ago</span>
                        </div>
                        <div className="p-2 bg-zinc-900/40 rounded-lg border border-white/5">
                          <p className="text-[10px] font-bold text-white uppercase font-mono">New Athlete Connected</p>
                          <p className="text-[9px] text-zinc-400 mt-0.5 leading-normal">A new profile was configured and verified with Strava auth token.</p>
                          <span className="text-[8px] text-zinc-550 font-mono mt-1 block">4 hours ago</span>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile badge (avatar, name, role) */}
            <div className="flex items-center gap-2.5 bg-zinc-900/40 border border-white/5 px-3 py-1.5 rounded-xl backdrop-blur-sm">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar} alt={profile.name || ""} className="h-6 w-6 rounded-full object-cover ring-1 ring-lime-400/30 shrink-0" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-zinc-800 text-[9px] font-black flex items-center justify-center text-lime-400 shrink-0">{getInitials(profile.name)}</div>
              )}
              <div className="text-left hidden md:block">
                <p className="text-[10px] font-black text-white uppercase italic leading-none">{profile.name}</p>
                <p className="text-[8px] text-lime-400 font-mono mt-0.5 leading-none">{userRole.replace("_", " ").toUpperCase()}</p>
              </div>
            </div>

            {/* Sign Out */}
            <button 
              onClick={handleLogout} 
              disabled={loadingLogout} 
              className="p-2.5 text-zinc-450 hover:text-red-400 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-red-950 rounded-xl transition-all cursor-pointer shrink-0" 
              title="Sign Out"
            >
              {loadingLogout ? <Loader2 className="h-4 w-4 animate-spin text-zinc-400" /> : <LogOut className="h-4 w-4" />}
            </button>

          </div>
        </header>

        {/* MASTER-DETAIL CONTENT FRAME */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-4rem)]">

          {/* LEFT PANEL: ATHLETE DIRECTORY */}
          <section className="w-full lg:w-[48%] border-r border-white/5 bg-zinc-950/20 flex flex-col max-h-none lg:max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin">
            <div className="p-4 sm:p-6 space-y-4">
              
              {/* Directory Title */}
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-mono">Athlete Directory</h2>
                <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-white/5 font-mono text-zinc-500 font-bold">
                  {filteredAthletes.length} / {athletes.length} Athletes
                </span>
              </div>

              {/* Global Athlete Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by name, email, or Strava Athlete ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-zinc-900/60 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400/20 transition-all placeholder:text-zinc-600 font-mono"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { id: "all", label: "All Athletes" },
                  { id: "connected", label: "Connected" },
                  { id: "disconnected", label: "Not Connected" },
                  { id: "active_week", label: "Active This Week" },
                  { id: "cyclist", label: "Cyclists" },
                  { id: "runner", label: "Runners" },
                  { id: "walker", label: "Walkers" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                      activeFilter === f.id
                        ? "bg-lime-400/10 text-lime-400 border-lime-400/25 shadow-[0_0_12px_rgba(163,230,53,0.05)]"
                        : "bg-zinc-900/20 text-zinc-450 border-white/5 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sort Controls */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-[9px] uppercase font-black tracking-wider text-zinc-550 font-mono">Sort controls:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "distance", label: "Distance" },
                    { id: "activities", label: "Activities" },
                    { id: "rank", label: "Rank" },
                    { id: "active", label: "Recently Active" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSort(s.id)}
                      className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase transition-all font-mono ${
                        activeSort === s.id
                          ? "text-white underline decoration-lime-400 underline-offset-4"
                          : "text-zinc-505 hover:text-zinc-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Directory Grid / Table list */}
              <div className="space-y-2 pt-2">
                {filteredAthletes.length === 0 ? (
                  <div className="p-12 text-center text-zinc-600 font-mono text-xs border border-dashed border-white/5 rounded-2xl bg-zinc-900/10">
                    No athletes matched search parameters.
                  </div>
                ) : (
                  filteredAthletes.map((ath) => {
                    const health = getSyncHealthStatus(ath);
                    const isSelected = selectedAthleteId === ath.id;
                    return (
                      <button
                        key={ath.id}
                        onClick={() => setSelectedAthleteId(ath.id)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group ${
                          isSelected
                            ? "bg-lime-400/5 border-lime-400/30 shadow-[0_4px_25px_rgba(163,230,53,0.03)]"
                            : "bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/50"
                        }`}
                      >
                        {/* Athlete info */}
                        <div className="flex items-center gap-3 min-w-0">
                          
                          {/* Avatar */}
                          {ath.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ath.avatar} alt={ath.name} className="h-9 w-9 rounded-full object-cover shrink-0 ring-1 ring-white/10" />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-zinc-900 text-xs font-black flex items-center justify-center text-lime-450 shrink-0 border border-white/10">{getInitials(ath.name)}</div>
                          )}

                          <div className="min-w-0">
                            <p className={`font-black text-xs uppercase italic truncate ${isSelected ? "text-lime-400" : "text-white group-hover:text-lime-400"}`}>
                              {ath.name}
                            </p>
                            <p className="text-[9px] text-zinc-500 font-mono truncate">{ath.email}</p>
                            
                            {/* Sport Type Badge */}
                            <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-950 border border-white/5 text-[7.5px] font-mono font-bold text-zinc-400 uppercase mt-1">
                              {ath.sportType}
                            </span>
                          </div>

                        </div>

                        {/* Athlete stats metrics summary */}
                        <div className="flex items-center gap-4 shrink-0 text-right font-mono text-[10px]">
                          <div className="space-y-0.5">
                            <span className="block font-black text-white">{ath.totalDistance.toLocaleString()} km</span>
                            <span className="block text-[8px] text-zinc-550 uppercase">Distance</span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="block font-black text-lime-400">Rank #{ath.currentRank}</span>
                            <span className="block text-[8px] text-zinc-550 uppercase">Current</span>
                          </div>

                          {/* Sync status indicator */}
                          <div className="flex flex-col items-center">
                            <span className={`h-2 w-2 rounded-full ${
                              health.color === "green" ? "bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]" :
                              health.color === "yellow" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" :
                              "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                            }`} title={health.label} />
                            <span className="text-[7.5px] text-zinc-600 uppercase font-mono mt-1 leading-none">{health.label.split(" ")[0]}</span>
                          </div>
                        </div>

                      </button>
                    );
                  })
                )}
              </div>

            </div>
          </section>

          {/* RIGHT PANEL: ATHLETE INSPECTOR */}
          <section className="flex-1 bg-zinc-950/40 max-h-none lg:max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin flex flex-col justify-between border-t lg:border-t-0 border-white/5">
            <AnimatePresence mode="wait">
              {!selectedAthlete ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-12 text-center my-auto min-h-[300px]"
                >
                  <div className="h-16 w-16 rounded-full border border-dashed border-white/10 flex items-center justify-center text-zinc-600 mb-4 animate-pulse">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-xs uppercase font-black tracking-widest text-zinc-400 font-mono">No Athlete Selected</h3>
                  <p className="text-[10px] text-zinc-550 mt-1 max-w-xs font-mono">
                    Scan or select an active athlete from the directory to inspect synchronized Strava stats, enrolled challenge status, and sync logs.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedAthlete.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 sm:p-6 lg:p-8 space-y-6 text-left"
                >
                  
                  {/* PROFILE HEADER PANEL */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-5 rounded-3xl bg-zinc-900/30 border border-white/5 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/25 to-transparent" />
                    
                    <div className="flex items-center gap-4 min-w-0">
                      {selectedAthlete.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedAthlete.avatar} alt={selectedAthlete.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-lime-400/20 shrink-0" />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-zinc-900 border border-white/10 text-lg font-black flex items-center justify-center text-lime-400 shrink-0">{getInitials(selectedAthlete.name)}</div>
                      )}
                      <div className="min-w-0 space-y-1">
                        <h2 className="text-lg sm:text-xl font-black uppercase italic leading-none text-white tracking-tight flex items-center gap-2">
                          {selectedAthlete.name}
                          {selectedAthlete.stravaConnected && (
                            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-lime-450" />
                          )}
                        </h2>
                        <p className="text-[10px] text-zinc-400 font-mono tracking-wide">{selectedAthlete.email}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[8.5px]">
                          <span className="px-2 py-0.5 rounded bg-zinc-950 border border-white/5 text-zinc-500">
                            STRAVA ID: <span className="text-white font-bold">{selectedAthlete.athleteId}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-zinc-950 border border-white/5 text-zinc-500">
                            JOINED: <span className="text-white font-bold">{selectedAthlete.joinedAt}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Connection Status Badge */}
                    <div className="shrink-0 self-start sm:self-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-[9px] font-extrabold uppercase tracking-widest ${
                        selectedAthlete.stravaConnected
                          ? "bg-lime-400/5 text-lime-400 border-lime-400/20 shadow-[0_0_12px_rgba(163,230,53,0.05)]"
                          : "bg-red-500/5 text-red-400 border-red-500/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${selectedAthlete.stravaConnected ? "bg-lime-400 animate-pulse" : "bg-red-500"}`} />
                        {selectedAthlete.stravaConnected ? "Strava Linked" : "Not Linked"}
                      </span>
                    </div>
                  </div>

                  {/* PERFORMANCE STATS SECTION */}
                  <div className="space-y-2.5">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 font-mono">Performance Stats</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: "Total Distance", value: `${selectedAthlete.totalDistance.toLocaleString()} km`, sub: "Logged activities distance", icon: Milestone },
                        { label: "Synced Workouts", value: `${selectedAthlete.totalActivities}`, sub: "Activities imported", icon: Activity },
                        { label: "Current Rank", value: `#${selectedAthlete.currentRank}`, sub: "Leaderboard status", icon: Trophy },
                        { label: "Elevation Gain", value: `${selectedAthlete.elevationGain.toLocaleString()} m`, sub: "Vertical climb", icon: Layers },
                        { label: "Active Streak", value: `${selectedAthlete.activeStreak} Days`, sub: "Consecutive active days", icon: Flame, color: selectedAthlete.activeStreak > 0 ? "text-lime-450" : "" },
                      ].map((stat) => {
                        const Icon = stat.icon;
                        return (
                          <div key={stat.label} className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl hover:border-lime-400/10 transition-all font-mono">
                            <span className="block text-[8px] uppercase tracking-wider text-zinc-500">{stat.label}</span>
                            <div className="my-1.5 flex items-baseline gap-1">
                              <span className={`text-lg font-black tracking-tight text-white ${stat.color || ""}`}>{stat.value}</span>
                            </div>
                            <span className="block text-[7px] text-zinc-650 truncate">{stat.sub}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CHALLENGE PARTICIPATION SECTION */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 font-mono">Challenge Enrollment</h3>
                    {selectedAthlete.enrolledChallenges.length === 0 ? (
                      <div className="p-8 text-center text-zinc-600 font-mono text-xs border border-dashed border-white/5 rounded-2xl bg-zinc-900/10">
                        Athlete is not enrolled in any ongoing challenges.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedAthlete.enrolledChallenges.map((ec) => {
                          const unit = ec.goalMetric === "Distance" ? "km" : ec.goalMetric === "Elevation" ? "m" : "h";
                          return (
                            <div key={ec.id} className="p-4.5 bg-zinc-900/20 border border-white/5 rounded-2xl hover:border-lime-400/15 transition-all space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase text-white tracking-wide truncate pr-4">{ec.title}</span>
                                <span className="text-[8.5px] px-2 py-0.5 font-mono font-bold bg-lime-400/10 text-lime-400 rounded border border-lime-400/20 uppercase shrink-0">
                                  Rank #{ec.rank}
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1 font-mono text-[9px]">
                                <div className="flex justify-between text-zinc-400 font-bold">
                                  <span>Progress: {ec.progress} / {ec.goalTarget} {unit}</span>
                                  <span>{ec.percentage}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-950 border border-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-lime-400 transition-all duration-500" 
                                    style={{ width: `${ec.percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* RECENT ACTIVITY TIMELINE */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 font-mono">Recent Activity History</h3>
                    {selectedAthlete.recentActivities.length === 0 ? (
                      <div className="p-8 text-center text-zinc-600 font-mono text-xs border border-dashed border-white/5 rounded-2xl bg-zinc-900/10">
                        No activity metrics logged.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedAthlete.recentActivities.map((act) => (
                          <div 
                            key={act.id} 
                            className="flex items-center justify-between p-3 bg-zinc-900/10 border border-white/5 rounded-xl hover:border-white/10 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                                <Activity className="h-4 w-4" />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-[11px] font-extrabold text-white truncate leading-none">{act.name}</p>
                                <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wide mt-1 block">
                                  Type: {act.sportType} • {act.startDate}
                                </span>
                              </div>
                            </div>

                            <div className="text-right font-mono text-[10px] shrink-0">
                              <span className="block font-black text-white">{act.distance} km</span>
                              <span className="block text-[8px] text-zinc-500">{formatTime(act.movingTime)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SYNC HEALTH PANEL & ADMIN ACTIONS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    
                    {/* SYNC HEALTH */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 font-mono">Sync Health Diagnostics</h3>
                      <div className="p-5 bg-zinc-900/20 border border-white/5 rounded-2xl space-y-4">
                        
                        {/* Health status header */}
                        {(() => {
                          const health = getSyncHealthStatus(selectedAthlete);
                          return (
                            <div className="flex items-start gap-3 text-left">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                                health.color === "green" ? "bg-lime-400/10 text-lime-400 border-lime-400/20" :
                                health.color === "yellow" ? "bg-amber-400/10 text-amber-400 border-amber-400/20" :
                                "bg-red-500/10 text-red-500 border-red-500/20"
                              }`}>
                                {health.color === "green" ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                              </div>
                              <div>
                                <span className="block text-[8px] uppercase tracking-wider text-zinc-500 font-mono">Pipeline Status</span>
                                <span className={`text-xs font-black uppercase tracking-wider ${
                                  health.color === "green" ? "text-lime-400" :
                                  health.color === "yellow" ? "text-amber-400" :
                                  "text-red-500"
                                }`}>
                                  {health.label}
                                </span>
                                <p className="text-[9px] text-zinc-400 mt-1 leading-relaxed">{health.text}</p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Health stats block */}
                        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3 font-mono text-[9px]">
                          <div>
                            <span className="block text-zinc-550 uppercase text-[7.5px]">Last Synchronization</span>
                            <span className="block text-white font-bold mt-0.5">{selectedAthlete.lastSyncTime}</span>
                          </div>
                          <div>
                            <span className="block text-zinc-550 uppercase text-[7.5px]">Token Authentication</span>
                            <span className="block text-white font-bold mt-0.5">{selectedAthlete.stravaConnected ? "VALID / EXPIRES ON WEEKLY BASIS" : "EXPIRED / DISCONNECTED"}</span>
                          </div>
                          <div>
                            <span className="block text-zinc-550 uppercase text-[7.5px]">API Error Log</span>
                            <span className="block text-white font-bold mt-0.5">{selectedAthlete.stravaConnected ? "NO CRITICAL ERRORS" : "CONNECTION AUTH ERROR"}</span>
                          </div>
                          <div>
                            <span className="block text-zinc-550 uppercase text-[7.5px]">Database Records Imported</span>
                            <span className="block text-white font-bold mt-0.5">{selectedAthlete.totalActivities} Workouts synced</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* ADMIN ACTIONS */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 font-mono">Admin Operations Panel</h3>
                      <div className="p-5 bg-zinc-900/20 border border-white/5 rounded-2xl space-y-3 flex flex-col justify-center">
                        
                        {/* Primary actions */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <Button
                            onClick={() => handleForceSync(selectedAthlete.id)}
                            disabled={syncingAthlete || !selectedAthlete.stravaConnected}
                            className="h-10 border border-lime-400/20 hover:border-lime-400 bg-lime-400/5 hover:bg-lime-400/10 text-lime-400 font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider cursor-pointer"
                          >
                            {syncingAthlete ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                            <span>Force Sync</span>
                          </Button>

                          <Button
                            onClick={() => handleExportAthleteReport(selectedAthlete)}
                            className="h-10 border border-white/5 hover:border-white/10 bg-zinc-900 hover:bg-zinc-850 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Export Report</span>
                          </Button>
                        </div>

                        {/* Secondary actions */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <Button
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="h-10 border border-white/5 hover:border-white/10 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 hover:text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider cursor-pointer"
                          >
                            <Trophy className="h-3.5 w-3.5 text-zinc-500" />
                            <span>View History</span>
                          </Button>

                          <Button
                            onClick={() => setIsNotificationModalOpen(true)}
                            className="h-10 border border-white/5 hover:border-white/10 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 hover:text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5 text-zinc-500" />
                            <span>Send Alert</span>
                          </Button>
                        </div>

                        <span className="block text-[8px] text-zinc-600 font-mono mt-1 text-center">
                          AUTHORIZED ADMIN ROLES ONLY • SECURE AUDITED EVENTS
                        </span>
                      </div>
                    </div>

                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </main>

      </div>

      {/* SEND NOTIFICATION MODAL */}
      <AnimatePresence>
        {isNotificationModalOpen && selectedAthlete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 text-left space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs uppercase font-black tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                  <Send className="h-4 w-4 text-lime-400" /> Dispatch System Alert
                </h3>
                <button onClick={() => setIsNotificationModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-left">
                <span className="text-[8px] uppercase font-black text-zinc-500 tracking-wider font-mono">Recipient athlete:</span>
                <p className="text-xs font-bold text-white uppercase italic">{selectedAthlete.name} ({selectedAthlete.email})</p>
              </div>

              <div className="space-y-2">
                <label className="block text-[8px] uppercase font-black text-zinc-500 tracking-wider font-mono">Notification content:</label>
                <textarea
                  placeholder="Draft system message or sync alerts for this athlete..."
                  value={notificationText}
                  onChange={(e) => setNotificationText(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs text-white placeholder:text-zinc-650 focus:border-lime-400 focus:outline-none font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setIsNotificationModalOpen(false)}
                  className="flex-1 h-10 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 rounded-xl transition-all text-[10px] uppercase font-extrabold tracking-wider cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendNotificationSubmit}
                  disabled={sendingNotification || !notificationText.trim()}
                  className="flex-1 h-10 border border-lime-400/20 hover:border-lime-400 bg-lime-400/5 hover:bg-lime-400/15 text-lime-400 rounded-xl transition-all text-[10px] uppercase font-extrabold tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {sendingNotification ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>Dispatch Alert</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW CHALLENGE HISTORY MODAL */}
      <AnimatePresence>
        {isHistoryModalOpen && selectedAthlete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 text-left space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs uppercase font-black tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-lime-400 animate-pulse" /> Challenge History Audit
                </h3>
                <button onClick={() => setIsHistoryModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-left pb-2">
                <span className="text-[8px] uppercase font-black text-zinc-500 tracking-wider font-mono">Athlete:</span>
                <p className="text-xs font-bold text-white uppercase italic">{selectedAthlete.name} ({selectedAthlete.email})</p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
                {selectedAthlete.enrolledChallenges.length === 0 ? (
                  <div className="p-8 text-center text-zinc-600 font-mono text-xs border border-dashed border-white/5 rounded-xl bg-zinc-950/40">
                    No active or archived challenge participations recorded in operations ledger.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedAthlete.enrolledChallenges.map((ec) => {
                      const unit = ec.goalMetric === "Distance" ? "km" : ec.goalMetric === "Elevation" ? "m" : "h";
                      return (
                        <div key={ec.id} className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="text-left space-y-1">
                            <span className="block text-xs font-black uppercase text-white tracking-wide">{ec.title}</span>
                            <span className="block font-mono text-[8px] text-zinc-500 uppercase">STATUS: {ec.status}</span>
                          </div>

                          <div className="flex items-center gap-4 text-right font-mono text-[10px] shrink-0">
                            <div className="space-y-0.5">
                              <span className="block font-black text-white">{ec.progress} / {ec.goalTarget} {unit}</span>
                              <span className="block text-[8px] text-zinc-550 uppercase">Progress</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="block font-black text-lime-400">{ec.percentage}%</span>
                              <span className="block text-[8px] text-zinc-550 uppercase">Completion</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="block font-black text-white">Rank #{ec.rank}</span>
                              <span className="block text-[8px] text-zinc-550 uppercase">Standing</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 text-right">
                <Button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="h-10 px-6 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 rounded-xl transition-all text-[10px] uppercase font-extrabold tracking-wider cursor-pointer"
                >
                  Close Audit
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
