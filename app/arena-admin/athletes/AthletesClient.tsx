"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { usePageLoader } from "@/components/PageLoader";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Users, Activity, Settings, Bell, LogOut, Menu, X, 
  Search, ArrowRight, CheckCircle, AlertTriangle, AlertCircle, 
  ShieldCheck, Flame, ChevronRight, FileText, LayoutDashboard,
  Clock, Download, RefreshCw, Mail, Calendar, MapPin, Milestone, ShieldAlert, Target, Award,
  Check
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
  const { addToast } = useToast();
  const { showLoader } = usePageLoader();

  // Toast notifications state proxy mapping
  const addNotification = (title: string, message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    addToast(title, type, message);
  };

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Athletes");
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
    showLoader("Signing out...");
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



  // --- NEW FILTERS ---
  const [drawerTab, setDrawerTab] = useState("overview");

  const filteredAthletes = useMemo(() => {
    return athletes
      .filter((ath) => {
        const q = searchQuery.toLowerCase();
        const matchQuery = 
          ath.name.toLowerCase().includes(q) ||
          ath.email.toLowerCase().includes(q) ||
          ath.athleteId.toLowerCase().includes(q) ||
          ath.enrolledChallenges.some(c => c.title.toLowerCase().includes(q));
        
        if (!matchQuery) return false;

        const syncTime = ath.rawLastSyncTime ? new Date(ath.rawLastSyncTime).getTime() : 0;
        const daysSinceSync = (Date.now() - syncTime) / (1000 * 60 * 60 * 24);
        const inactiveDays = ath.latestActivityDate ? (Date.now() - new Date(ath.latestActivityDate).getTime()) / (1000 * 60 * 60 * 24) : 999;

        if (activeFilter === "Needs Attention") return !ath.stravaConnected || daysSinceSync > 7 || inactiveDays > 14;
        if (activeFilter === "Recently Synced") return daysSinceSync <= 1;
        if (activeFilter === "Inactive") return inactiveDays > 30;
        if (activeFilter === "Top Performers") return ath.currentRank <= 5 && ath.currentRank > 0;
        if (activeFilter === "Challenge Winners") return ath.enrolledChallenges.some(c => c.progress >= c.goalTarget);
        if (activeFilter === "Sync Failed") return !ath.stravaConnected;

        return true;
      })
      .sort((a, b) => b.totalDistance - a.totalDistance);
  }, [athletes, searchQuery, activeFilter]);

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

  // Sidebar navigation
  const navigationGroups = [
    {
      label: "WORKSPACE",
      links: [
        { title: "Dashboard", icon: LayoutDashboard, active: false, route: "/arena-admin" },
        { title: "Challenges", icon: Trophy, active: false, route: "/arena-admin/challenges" },
        { title: "Athletes", icon: Users, active: true, route: "/arena-admin/athletes" },
        { title: "Activities", icon: Activity, active: false, route: "/arena-admin/activities" },
        { title: "Reports", icon: FileText, active: false, route: "/arena-admin/reports" },
      ]
    }
  ];

  const filterOptions = ["All Athletes", "Needs Attention", "Recently Synced", "Inactive", "Top Performers", "Challenge Winners", "Sync Failed"];

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-300 font-sans overflow-hidden">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex w-[240px] flex-col border-r border-[#ffffff0f] bg-[#0C0C0E] shrink-0 h-full">
        <div className="h-16 flex items-center px-6 border-b border-[#ffffff0f] shrink-0 gap-3">
          <div className="relative shrink-0 flex items-center justify-center h-9 w-9">
            <svg className="h-8 w-8 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g fill="#22c55e"><circle cx="48" cy="20" r="7" /><path d="M 28 69 C 14 78, 12 79, 10 80 C 15 78, 25 65, 32 50 C 37 40, 48 30, 60 22 Z" /></g>
              <g fill="#ef4444"><circle cx="78" cy="32" r="7" /><path d="M 46 48 C 58 40, 68 35, 75 42 Z" /></g>
              <g fill="#3b82f6"><circle cx="53" cy="68" r="7" /><path d="M 6 81 C 12 83, 25 75, 35 68 Z" /></g>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white tracking-wider leading-none">
              KYL <span className="text-lime-400">ARENA</span>
            </span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col px-4 py-6 space-y-6 overflow-y-auto">
          {navigationGroups.map((group) => (
            <div key={group.label} className="space-y-3">
              <h3 className="text-[10px] font-bold text-zinc-500/80 uppercase tracking-wider px-3">{group.label}</h3>
              <div className="space-y-1">
                {group.links.map((link) => (
                  <button
                    key={link.title}
                    onClick={() => router.push(link.route)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group border-l-2 ${
                      link.active 
                        ? "bg-lime-500/10 text-white font-medium border-lime-500" 
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border-transparent font-normal hover:translate-x-1 hover:brightness-110"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className={`h-4 w-4 ${link.active ? "text-lime-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                      <span>{link.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-[#ffffff0f] shrink-0">
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-500/80 uppercase tracking-wider px-3">ADMINISTRATION</h3>
            <button 
              onClick={() => router.push("/arena-admin/settings")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-150 font-normal hover:translate-x-1 group border-l-2 border-transparent"
            >
              <Settings className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[240px] z-50 bg-[#0C0C0E] border-r border-[#ffffff0f] flex flex-col lg:hidden"
            >
              <div className="h-16 flex items-center px-6 border-b border-[#ffffff0f] gap-3 shrink-0">
                <div className="relative shrink-0 flex items-center justify-center h-8 w-8">
                  <svg className="h-7 w-7 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g fill="#22c55e"><circle cx="48" cy="20" r="7" /><path d="M 28 69 C 14 78, 12 79, 10 80 C 15 78, 25 65, 32 50 C 37 40, 48 30, 60 22 Z" /></g>
                    <g fill="#ef4444"><circle cx="78" cy="32" r="7" /><path d="M 46 48 C 58 40, 68 35, 75 42 Z" /></g>
                    <g fill="#3b82f6"><circle cx="53" cy="68" r="7" /><path d="M 6 81 C 12 83, 25 75, 35 68 Z" /></g>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white tracking-wider leading-none">
                    KYL <span className="text-lime-400">ARENA</span>
                  </span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="ml-auto text-zinc-500 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 flex flex-col px-4 py-6 space-y-6 overflow-y-auto">
                {navigationGroups.map((group) => (
                  <div key={group.label} className="space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-500/80 uppercase tracking-wider px-3">{group.label}</h3>
                    <div className="space-y-1">
                      {group.links.map((link) => (
                        <button
                          key={link.title}
                          onClick={() => { setIsSidebarOpen(false); router.push(link.route); }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group border-l-2 ${
                            link.active ? "bg-lime-500/10 text-white font-medium border-lime-500" : "text-zinc-400 hover:text-white hover:bg-white/5 border-transparent font-normal hover:translate-x-1"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <link.icon className={`h-4 w-4 ${link.active ? "text-lime-400" : "text-zinc-500"}`} />
                            <span>{link.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
              <div className="px-4 py-4 border-t border-[#ffffff0f] shrink-0">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-zinc-500/80 uppercase tracking-wider px-3">ADMINISTRATION</h3>
                  <button 
                    onClick={() => { setIsSidebarOpen(false); router.push("/arena-admin/settings"); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-150 font-normal hover:translate-x-1 group border-l-2 border-transparent"
                  >
                    <Settings className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 flex items-center px-6 border-b border-white/5 bg-[#09090b] shrink-0 gap-6 z-30 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-white tracking-tight hidden sm:block">Athlete Management</h1>
          </div>
          
          {/* SEARCH HERO */}
          <div className="relative w-full max-w-[500px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, email, Strava ID, or challenge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex">
          
          <main className="flex-1 min-w-0 p-6 flex flex-col gap-6">
            {/* QUICK FILTERS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0">
              {filterOptions.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    activeFilter === f 
                      ? "bg-zinc-100 text-zinc-900 border-zinc-100" 
                      : "bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {f} {f === "All Athletes" && `(${athletes.length})`}
                </button>
              ))}
            </div>

            {/* ATHLETE DIRECTORY */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max pb-12">
              {filteredAthletes.map(ath => {
                const health = getSyncHealthStatus(ath);
                return (
                  <div
                    key={ath.id}
                    onClick={() => { setSelectedAthleteId(ath.id); setDrawerTab("overview"); }}
                    className={`group bg-zinc-900 border ${selectedAthleteId === ath.id ? 'border-lime-500/50 bg-lime-500/5' : 'border-white/5'} hover:border-white/15 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col gap-4`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-zinc-800 shrink-0 overflow-hidden relative">
                        {ath.avatar ? (
                          <img src={ath.avatar} alt={ath.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-sm font-bold text-zinc-500">
                            {getInitials(ath.name)}
                          </div>
                        )}
                        {!ath.stravaConnected && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-white truncate pr-2 group-hover:text-lime-400 transition-colors">{ath.name}</h3>
                          <div className={`shrink-0 h-2 w-2 rounded-full mt-1.5 ${health.color === 'green' ? 'bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.6)]' : health.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        </div>
                        <p className="text-xs text-zinc-500 truncate">{ath.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <div className="bg-black/20 rounded-lg p-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Rank</span>
                        <div className="flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-sm font-semibold text-white">{ath.currentRank > 0 ? `#${ath.currentRank}` : '-'}</span>
                        </div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Active</span>
                        <div className="flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-sm font-semibold text-white">{ath.enrolledChallenges.length} Chals</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredAthletes.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                  <Search className="h-8 w-8 text-zinc-600 mb-3" />
                  <p className="text-zinc-400 text-sm">No athletes found matching the current filters.</p>
                </div>
              )}
            </div>
          </main>

          {/* INSPECTOR DRAWER */}
          <AnimatePresence>
            {selectedAthlete && (
              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 right-0 w-full sm:w-[450px] bg-[#0C0C0E] border-l border-[#ffffff0f] shadow-2xl z-40 flex flex-col"
              >
                {/* Drawer Header */}
                <div className="p-6 border-b border-[#ffffff0f] shrink-0 bg-zinc-900/50">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-zinc-800 overflow-hidden ring-2 ring-white/10">
                        {selectedAthlete.avatar ? (
                          <img src={selectedAthlete.avatar} alt={selectedAthlete.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-lg font-bold text-zinc-500">
                            {getInitials(selectedAthlete.name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{selectedAthlete.name}</h2>
                        <p className="text-sm text-zinc-400">{selectedAthlete.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`h-1.5 w-1.5 rounded-full ${selectedAthlete.stravaConnected ? 'bg-lime-500' : 'bg-red-500'}`} />
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                            {selectedAthlete.stravaConnected ? 'Strava Linked' : 'No Connection'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedAthleteId(null)} className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Drawer Tabs */}
                  <div className="flex items-center gap-6 overflow-x-auto scrollbar-none border-b border-white/5 pb-[1px]">
                    {["overview", "challenges", "activities", "badges", "history"].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setDrawerTab(tab)}
                        className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                          drawerTab === tab ? "text-lime-400" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {tab}
                        {drawerTab === tab && (
                          <motion.div layoutId="drawer-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400 rounded-t-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
                  {drawerTab === "overview" && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Rank</span>
                          <div className="text-2xl font-black text-white">{selectedAthlete.currentRank > 0 ? `#${selectedAthlete.currentRank}` : '-'}</div>
                        </div>
                        <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Distance</span>
                          <div className="text-2xl font-black text-white">{selectedAthlete.totalDistance}<span className="text-sm font-normal text-zinc-500 ml-1">km</span></div>
                        </div>
                        <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Activities</span>
                          <div className="text-2xl font-black text-white">{selectedAthlete.totalActivities}</div>
                        </div>
                        <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Streak</span>
                          <div className="flex items-center gap-1.5">
                            <Flame className={`h-5 w-5 ${selectedAthlete.activeStreak > 0 ? 'text-orange-500' : 'text-zinc-600'}`} />
                            <div className="text-2xl font-black text-white">{selectedAthlete.activeStreak}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Admin Actions</h3>
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleForceSync(selectedAthlete.id)}
                            disabled={!selectedAthlete.stravaConnected || syncingAthlete}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-white/5 hover:border-lime-500/30 hover:bg-lime-500/5 transition-colors group disabled:opacity-50 disabled:pointer-events-none"
                          >
                            <div className="flex items-center gap-3">
                              <RefreshCw className={`h-4 w-4 text-zinc-400 group-hover:text-lime-400 ${syncingAthlete ? 'animate-spin text-lime-400' : ''}`} />
                              <span className="text-sm font-medium text-white">Sync Strava Data</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-lime-400" />
                          </button>
                          
                          <button 
                            onClick={() => handleExportAthleteReport(selectedAthlete)}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-white/5 hover:border-white/20 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Download className="h-4 w-4 text-zinc-400 group-hover:text-white" />
                              <span className="text-sm font-medium text-white">Export CSV Report</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-white" />
                          </button>

                          <a 
                            href={`https://www.strava.com/athletes/${selectedAthlete.athleteId}`} 
                            target="_blank" rel="noreferrer"
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-white/5 hover:border-[#FC4C02]/30 hover:bg-[#FC4C02]/5 transition-colors group disabled:opacity-50"
                            style={{ pointerEvents: selectedAthlete.stravaConnected ? 'auto' : 'none', opacity: selectedAthlete.stravaConnected ? 1 : 0.5 }}
                          >
                            <div className="flex items-center gap-3">
                              <svg className="h-4 w-4 text-zinc-400 group-hover:text-[#FC4C02]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                              </svg>
                              <span className="text-sm font-medium text-white">View Strava Profile</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-[#FC4C02]" />
                          </a>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Danger Zone</h3>
                        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:border-red-500/50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium text-red-500">Suspend User</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {drawerTab === "challenges" && (
                    <div className="space-y-4">
                      {selectedAthlete.enrolledChallenges.length > 0 ? (
                        selectedAthlete.enrolledChallenges.map(c => (
                          <div key={c.id} className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-white text-sm">{c.title}</h4>
                                <span className="text-xs text-zinc-500">{c.status}</span>
                              </div>
                              <div className="bg-white/5 rounded px-2 py-1 flex items-center gap-1.5">
                                <Trophy className="h-3 w-3 text-zinc-400" />
                                <span className="text-xs font-bold text-white">#{c.rank}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-lime-400 font-bold">{c.progress} / {c.goalTarget} {c.goalMetric === 'Distance' ? 'km' : ''}</span>
                                <span className="text-zinc-500">{c.percentage}%</span>
                              </div>
                              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${c.percentage}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="h-full bg-lime-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <Target className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                          <p className="text-sm text-zinc-500">No active challenges.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {drawerTab === "activities" && (
                    <div className="space-y-3">
                      {selectedAthlete.recentActivities.length > 0 ? (
                        selectedAthlete.recentActivities.map(act => (
                          <div key={act.id} className="bg-zinc-900 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400">
                                <Activity className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white max-w-[200px] truncate">{act.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                                  <span>{act.sportType}</span>
                                  <span>&bull;</span>
                                  <span>{act.distance} km</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-zinc-400">{act.startDate}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <Activity className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                          <p className="text-sm text-zinc-500">No recent activities.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {drawerTab === "badges" && (
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                      <h3 className="text-white font-bold mb-1">No Badges Earned</h3>
                      <p className="text-sm text-zinc-500">Badges are awarded upon completing challenges.</p>
                    </div>
                  )}

                  {drawerTab === "history" && (
                    <div className="space-y-6 pl-2">
                      <div className="relative pl-6 border-l-2 border-white/10 pb-6">
                        <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.8)]" />
                        <h4 className="text-sm font-bold text-white">Joined KYL Arena</h4>
                        <p className="text-xs text-zinc-500 mt-1">{selectedAthlete.joinedAt}</p>
                      </div>
                      {selectedAthlete.stravaConnected && (
                        <div className="relative pl-6 border-l-2 border-white/10 pb-6">
                          <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-white/30" />
                          <h4 className="text-sm font-bold text-white">Connected Strava</h4>
                          <p className="text-xs text-zinc-500 mt-1">Profile successfully linked</p>
                        </div>
                      )}
                      {selectedAthlete.rawLastSyncTime && (
                        <div className="relative pl-6 border-l-2 border-transparent">
                          <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-white/30" />
                          <h4 className="text-sm font-bold text-white">Last Activity Sync</h4>
                          <p className="text-xs text-zinc-500 mt-1">{selectedAthlete.lastSyncTime}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
