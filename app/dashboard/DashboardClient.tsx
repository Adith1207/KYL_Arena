"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { usePageLoader } from "@/components/PageLoader";
import { 
  Loader2, LogOut, Activity, AlertTriangle, CheckCircle, 
  Award, Bike, Footprints, Flame, Trophy, Edit3, 
  ChevronRight, TrendingUp, Sparkles, Clock, Target, 
  Dumbbell, Home, Users, HelpCircle, X, Shield, Settings,
  Check, Bell, AlertCircle, Megaphone, Star, Zap, Pin, PartyPopper
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, Variants } from "framer-motion";
import DashboardTour from "@/components/DashboardTour";

interface ActivityData {
  name: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  average_speed?: number | null;
  total_elevation_gain?: number | null;
}

interface ProfileData {
  id: string;
  email: string;
  name: string;
  avatar: string;
  auth_provider: string;
  role: string;
  strava_connected: boolean;
  strava_athlete_id: string | null;
  last_synced_at?: string | null;
  activities?: ActivityData[];
  activities_count?: number;
  active_streak?: number;
  tour_completed?: boolean;
  strava_connection?: {
    athlete_name: string | null;
    athlete_username: string | null;
    athlete_avatar: string | null;
    created_at?: string | null;
  } | null;
  all_activities?: any[];
}

interface DashboardClientProps {
  initialProfile: ProfileData;
  errorParam?: string;
  infoParam?: string;
  diagnostics?: {
    supabaseUser: {
      id: string;
      email: string;
      provider: string;
      lastSignIn: string;
    };
    athleteId: string;
    existingConnectionCount: number;
    oauthCallbackResult: string;
    profileLookupResult: string;
  };
  activeChallenges: any[];
  communityFeed?: any[];
}

// Helper function to format date consistently on server and client to prevent hydration mismatches
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};

export default function DashboardClient({ 
  initialProfile, 
  errorParam, 
  infoParam, 
  diagnostics,
  activeChallenges,
  communityFeed = []
}: DashboardClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { showLoader, hideLoader } = usePageLoader();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingDisconnect, setLoadingDisconnect] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingJoinId, setLoadingJoinId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatusText, setSyncStatusText] = useState("Syncing Strava...");
  
  // Responsive bottom nav tab selector for mobile screens
  const [activeTab, setActiveTab] = useState<"dashboard" | "challenges" | "leaderboard">("dashboard");

  // Toast notifications state proxy mapping
  const addNotification = (title: string, message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    addToast(title, type, message);
  };
  
  // Track IDs that have been joined during this session to avoid latency gaps
  const [justJoinedIds, setJustJoinedIds] = useState<string[]>([]);

  // Selected challenge leaderboard to view
  const [selectedLeaderboardId, setSelectedLeaderboardId] = useState<string | null>(null);

  // Onboarding & Preferences Settings Menu States
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChallengePortalOpen, setIsChallengePortalOpen] = useState(false);
  const menuDropdownRef = useRef<HTMLDivElement>(null);


  // Sync success indicator for micro-interaction
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Daily Goal Customization States
  const [userDailyGoal, setUserDailyGoal] = useState<number>(5.0);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoalInput, setTempGoalInput] = useState("");

  useEffect(() => {
    const savedGoal = localStorage.getItem("kyl_arena_daily_goal");
    if (savedGoal) {
      const parsed = parseFloat(savedGoal);
      if (!isNaN(parsed) && parsed > 0) {
        setUserDailyGoal(parsed);
      }
    }
  }, []);

  const saveDailyGoal = () => {
    const parsed = parseFloat(tempGoalInput);
    if (!isNaN(parsed) && parsed > 0) {
      setUserDailyGoal(parsed);
      localStorage.setItem("kyl_arena_daily_goal", parsed.toString());
    }
    setIsEditingGoal(false);
  };

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  // Check for onboarding tour auto-launch on initial login
  useEffect(() => {
    const completedLocal = localStorage.getItem("kyl_arena_tour_completed") === "true";
    const completedDB = profile.tour_completed === true;
    
    if (!completedLocal && !completedDB) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [profile.tour_completed]);

  // Click outside listener for User Menu Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper: compute progress for a challenge using ALL activities (date + sport filtered)
  const getFullProgressVal = (c: any): number => {
    const allActs: any[] = profile.all_activities || [];
    let total = 0;
    const challengeStart = new Date(c.startDate);
    const challengeEnd = new Date(c.endDate);
    challengeStart.setUTCHours(0, 0, 0, 0);
    challengeEnd.setUTCHours(23, 59, 59, 999);
    allActs.forEach((act: any) => {
      const actDate = new Date(act.start_date);
      const inRange = actDate >= challengeStart && actDate <= challengeEnd;
      const matchesSport =
        c.sportType === "Multisport" ||
        act.sport_type?.toLowerCase() === c.sportType?.toLowerCase() ||
        (c.sportType === "Ride" && act.sport_type === "VirtualRide");
      if (inRange && matchesSport) {
        if (c.goalType === "Distance") total += (act.distance || 0) / 1000;
        else if (c.goalType === "Elevation") total += (act.total_elevation_gain || 0);
        else total += (act.moving_time || 0) / 3600;
      }
    });
    return Number(total.toFixed(1));
  };

  // Determine current display State (A, B, C, D, E) based on live database profile data
  let currentState: "A" | "B" | "C" | "D" | "E" = "A";
  if (!profile.strava_connected) {
    currentState = "A";
  } else if (!profile.activities || profile.activities.length === 0) {
    currentState = "B";
  } else {
    const joinedActive = activeChallenges.filter(c => c.userJoined && c.status === "active");
    const joinedAny = activeChallenges.filter(c => c.userJoined);
    // State E: at least one joined challenge where the goal has been met OR the challenge has ended
    const hasCompleted = joinedAny.some(c => {
      const progress = getFullProgressVal(c);
      const goalMet = progress >= c.goalTarget;
      const ended = c.endDate ? new Date(c.endDate) < new Date() : false;
      return goalMet || (ended && c.status !== "active");
    });
    if (hasCompleted) {
      currentState = "E";
    } else if (joinedActive.length > 0 || joinedAny.length > 0) {
      currentState = "D";
    } else {
      currentState = "C";
    }
  }

  // Handle live activities synchronization
  const handleSyncActivities = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setShowSyncSuccess(false);
    setSyncStatusText("Syncing Strava...");

    const messages = [
      { delay: 2000, text: "Fetching activities..." },
      { delay: 4500, text: "Calculating rankings..." },
      { delay: 7000, text: "Almost done..." }
    ];

    const timers = messages.map(m =>
      setTimeout(() => {
        setSyncStatusText(m.text);
      }, m.delay)
    );

    addNotification("Sync Started", "Checking Strava API for new athlete activities...", "info");
    try {
      const res = await fetch("/api/strava/sync");
      const data = await res.json();
      
      if (res.ok && data.success) {
        setProfile((prev) => ({
          ...prev,
          last_synced_at: data.last_synced_at,
          activities: data.latest_activities,
          activities_count: data.activities_count,
        }));
        
        // Success notifications
        const currentCount = profile.activities_count || 0;
        const newCount = data.activities_count || 0;
        const importedCount = Math.max(0, newCount - currentCount);
        
        addNotification(
          "Activities Synced", 
          `Your dashboard activities are fully up to date!`, 
          "success"
        );
        
        if (importedCount > 0) {
          addNotification(
            "Activities Imported", 
            `Imported ${importedCount} new activity logs from your Strava history.`, 
            "success"
          );
        }
        
        // Show success animation for micro-interaction
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 5000);
        router.refresh();
      } else {
        addNotification("Sync Failed", data.error || "Could not connect to Strava API.", "error");
        setSyncError(data.error || "Failed to synchronize activities. Please try again.");
      }
    } catch {
      addNotification("Sync Failed", "Network error synchronizing activities.", "error");
      setSyncError("Network error synchronizing activities.");
    } finally {
      timers.forEach(clearTimeout);
      setIsSyncing(false);
    }
  };

  // Check for completed challenges to show victory toasts
  useEffect(() => {
    const checkCompletedChallenges = () => {
      const enrolled = activeChallenges.filter(c => c.userJoined);
      enrolled.forEach(c => {
        const userActivities = profile.all_activities || [];
        let completed = 0;
        
        const challengeStart = new Date(c.startDate);
        const challengeEnd = new Date(c.endDate);
        challengeStart.setUTCHours(0, 0, 0, 0);
        challengeEnd.setUTCHours(23, 59, 59, 999);

        userActivities.forEach((act: any) => {
          const actDate = new Date(act.start_date);
          const inRange = actDate >= challengeStart && actDate <= challengeEnd;
          
          const matchesSport = 
            c.sportType === "Multisport" ||
            act.sport_type?.toLowerCase() === c.sportType?.toLowerCase();

          if (inRange && matchesSport) {
            if (c.goalType === "Distance") {
              completed += (act.distance || 0) / 1000;
            } else if (c.goalType === "Elevation") {
              completed += (act.total_elevation_gain || 0);
            } else if (c.goalType === "Time" || c.goalType === "Duration") {
              completed += (act.moving_time || 0) / 3600;
            }
          }
        });

        const pct = Math.min(100, Math.round((completed / c.goalTarget) * 100));
        if (pct >= 100) {
          const dismissedKey = `kyl_challenge_dismissed_${c.id}`;
          if (localStorage.getItem(dismissedKey) !== "true") {
            addNotification("Challenge Completed", `Victory! You completed the "${c.title}" challenge!`, "success");
            localStorage.setItem(dismissedKey, "true");
          }
        }
      });
    };
    
    if (activeChallenges && activeChallenges.length > 0) {
      checkCompletedChallenges();
    }
  }, [activeChallenges, profile.activities]);

  const [currentConnectionCount, setCurrentConnectionCount] = useState<number | undefined>(
    diagnostics?.existingConnectionCount
  );

  const handleLogout = async () => {
    setLoadingLogout(true);
    showLoader("Signing out...");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      localStorage.removeItem("kyl_mock_user");
      localStorage.removeItem("kyl_mock_strava_linked");
      localStorage.removeItem("kyl_mock_activities_synced");
      localStorage.removeItem("kyl_mock_last_synced_at");
      localStorage.removeItem("kyl_remember_device");
      document.cookie = "kyl-remember-device=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      window.location.href = "/";
    }
  };

  const handleTourClose = async (completedOrSkipped: boolean) => {
    setIsTourOpen(false);
    
    // In both actions, write to localStorage to prevent repeating auto-launches
    localStorage.setItem("kyl_arena_tour_completed", "true");
    
    // Persist completion status to Supabase profile
    if (completedOrSkipped) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase
          .from("profiles")
          .update({ tour_completed: true })
          .eq("id", profile.id);
        
        setProfile((prev) => ({ ...prev, tour_completed: true }));
      } catch (e) {
        console.error("Failed to update profile tour completed status:", e);
      }
    }
  };

  const handleConnectStrava = () => {
    setLoadingConnect(true);
    showLoader("Connecting Strava...");
    window.location.href = "/api/strava/connect";
  };

  const handleDisconnectStrava = async () => {
    if (!confirm("Are you sure you want to disconnect your Strava account?")) {
      return;
    }
    setLoadingDisconnect(true);
    try {
      const res = await fetch("/api/strava/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          strava_connected: false,
          strava_athlete_id: null,
          strava_connection: null,
          activities: [],
          activities_count: 0,
        }));
        setCurrentConnectionCount(prev => prev !== undefined ? Math.max(0, prev - 1) : 0);
        addNotification("Strava Disconnected", "Your Strava profile connection has been removed.", "info");
      } else {
        const data = await res.json();
        addNotification("Disconnection Failed", data.error || "Unknown error", "error");
      }
    } catch {
      addNotification("Disconnection Failed", "Error disconnecting Strava.", "error");
    } finally {
      setLoadingDisconnect(false);
    }
  };


  // Get initials for avatar fallback
  const getInitials = (fullName: string) => {
    if (!fullName) return "A";
    const parts = fullName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  // Generate activities list to display
  const displayActivities = profile.activities || [];

  // Determine overall distance
  const totalDistanceMeters = displayActivities.reduce((acc, act) => acc + act.distance, 0);
  const totalDistanceKm = (totalDistanceMeters / 1000).toFixed(1);

  // Determine total elevation
  const totalElevationGain = displayActivities.length > 0 ? displayActivities.length * 190 : 0;

  // Staggered child variants for performance card list
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-lime-400 selection:text-black overflow-hidden flex flex-col justify-between font-sans">
      
      {/* ── Topographic Background ── */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-zinc-950" />
        
        {/* Ambient glow orbs */}
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full" style={{ background: "radial-gradient(circle, rgba(163,230,53,0.03) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-32 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.02) 0%, transparent 70%)" }} />

        {/* Topographic pattern */}
        <div 
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0C10 5.52285 5.52285 10 0 10V12C6.62742 12 12 6.62742 12 0H10ZM0 100C5.52285 100 10 95.5228 10 90H12C12 96.6274 6.62742 100 0 100V100ZM100 10C94.4772 10 90 5.52285 90 0H88C88 6.62742 93.3726 12 100 12V10ZM90 100C90 94.4772 94.4772 90 100 90V88C93.3726 88 88 93.3726 88 100H90ZM20 0C20 11.0457 11.0457 20 0 20V22C12.1503 22 22 12.1503 22 0H20ZM0 100C11.0457 100 20 91.0457 20 80H22C22 92.1503 12.1503 100 0 100V100ZM100 20C88.9543 20 80 11.0457 80 0H78C78 12.1503 87.8497 22 100 22V20ZM80 100C80 91.0457 88.9543 80 100 80V78C87.8497 78 78 92.1503 78 100H80ZM30 0C30 16.5685 16.5685 30 0 30V32C17.6731 32 32 17.6731 32 0H30ZM0 100C16.5685 100 30 86.5685 30 70H32C32 87.6731 17.6731 100 0 100V100ZM100 30C83.4315 30 70 16.5685 70 0H68C68 17.6731 82.3269 32 100 32V30ZM70 100C70 86.5685 83.4315 70 100 70V68C82.3269 68 68 87.6731 68 100H70ZM40 0C40 22.0914 22.0914 40 0 40V42C23.196 42 42 23.196 42 0H40ZM0 100C22.0914 100 40 82.0914 40 60H42C42 83.196 23.196 100 0 100V100ZM100 40C77.9086 40 60 22.0914 60 0H58C58 23.196 76.804 42 100 42V40ZM60 100C60 82.0914 77.9086 60 100 60V58C76.804 58 58 83.196 58 100H60ZM50 0C50 27.6142 27.6142 50 0 50V52C28.7188 52 52 28.7188 52 0H50ZM0 100C27.6142 100 50 77.6142 50 50H52C52 78.7188 28.7188 100 0 100V100ZM100 50C72.3858 50 50 27.6142 50 0H48C48 28.7188 71.2812 52 100 52V50ZM50 100C50 77.6142 72.3858 50 100 50V48C71.2812 48 48 78.7188 48 100H50Z' fill='%23a3e635' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '800px 800px'
          }}
        />
      </div>

      {/* Cyberpunk Style Top Bar */}
      <nav className="relative z-20 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-lime-400/25 blur-md rounded-full scale-0 group-hover:scale-100 transition-all duration-500" />
                <svg className="h-7 w-7 transition-transform duration-500 group-hover:rotate-12 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g fill="#22c55e"><circle cx="48" cy="20" r="7" /><path d="M 28 69 C 14 78, 12 79, 10 80 C 15 78, 25 65, 32 50 C 37 40, 48 30, 60 22 Z" /></g>
                  <g fill="#ef4444"><circle cx="78" cy="32" r="7" /><path d="M 46 48 C 58 40, 68 35, 75 42 Z" /></g>
                  <g fill="#3b82f6"><circle cx="53" cy="68" r="7" /><path d="M 6 81 C 12 83, 25 75, 35 68 Z" /></g>
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-black tracking-wider text-white leading-none">
                  KYL <span className="text-lime-400">ARENA</span>
                </span>
                <span className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                  Know Your Limits
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {/* Single Glassmorphic Profile Menu Dropdown */}
              <div className="relative" ref={menuDropdownRef}>
                <div 
                  id="tour-profile-section" 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2.5 md:gap-3 bg-zinc-900/40 border border-white/5 p-1.5 pr-3 md:pr-4 rounded-full backdrop-blur-sm cursor-pointer hover:border-lime-400/35 hover:bg-zinc-900/60 transition-all select-none"
                >
                  {profile.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar} alt={profile.name} className="h-7 w-7 rounded-full object-cover ring-1 ring-lime-400/30" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-zinc-800 text-[9px] font-black flex items-center justify-center text-lime-400">{getInitials(profile.name)}</div>
                  )}
                  <div className="hidden md:block text-left">
                    <p className="text-[10px] font-black text-white uppercase italic leading-none">{profile.name.split(" ")[0]}</p>
                    <p className="text-[8px] text-zinc-500 font-mono mt-0.5 leading-none">
                      Athlete Account
                    </p>
                  </div>
                  <ChevronRight className={`h-3 w-3 text-zinc-500 ml-1 transition-transform ${isMenuOpen ? "rotate-90" : ""}`} />
                </div>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-zinc-950/95 border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(163,230,53,0.02)] backdrop-blur-xl py-2.5 z-55 text-left overflow-hidden"
                    >
                      {/* Menu Header with User details */}
                      <div className="px-4 py-3 flex flex-col gap-3 border-b border-white/5 pb-4 mb-2">
                        <div className="flex items-center gap-3">
                          {profile.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.avatar} alt={profile.name} className="h-10 w-10 rounded-full object-cover ring-1 ring-lime-400/30" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-zinc-850 text-xs font-black flex items-center justify-center text-lime-400">{getInitials(profile.name)}</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-white truncate">{profile.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">{profile.email}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="bg-zinc-900/50 rounded-lg p-2 flex flex-col">
                            <span className="text-[8px] text-zinc-500 font-mono uppercase">Strava Sync</span>
                            <span className={`text-[9px] font-bold mt-0.5 flex items-center gap-1 ${profile.strava_connected ? 'text-emerald-400' : 'text-zinc-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${profile.strava_connected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                              {profile.strava_connected ? 'Connected' : 'Unlinked'}
                            </span>
                          </div>
                          <div className="bg-zinc-900/50 rounded-lg p-2 flex flex-col">
                            <span className="text-[8px] text-zinc-500 font-mono uppercase">Member Since</span>
                            <span className="text-[9px] font-bold text-zinc-300 mt-0.5">2026</span>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      <div className="space-y-0.5 px-1.5 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        
                        <button
                          onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(true); }}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5"><Settings className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" /> Profile Settings</div>
                        </button>

                        <button
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5"><Bike className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" /> Connected Devices</div>
                        </button>

                        <button
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5"><Bell className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" /> Notifications</div>
                        </button>

                        {(profile.role === "super_admin" || profile.role === "challenge_admin") && (
                          <Link
                            href="/arena-admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-lime-400 hover:bg-lime-950/20 rounded-xl transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5"><Shield className="h-4 w-4 text-lime-400" /> Admin Console</div>
                          </Link>
                        )}

                        <div className="h-px bg-white/5 my-1.5 mx-2" />

                        <button
                          onClick={() => { setIsMenuOpen(false); setIsTourOpen(true); }}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5"><Sparkles className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" /> Restart Tour</div>
                        </button>

                        <button
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5"><HelpCircle className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" /> Help & Support</div>
                        </button>

                        <button
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5"><Users className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" /> Community Rules</div>
                        </button>

                        <button
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5"><Shield className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" /> Privacy</div>
                        </button>

                        <div className="h-px bg-white/5 my-1.5 mx-2" />

                        {/* Sign Out */}
                        <button
                          onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                          disabled={loadingLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                          {loadingLogout ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4 text-red-400" />}
                          <span>Sign Out</span>
                        </button>

                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Responsive Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12 text-left">
        
        {/* Sync Success Micro-Interaction Notification */}
        <AnimatePresence>
          {showSyncSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-6 p-4 rounded-2xl bg-lime-950/20 border border-lime-400/30 text-lime-400 flex items-center justify-between shadow-lg shadow-lime-400/5 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-lime-400/10 text-lime-400 shrink-0">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">Sync Successful!</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Your fitness data has been successfully compiled and synchronized into KYL Arena stats.</p>
                </div>
              </div>
              <button onClick={() => setShowSyncSuccess(false)} className="text-[10px] uppercase font-black hover:text-white cursor-pointer px-2 py-1">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Display of System Param Notice Banners */}
        {errorParam && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-950/25 border border-red-500/20 text-red-400 text-xs">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold uppercase tracking-wider text-[10px] text-red-500">Authentication Error</p>
              <p className="font-medium text-zinc-300">
                {errorParam === "strava_already_linked"
                  ? "This Strava account is already linked to another account."
                  : errorParam === "invalid_state"
                  ? "Security verification failed (Invalid State). Please try connecting again."
                  : errorParam === "oauth_exchange_failed"
                  ? "Failed to exchange authorization tokens with Strava."
                  : `Error: ${errorParam}`}
              </p>
            </div>
          </div>
        )}

        {infoParam === "already_connected" && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-400">Notice</p>
              <p className="font-medium text-zinc-300">Your Strava account is already linked.</p>
            </div>
          </div>
        )}

        {/* MOBILE LAYOUT (Tabs-based single column or unified scrollable list) */}
        <div className="block md:hidden space-y-8">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {renderHeroSection(currentState, "-mobile")}
              
              {/* 2. Today's Goal */}
              {renderTodaysGoalSection("-mobile")}
              
              {/* 3. Current Challenges */}
              {renderCurrentChallengesSection("-mobile")}
              
              {/* 4. Recent Activities */}
              {renderRecentActivities("-mobile")}
              
              {/* 5. Community Rank */}
              {renderLeaderboardSection("-mobile")}
              
              {/* 6. Community Feed */}
              {renderCommunityFeedSection("-mobile")}
              
              {/* 7. Upcoming Challenges */}
              {renderUpcomingChallengesSection("-mobile")}
            </div>
          )}
          
          {activeTab === "challenges" && (
            <div className="space-y-8">
              {renderCurrentChallengesSection("-mobile")}
              {renderUpcomingChallengesSection("-mobile")}
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="space-y-8">
              {renderLeaderboardSection("-mobile")}
            </div>
          )}
        </div>

        {/* TABLET & DESKTOP GRID LAYOUT (Multi-column system) */}
        <div className="hidden md:grid md:grid-cols-12 gap-8 lg:gap-10">
          
          {/* LEFT COLUMN: Main user activity & performance */}
          <div className="md:col-span-7 lg:col-span-8 space-y-8 lg:space-y-10">
            {renderHeroSection(currentState, "-desktop")}
            
            {/* 2. Today's Goal */}
            {renderTodaysGoalSection("-desktop")}
            
            {/* 3. Current Challenges */}
            {renderCurrentChallengesSection("-desktop")}
            
            {/* 4. Recent Activities */}
            {renderRecentActivities("-desktop")}
          </div>

          {/* RIGHT COLUMN: Community rank, community feed, upcoming challenges */}
          <div className="md:col-span-5 lg:col-span-4 space-y-8 lg:space-y-10">
            {/* 5. Community Rank */}
            {renderLeaderboardSection("-desktop")}
            
            {/* 6. Community Feed */}
            {renderCommunityFeedSection("-desktop")}
            
            {/* 7. Upcoming Challenges */}
            {renderUpcomingChallengesSection("-desktop")}
          </div>
        </div>
      </main>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-zinc-950/85 border-t border-white/5 backdrop-blur-xl px-2 py-3 flex justify-around items-center shadow-[0_-8px_24px_rgba(0,0,0,0.8)]">
        <button 
          onClick={() => setActiveTab("dashboard")} 
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === "dashboard" ? "text-lime-400" : "text-zinc-500 hover:text-zinc-350"
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </button>

        <button 
          onClick={() => setActiveTab("challenges")} 
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === "challenges" ? "text-lime-400" : "text-zinc-500 hover:text-zinc-350"
          }`}
        >
          <Trophy className="h-5 w-5" />
          <span>Challenges</span>
        </button>

        <button 
          onClick={() => setActiveTab("leaderboard")} 
          className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === "leaderboard" ? "text-lime-400" : "text-zinc-500 hover:text-zinc-350"
          }`}
        >
          <Users className="h-5 w-5" />
          <span>Ranks</span>
        </button>
      </div>

      {/* Footer Details */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-[10px] text-zinc-650 bg-zinc-950 mb-16 md:mb-0">
        <span>© 2026 KYL Arena. Built by Know Your Limits Community.</span>
      </footer>



      {/* Settings Modal Component */}
      {renderSettingsModal()}

      {/* Challenge Portal Modal Component */}
      {renderChallengePortalModal()}

      {/* Onboarding Tour Component */}
      <DashboardTour
        isOpen={isTourOpen}
        onClose={handleTourClose}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );

  // ==========================================
  // RENDER SECTIONS
  // ==========================================

  // Render State-Dependent Hero Section (A, B, C, D, E)
  function renderHeroSection(stateLetter: "A" | "B" | "C" | "D" | "E", idSuffix = "") {
    // If not connected, keep the connect CTA but make it look premium
    if (stateLetter === "A") {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key={stateLetter}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            id={`tour-hero-section${idSuffix}`}
            className="relative rounded-3xl bg-zinc-900/30 backdrop-blur-xl border border-white/5 p-6 sm:p-8 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-left group"
          >
            {/* Decorative neon accent strip */}
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/30 to-transparent" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-lime-400/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-lime-400/10 transition-all duration-700" />

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-lime-400 border border-lime-400/20 px-2.5 py-0.5 rounded-full bg-lime-400/5 select-none font-mono">
                  <Flame className="h-3 w-3 animate-pulse" /> Unlock the Arena
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white leading-tight">
                  Connect Strava <span className="text-lime-400 not-italic font-normal">To Begin</span>
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl font-medium">
                  Connect your Strava account to start syncing activities and participating in challenges.
                </p>
              </div>

              {/* Benefit Bullet Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 text-left space-y-1">
                  <div className="h-7 w-7 rounded-lg bg-lime-400/10 text-lime-400 flex items-center justify-center font-bold text-xs"><Trophy className="h-4 w-4" /></div>
                  <h4 className="font-extrabold text-[11px] text-white uppercase tracking-wider pt-1">Join Challenges</h4>
                  <p className="text-[10px] text-zinc-500 leading-normal">Compete in community distance targets.</p>
                </div>
                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 text-left space-y-1">
                  <div className="h-7 w-7 rounded-lg bg-lime-400/10 text-lime-400 flex items-center justify-center font-bold text-xs"><Activity className="h-4 w-4" /></div>
                  <h4 className="font-extrabold text-[11px] text-white uppercase tracking-wider pt-1">Track Progress</h4>
                  <p className="text-[10px] text-zinc-500 leading-normal">Automated sync checks logs automatically.</p>
                </div>
                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 text-left space-y-1">
                  <div className="h-7 w-7 rounded-lg bg-lime-400/10 text-lime-400 flex items-center justify-center font-bold text-xs"><Users className="h-4 w-4" /></div>
                  <h4 className="font-extrabold text-[11px] text-white uppercase tracking-wider pt-1">Leaderboards</h4>
                  <p className="text-[10px] text-zinc-500 leading-normal">Appear in active ranked standings.</p>
                </div>
              </div>

              <Button
                onClick={handleConnectStrava}
                disabled={loadingConnect}
                className="w-full sm:w-auto px-8 h-12 bg-[#FC6100] hover:bg-[#E55500] text-white font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-[0_4px_12px_rgba(252,97,0,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {loadingConnect ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="h-4.5 w-4.5 fill-white shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l-2.836 5.637h4.372l1.548-3.087 1.546 3.087h4.373L13.626 2.52l-5.247 9.825" />
                    </svg>
                    Connect with Strava
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      );
    }

    // Determine Greeting and split name
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "GOOD MORNING" : hour < 17 ? "GOOD AFTERNOON" : "GOOD EVENING";
    
    const nameParts = profile.name.split(" ");
    const firstName = nameParts[0] || "Athlete";
    const lastName = nameParts.slice(1).join(" ") || "Narayan";
    const formattedName = `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;

    // Get Active / Completed challenge details
    const activeChallenge = activeChallenges.find(c => c.userJoined && c.status === "active") || activeChallenges.find(c => c.userJoined);
    const completedChallenge = activeChallenges.find(c => c.userJoined && (
      getFullProgressVal(c) >= c.goalTarget ||
      (c.endDate && new Date(c.endDate) < new Date() && c.status !== "active")
    ));

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={stateLetter}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          id={`tour-hero-section${idSuffix}`}
          className="relative rounded-3xl bg-zinc-900/30 backdrop-blur-xl border border-white/5 p-6 sm:p-8 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-left group"
        >
          {/* Decorative neon accent strip & ambient glow */}
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/40 to-transparent" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-lime-400/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-lime-400/10 transition-all duration-700" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
            {/* Left Welcome Segment */}
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-widest text-lime-400 border border-lime-400/20 px-2.5 py-0.5 rounded-full bg-lime-400/5 select-none font-mono">
                  <Sparkles className="h-3 w-3 text-lime-400 animate-pulse" /> {greeting} ATHLETE
                </div>
                <h2 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                  {stateLetter === "E" ? "CONGRATULATIONS," : "WELCOME BACK,"} <span className="text-lime-400 not-italic font-black bg-gradient-to-r from-lime-400 via-emerald-400 to-lime-500 bg-clip-text text-transparent">{formattedName}</span>
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold max-w-lg mt-2">
                  {stateLetter === "B" && "Every champion was once a beginner. Record your first activity today on Strava to ignite your journey."}
                  {stateLetter === "C" && "Great work syncing your activities! The arena is waiting. Join a community challenge to push your limits."}
                  {stateLetter === "D" && activeChallenge && `You're crushing it! Keep the momentum going. Every kilometer counts towards ${activeChallenge.title}.`}
                  {stateLetter === "E" && completedChallenge && `Outstanding performance! You pushed past your limits and conquered the ${completedChallenge.title}.`}
                </p>
              </div>

              {/* State-specific mini HUD block inside welcome card */}
              {stateLetter === "D" && activeChallenge && (() => {
                const daysRemaining = (() => {
                  if (!activeChallenge.endDate) return null;
                  const diff = Math.ceil((new Date(activeChallenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return diff > 0 ? diff : 0;
                })();
                const unit = activeChallenge.goalType === "Distance" ? "km" : activeChallenge.goalType === "Elevation" ? "m" : "hrs";
                const completedVal = getFullProgressVal(activeChallenge);
                const pct = Math.min(100, Math.round((completedVal / activeChallenge.goalTarget) * 100));

                return (
                  <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider font-mono">Active Challenge Progress</span>
                      <span className="text-[9px] text-lime-400 font-bold font-mono">
                        {daysRemaining === 0 ? "Last Day!" : `${daysRemaining} Days Left`}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between font-mono text-[10px]">
                        <span className="text-zinc-550">Target: {completedVal} / {activeChallenge.goalTarget} {unit}</span>
                        <span className="text-lime-400 font-extrabold">{pct}% Complete</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-lime-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {stateLetter === "E" && completedChallenge && (() => {
                const finalRank = completedChallenge.userRank ?? null;
                const totalParticipants = completedChallenge.participantsCount ?? null;
                const badgeLabel = finalRank === 1 ? "Gold Medal" : finalRank === 2 ? "Silver Medal" : finalRank === 3 ? "Bronze Medal" : finalRank ? "Finisher" : "—";
                const badgeColour = finalRank === 1 ? "text-amber-400 border-amber-400/20 bg-amber-400/5" : finalRank === 2 ? "text-zinc-300 border-zinc-300/20 bg-zinc-350/5" : finalRank === 3 ? "text-amber-600 border-amber-700/20 bg-amber-700/5" : "text-lime-400 border-lime-400/20 bg-lime-400/5";

                return (
                  <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 flex items-center justify-between gap-4">
                    <div className="text-left space-y-1">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Completed Target Verified</h4>
                      <p className="text-[10px] text-zinc-500 leading-normal font-semibold">You completed the {completedChallenge.title} and cleared the standings.</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase font-mono tracking-wider text-center shrink-0 ${badgeColour}`}>
                      🏆 {badgeLabel}
                    </div>
                  </div>
                );
              })()}

              {stateLetter === "B" && (
                <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide">Awaiting activity signals from Strava profile...</span>
                </div>
              )}

              {/* Action row */}
              <div className="flex flex-wrap gap-3 pt-3">
                {stateLetter === "C" && (
                  <Button
                    onClick={() => setIsChallengePortalOpen(true)}
                    className="px-6 h-10 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-lime-400/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Trophy className="h-4 w-4" />
                    Join A Challenge
                  </Button>
                )}

                {stateLetter === "D" && activeChallenge && (
                  <Button
                    onClick={() => {
                      const suffix = window.innerWidth < 768 ? "-mobile" : "-desktop";
                      const leaderboardEl = document.getElementById(`tour-leaderboard-section${suffix}`);
                      if (leaderboardEl) leaderboardEl.scrollIntoView({ behavior: "smooth" });
                      setActiveTab("leaderboard");
                    }}
                    className="px-6 h-10 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-lime-400/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Flame className="h-4 w-4" />
                    Continue Challenge
                  </Button>
                )}

                {stateLetter === "E" && (
                  <Button
                    onClick={() => setIsChallengePortalOpen(true)}
                    className="px-6 h-10 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-lime-400/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Trophy className="h-4 w-4" />
                    Join Another Challenge
                  </Button>
                )}

                {stateLetter === "B" && (
                  <Link 
                    href="https://www.strava.com" 
                    target="_blank"
                    className="inline-flex items-center justify-center px-6 h-10 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-xl transition-all gap-1.5 text-[10px] uppercase tracking-wider shadow-lg hover:shadow-lime-400/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Zap className="h-4 w-4" /> Go to Strava
                  </Link>
                )}
              </div>
            </div>

            {/* Right Today's Goal Snapshot Segment */}
            <div className="lg:col-span-4 bg-zinc-950/40 border border-white/5 rounded-2xl p-5 flex flex-col justify-center space-y-4 backdrop-blur-sm">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest font-mono flex items-center gap-2">
                <Target className="h-3.5 w-3.5" /> TODAY'S GOAL
              </span>
              
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">
                    {Math.max(0, 5.0 - (displayActivities.filter(a => new Date(a.start_date).toDateString() === new Date().toDateString()).reduce((sum, a) => sum + (a.distance / 1000), 0))).toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-zinc-400 font-mono">KM</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Remaining Today</span>
              </div>

              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-lime-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, Math.round((displayActivities.filter(a => new Date(a.start_date).toDateString() === new Date().toDateString()).reduce((sum, a) => sum + (a.distance / 1000), 0) / 5.0) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Render Today's Goal Section
  function renderTodaysGoalSection(idSuffix = "") {
    const today = new Date();
    const todaysActivities = displayActivities.filter(act => {
      const actDate = new Date(act.start_date);
      return actDate.getDate() === today.getDate() && 
             actDate.getMonth() === today.getMonth() && 
             actDate.getFullYear() === today.getFullYear();
    });
    const todayDistance = todaysActivities.reduce((acc, act) => acc + (act.distance / 1000), 0);
    
    // Use customizable user goal
    const dailyTarget = userDailyGoal;
    
    const remaining = Math.max(0, dailyTarget - todayDistance).toFixed(1);
    const pct = Math.min(100, Math.round((todayDistance / dailyTarget) * 100));
    const estimatedMins = Math.round((Number(remaining) * 6)); // Rough estimate 6 mins/km
    
    const bareMinimum = calculateBareMinimumGoal();

    return (
      <div id={`tour-stats-section${idSuffix}`} className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-5 text-left relative overflow-hidden group">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-lime-400 font-mono flex items-center gap-2">
            <Target className="h-4 w-4" /> TODAY'S GOAL
          </h3>
          <Button
            onClick={handleSyncActivities}
            disabled={isSyncing}
            variant="ghost"
            className="h-7 px-3 text-[9px] font-bold uppercase tracking-wider bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 rounded-lg cursor-pointer"
          >
            {isSyncing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
            {isSyncing ? "Syncing" : "Quick Sync"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Remaining Distance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tighter">{remaining}</span>
              <span className="text-sm font-bold text-zinc-400 font-mono">KM</span>
            </div>
            {Number(remaining) === 0 ? (
              <p className="text-[10px] text-lime-400 font-bold mt-1">Goal Completed! 🎉</p>
            ) : (
              <p className="text-[10px] text-zinc-500 font-medium mt-1">~{estimatedMins} mins of running</p>
            )}
          </div>
          
          <div className="space-y-3 bg-zinc-950/40 p-4 rounded-2xl border border-white/5">
            {isEditingGoal ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400">Target:</span>
                  <input 
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={tempGoalInput}
                    onChange={(e) => setTempGoalInput(e.target.value)}
                    className="w-16 bg-zinc-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-white outline-none focus:border-lime-400/50"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveDailyGoal();
                      if (e.key === "Escape") setIsEditingGoal(false);
                    }}
                  />
                  <span className="text-[10px] font-mono text-zinc-400 mr-2">KM</span>
                  <button onClick={saveDailyGoal} className="text-lime-400 hover:text-lime-300 p-1">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setIsEditingGoal(false)} className="text-red-400 hover:text-red-300 p-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {bareMinimum > 0 && (
                  <p className="text-[8.5px] text-amber-400/80 font-medium">
                    Minimum recommended to complete active challenges: {bareMinimum.toFixed(1)} KM/day
                  </p>
                )}
              </div>
            ) : (
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-400 flex items-center gap-1.5 group/edit">
                  Target: {dailyTarget} KM
                  <button 
                    onClick={() => {
                      setTempGoalInput(userDailyGoal.toString());
                      setIsEditingGoal(true);
                    }}
                    className="text-zinc-600 hover:text-lime-400 transition-colors opacity-0 group-hover/edit:opacity-100 p-0.5"
                    title="Edit Daily Goal"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </span>
                <span className="text-lime-400 font-extrabold">{pct}% Complete</span>
              </div>
            )}
            <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className="bg-lime-400 h-full rounded-full" 
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function getProgressVal(c: any) {
    const userActivities = profile.all_activities || [];
    let completed = 0;
    
    const challengeStart = new Date(c.startDate);
    const challengeEnd = new Date(c.endDate);
    challengeStart.setUTCHours(0, 0, 0, 0);
    challengeEnd.setUTCHours(23, 59, 59, 999);

    userActivities.forEach((act: any) => {
      const actDate = new Date(act.start_date);
      const inRange = actDate >= challengeStart && actDate <= challengeEnd;
      
      const matchesSport = 
        c.sportType === "Multisport" ||
        act.sport_type?.toLowerCase() === c.sportType?.toLowerCase() ||
        (c.sportType === "Ride" && act.sport_type === "VirtualRide");

      if (inRange && matchesSport) {
        if (c.goalType === "Distance") {
          completed += (act.distance || 0) / 1000; // km
        } else if (c.goalType === "Elevation") {
          completed += (act.total_elevation_gain || 0); // meters
        } else if (c.goalType === "Time" || c.goalType === "Duration") {
          completed += (act.moving_time || 0) / 3600; // hours
        }
      }
    });

    return Number(completed.toFixed(1));
  }

  function calculateBareMinimumGoal() {
    const enrolled = activeChallenges.filter(c => c.userJoined || justJoinedIds.includes(c.id));
    if (enrolled.length === 0) return 0;
    
    let maxMinTarget = 0;
    
    enrolled.forEach(c => {
      // For simplicity, we only calculate bare minimum for Distance based goals (KM)
      if (c.goalType !== "Distance") return;
      
      const completed = getProgressVal(c);
      const remainingTarget = Math.max(0, c.goalTarget - completed);
      
      if (remainingTarget === 0) return;
      
      const endDate = new Date(c.endDate);
      const today = new Date();
      endDate.setUTCHours(23, 59, 59, 999);
      today.setUTCHours(0, 0, 0, 0);
      
      const msLeft = endDate.getTime() - today.getTime();
      const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      
      const requiredPerDay = remainingTarget / daysLeft;
      if (requiredPerDay > maxMinTarget) {
        maxMinTarget = requiredPerDay;
      }
    });
    
    return maxMinTarget;
  }

  async function handleJoin(challengeId: string, challengeTitle: string) {
    if (!profile.strava_connected) {
      addNotification("Challenge Required", "Please connect your Strava profile first to join challenges!", "warning");
      return;
    }
    if (loadingJoinId || justJoinedIds.includes(challengeId)) return; // prevent duplicate
    
    setLoadingJoinId(challengeId);
    try {
      const { createClient: createBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: challengeId,
          user_id: profile.id
        });
        
      if (error) {
        addNotification("Enrollment Failed", `Failed to join challenge: ${error.message}`, "error");
        return;
      }
      
      // Success
      setJustJoinedIds(prev => [...prev, challengeId]);
      addNotification("Challenge Enrolled", `You have successfully joined "${challengeTitle}"!`, "success");
      
      setTimeout(() => {
        router.refresh();
      }, 1200);
    } catch (e: any) {
      console.error("Error joining challenge:", e);
      addNotification("Enrollment Error", e.message || "An unexpected error occurred.", "error");
    } finally {
      setLoadingJoinId(null);
    }
  }

  // Render Enrolled Challenges Section
  function renderCurrentChallengesSection(idSuffix = "") {
    const enrolled = activeChallenges.filter(c => c.userJoined || justJoinedIds.includes(c.id));

    const expandedChallenge = enrolled.length > 0 ? [...enrolled].sort((a,b) => b.goalTarget - a.goalTarget)[0] : null;
    const compactChallenges = expandedChallenge ? enrolled.filter(c => c.id !== expandedChallenge.id) : [];

    return (
      <div id={`tour-challenges-section${idSuffix}`} className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-5 text-left relative overflow-hidden group">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-lime-455">
            CURRENT ENROLLED CHALLENGES
          </h3>
          <span className="text-[9px] text-zinc-550 font-mono">
            {enrolled.length} Joined
          </span>
        </div>

        {enrolled.length > 0 && expandedChallenge ? (
          <div className="space-y-4">
            {/* Expanded Hero Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-lime-400/20 space-y-4 relative overflow-hidden shadow-lg shadow-lime-400/5">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="h-16 w-16 text-lime-400" />
              </div>
              <div className="flex items-center justify-between gap-3 relative z-10">
                <span className="text-sm font-black text-white uppercase tracking-tight">{expandedChallenge.title}</span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full text-lime-400 bg-lime-400/10">
                  {Math.min(100, Math.round((getProgressVal(expandedChallenge) / expandedChallenge.goalTarget) * 100))}% COMPLETE
                </span>
              </div>
              
              <div className="space-y-2 relative z-10">
                <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-lime-400 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, Math.round((getProgressVal(expandedChallenge) / expandedChallenge.goalTarget) * 100))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>{getProgressVal(expandedChallenge)} / {expandedChallenge.goalTarget} {expandedChallenge.goalType === "Distance" ? "km" : "m"}</span>
                  <span>
                    {(() => {
                      if (!expandedChallenge.endDate) return "";
                      const days = Math.ceil((new Date(expandedChallenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return days > 0 ? `${days} Days Left` : "Ends Today";
                    })()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                  <Users className="h-3.5 w-3.5" /> Rank {expandedChallenge.userRank ? `#${expandedChallenge.userRank}` : "-"}
                </div>
                <Link href={`/challenge/${expandedChallenge.id}`} className="text-[10px] font-extrabold uppercase text-lime-400 hover:text-lime-500 transition-colors flex items-center gap-1">
                  View Details <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Compact Rows */}
            {compactChallenges.length > 0 && (
              <div className="space-y-2">
                {compactChallenges.map(c => {
                  const pct = Math.min(100, Math.round((getProgressVal(c) / c.goalTarget) * 100));
                  const daysLeft = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                  
                  return (
                    <Link href={`/challenge/${c.id}`} key={c.id} className="block p-3 rounded-xl bg-zinc-900/20 border border-white/5 hover:border-lime-400/20 transition-all group/row">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-bold text-white uppercase truncate">{c.title}</h4>
                          <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-mono mt-1">
                            <span>{pct}%</span>
                            <span className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-[10px] font-bold text-zinc-400">{daysLeft > 0 ? `${daysLeft}d left` : "Last Day"}</span>
                          <span className="block text-[9px] text-zinc-600 font-mono">Rank {c.userRank ? `#${c.userRank}` : "-"}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 bg-zinc-950/20 rounded-2xl gap-3">
            <div className="p-3 rounded-full bg-zinc-900 border border-white/5 text-zinc-650">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">Find your next challenge</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xs mx-auto">
                You aren't enrolled in any active challenges right now. Compete with the community to push your limits.
              </p>
            </div>
            <Button 
              onClick={() => setIsChallengePortalOpen(true)}
              className="mt-2 h-9 px-4 bg-white hover:bg-zinc-200 text-black text-[10px] font-bold uppercase rounded-lg"
            >
              Explore Challenges
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Render Suggested / Upcoming Challenges Section
  function renderUpcomingChallengesSection(idSuffix = "") {
    const suggested = activeChallenges.filter(c => !c.userJoined && !justJoinedIds.includes(c.id));
    const upcoming = activeChallenges.filter(c => c.status === "upcoming");
    const uniqueList = [...suggested, ...upcoming].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    const topThree = uniqueList.slice(0, 3);

    return (
      <div id={`tour-upcoming-challenges${idSuffix}`} className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-5 text-left relative overflow-hidden group">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">
            EXPLORE CHALLENGES
          </h3>
          <span className="text-[9px] text-zinc-500 font-mono">
            {topThree.length} Available
          </span>
        </div>

        {topThree.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {topThree.map((c, index) => {
              const label = index === 0 ? "Featured" : index === 1 ? "Trending" : "Recommended";
              const isRide = c.sportType === "Ride";
              const isRun = c.sportType === "Run";
              const isWalk = c.sportType === "Walk";
              const unit = c.goalType === "Distance" ? "km" : c.goalType === "Elevation" ? "m" : "hrs";
              
              const isJustJoined = justJoinedIds.includes(c.id) || c.userJoined;
              const isLoading = loadingJoinId === c.id;

              return (
                <div key={c.id} className="p-4 rounded-2xl bg-zinc-900/20 border border-white/5 space-y-3 relative overflow-hidden group/card hover:border-lime-400/20 transition-all duration-300 text-left">
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${
                          isRide ? "border-lime-400/20 bg-lime-400/5 text-lime-400" :
                          isRun ? "border-red-400/20 bg-red-400/5 text-red-400" :
                          "border-blue-400/20 bg-blue-400/5 text-blue-400"
                        }`}>
                          {isRide ? <Bike className="h-2.5 w-2.5 shrink-0" /> : 
                           isRun ? <Flame className="h-2.5 w-2.5 shrink-0" /> :
                           <Footprints className="h-2.5 w-2.5 shrink-0" />} {c.sportType}
                        </div>
                        <span className="inline-block text-[8px] px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded font-mono font-bold uppercase">{label}</span>
                      </div>
                      <h4 className="font-extrabold text-xs text-white uppercase tracking-tight mt-1.5">{c.title}</h4>
                      {c.status === "upcoming" && (
                        <span className="inline-block mt-1 text-[8px] px-1.5 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded font-mono font-bold uppercase">Upcoming</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 text-right font-mono text-[9px] text-zinc-500 font-bold">
                      <span>{c.participantsCount} joined</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-lime-400/20 bg-lime-400/5 text-[9px] text-lime-400 font-black">
                        Target: {c.goalTarget} {unit}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-1">
                    <Button 
                      onClick={() => handleJoin(c.id, c.title)}
                      disabled={isLoading || isJustJoined}
                      className={`flex-1 h-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        isJustJoined 
                          ? "bg-lime-400/10 text-lime-400 border border-lime-400/20 cursor-default shadow-none" 
                          : "bg-lime-400 hover:bg-lime-500 text-black hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Joining...
                        </>
                      ) : isJustJoined ? (
                        <>
                          <Check className="h-3 w-3" />
                          Joined ✓
                        </>
                      ) : (
                        "Join Challenge"
                      )}
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="h-8 px-3 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      <Link href={`/challenge/${c.id}`}>
                        Know More
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 bg-zinc-950/20 rounded-2xl gap-3">
            <div className="p-3.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-650 animate-pulse">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">No new challenges</h4>
              <p className="text-[10px] text-zinc-555 leading-relaxed max-w-xs mx-auto">
                You have joined all current challenges! Check back later for new events.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Community Feed Section
  // TODO: Replace mock data below with a live fetch from the `community_feed` Supabase table.
  function renderCommunityFeedSection(idSuffix = "") {
    type FeedType = "announcement" | "event" | "milestone" | "notice" | "deadline" | "shoutout";

    const feedItems: {
      id: string;
      type: FeedType;
      title: string;
      body: string;
      timestamp: string;
      meta?: string;
    }[] = (communityFeed && communityFeed.length > 0) ? communityFeed : [
      {
        id: "cf_1",
        type: "announcement",
        title: "🚴 July Century Ride — Now Live!",
        body: "The July Century Ride challenge is officially open. Log your first 100 km before July 31st and earn the Century Club badge.",
        timestamp: "Just now",
        meta: "Challenge",
      },
      {
        id: "cf_2",
        type: "shoutout",
        title: "🏅 Shout-out: Riya Menon",
        body: "Riya crushed the 50 km milestone in a single ride this morning. Incredible effort — the community is watching! 🔥",
        timestamp: "2 hrs ago",
        meta: "Athlete",
      },
      {
        id: "cf_3",
        type: "deadline",
        title: "⏰ Deadline Approaching: Monsoon Miles",
        body: "You have 3 days left to hit your target for the Monsoon Miles challenge. Push it to the finish line!",
        timestamp: "5 hrs ago",
        meta: "Deadline",
      },
      {
        id: "cf_4",
        type: "milestone",
        title: "🎉 Community Hit 10,000 km!",
        body: "Together, KYL Arena athletes have logged a cumulative 10,000 km this month. That's the distance from Mumbai to London. Epic.",
        timestamp: "Yesterday",
        meta: "Milestone",
      },
      {
        id: "cf_5",
        type: "event",
        title: "📅 Virtual Group Ride — July 12",
        body: "Join the Saturday virtual group ride at 6:30 AM IST. Register via Strava and link your activity to the arena. All levels welcome.",
        timestamp: "Yesterday",
        meta: "Event",
      },
      {
        id: "cf_6",
        type: "notice",
        title: "📌 Admin: Leaderboard Refresh",
        body: "Leaderboards are refreshed every Sunday at midnight IST. Manual re-sync is available in your dashboard settings if needed.",
        timestamp: "2 days ago",
        meta: "Admin",
      },
    ];

    const typeConfig = {
      announcement: {
        icon: <Megaphone className="h-3.5 w-3.5" />,
        accent: "border-lime-400/20 bg-lime-400/5",
        badge: "bg-lime-400/10 text-lime-400 border-lime-400/20",
        dot: "bg-lime-400",
      },
      shoutout: {
        icon: <Star className="h-3.5 w-3.5" />,
        accent: "border-amber-400/20 bg-amber-400/5",
        badge: "bg-amber-400/10 text-amber-400 border-amber-400/20",
        dot: "bg-amber-400",
      },
      deadline: {
        icon: <Clock className="h-3.5 w-3.5" />,
        accent: "border-red-400/20 bg-red-400/5",
        badge: "bg-red-400/10 text-red-400 border-red-400/20",
        dot: "bg-red-400",
      },
      milestone: {
        icon: <PartyPopper className="h-3.5 w-3.5" />,
        accent: "border-purple-400/20 bg-purple-400/5",
        badge: "bg-purple-400/10 text-purple-400 border-purple-400/20",
        dot: "bg-purple-400",
      },
      event: {
        icon: <Zap className="h-3.5 w-3.5" />,
        accent: "border-sky-400/20 bg-sky-400/5",
        badge: "bg-sky-400/10 text-sky-400 border-sky-400/20",
        dot: "bg-sky-400",
      },
      notice: {
        icon: <Pin className="h-3.5 w-3.5" />,
        accent: "border-zinc-600/30 bg-zinc-800/20",
        badge: "bg-zinc-700/30 text-zinc-400 border-zinc-600/30",
        dot: "bg-zinc-500",
      },
    };

    return (
      <div id={`tour-community-feed-section${idSuffix}`} className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-4 text-left relative overflow-hidden group">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-lg bg-lime-400/10 border border-lime-400/15 flex items-center justify-center text-lime-400">
              <Megaphone className="h-3 w-3" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">
              Community Feed
            </h3>
          </div>
          <span className="text-[9px] text-zinc-600 font-mono">{feedItems.length} posts</span>
        </div>

        {/* Feed Items */}
        <div className="space-y-3">
          {feedItems.map((item, idx) => {
            const cfg = typeConfig[item.type];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
                className={`p-2.5 rounded-xl border transition-all duration-300 relative overflow-hidden group/item cursor-default ${
                  cfg.accent
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`shrink-0 ${cfg.badge.split(' ')[0]} ${cfg.badge.split(' ')[1]} p-1.5 rounded-md`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-bold text-white truncate">
                      {item.title}
                    </h4>
                    <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                      {item.body}
                    </p>
                  </div>
                  <span className="text-[8px] text-zinc-600 font-mono shrink-0 whitespace-nowrap">{item.timestamp}</span>
                </div>

                {/* Subtle hover shimmer line */}
                <div className={`absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-current to-transparent ${cfg.dot === 'bg-lime-400' ? 'text-lime-400/30' : cfg.dot === 'bg-amber-400' ? 'text-amber-400/30' : cfg.dot === 'bg-red-400' ? 'text-red-400/30' : cfg.dot === 'bg-purple-400' ? 'text-purple-400/30' : cfg.dot === 'bg-sky-400' ? 'text-sky-400/30' : 'text-zinc-600/30'}`} />
              </motion.div>
            );
          })}
        </div>

        {/* Footer hint */}
        <p className="text-[9px] text-zinc-700 font-mono text-center pt-1">
          Powered by <span className="text-zinc-500">community_feed</span> · Updates live
        </p>
      </div>
    );
  }

  // Render Recent Synced Activities
  function renderRecentActivities(idSuffix = "") {
    return (
      <div id={`tour-activities-section${idSuffix}`} className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-5 text-left relative overflow-hidden group">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            RECENT SYNCED ACTIVITIES
          </h3>
          {displayActivities.length > 0 && (
            <span className="text-[9px] text-zinc-500 font-mono">
              Showing latest 5
            </span>
          )}
        </div>

        {displayActivities.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2.5"
          >
            {displayActivities.slice(0, 5).map((activity, idx) => {
              const isRide = activity.sport_type === "Ride" || activity.sport_type === "VirtualRide";
              const isRun = activity.sport_type === "Run";
              const isWalk = activity.sport_type === "Walk" || activity.sport_type === "Hike";
              
              const formatAverageSpeed = (speedMs: number | null | undefined, sportType: string) => {
                if (!speedMs || speedMs <= 0) return null;
                if (sportType === "Run" || sportType === "Walk" || sportType === "Hike") {
                  const paceDec = 16.6667 / speedMs;
                  const mins = Math.floor(paceDec);
                  const secs = Math.round((paceDec - mins) * 60);
                  if (mins > 59) return null;
                  return `${mins}:${secs.toString().padStart(2, "0")} /km`;
                } else {
                  const kmh = speedMs * 3.6;
                  return `${kmh.toFixed(1)} km/h`;
                }
              };

              const speedDisplay = formatAverageSpeed(activity.average_speed, activity.sport_type);
              const elev = Number(activity.total_elevation_gain || 0);
              
              return (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-lime-400/20 transition-all hover:translate-x-0.5 group/act-row"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 border ${
                      isRide ? "bg-amber-500/10 border-amber-500/10 text-amber-400" :
                      isRun ? "bg-emerald-500/10 border-emerald-500/10 text-emerald-400" :
                      isWalk ? "bg-blue-500/10 border-blue-500/10 text-blue-400" :
                      "bg-zinc-800/10 border-zinc-800/10 text-zinc-400"
                    }`}>
                      {isRide ? <Bike className="h-4.5 w-4.5" /> : 
                       isRun ? <Flame className="h-4.5 w-4.5" /> :
                       <Footprints className="h-4.5 w-4.5" />}
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[280px]">
                        {activity.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px] text-zinc-500 uppercase tracking-wide" suppressHydrationWarning>
                        <span>{activity.sport_type}</span>
                        <span>•</span>
                        <span>{formatDate(activity.start_date)}</span>
                        {speedDisplay && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-400">{speedDisplay}</span>
                          </>
                        )}
                        {elev > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-lime-450">+{Math.round(elev)} m</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <p className="text-xs font-bold text-white">
                      {(activity.distance / 1000).toFixed(2)} km
                    </p>
                    <div className="flex items-center gap-1.5 justify-end text-[9px] text-zinc-550 mt-0.5">
                      <Clock className="h-2.5 w-2.5 text-zinc-650" />
                      <span>{Math.round(activity.moving_time / 60)} min</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {syncError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-400 text-[10px] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="font-mono">{syncError}</span>
              </div>
            )}

            <div className="pt-2 text-center">
              <Button
                onClick={handleSyncActivities}
                disabled={isSyncing}
                variant="outline"
                className="h-10 px-6 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider mx-auto cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-lime-400" />
                    {syncStatusText}
                  </>
                ) : (
                  <>
                    <Activity className="h-3.5 w-3.5" />
                    Refresh activities sync
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Empty state */
          <div className="p-6 text-center border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center py-8 gap-4 bg-zinc-950/25">
            <div className="p-3.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-650">
              <Activity className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">No activities synced yet</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xs mx-auto">Once your Strava connection registers workouts, they will populate here instantly to count towards challenges.</p>
            </div>
            {!profile.strava_connected && (
              <Button 
                onClick={handleConnectStrava} 
                className="h-9 px-5 bg-[#FC6100] hover:bg-[#E55500] text-white font-extrabold rounded-lg transition-colors text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Connect Strava Profile
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render Community Leaderboard Preview (Top 5)
  function renderLeaderboardSection(idSuffix = "") {
    const selectedChallenge = 
      activeChallenges.find(c => c.id === selectedLeaderboardId) || 
      activeChallenges.find(c => c.userJoined) || 
      activeChallenges[0];

    if (!selectedChallenge) {
      return (
        <div id={`tour-leaderboard-section${idSuffix}`} className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-4 text-left relative overflow-hidden group">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">COMMUNITY LEADERBOARD</h3>
          <p className="text-xs text-zinc-500 font-mono py-4 text-center">No active challenges found.</p>
        </div>
      );
    }

    const unit = selectedChallenge.goalType === "Distance" ? "km" : selectedChallenge.goalType === "Elevation" ? "m" : "hrs";
    const leaderboardData = selectedChallenge.leaderboard || [];

    return (
      <div id={`tour-leaderboard-section${idSuffix}`} className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-4 text-left relative overflow-hidden group">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">
            COMMUNITY LEADERBOARD
          </h3>
          {activeChallenges.length > 1 ? (
            <select
              value={selectedChallenge.id}
              onChange={(e) => setSelectedLeaderboardId(e.target.value)}
              className="text-[9px] text-lime-400 font-bold uppercase tracking-wider bg-lime-400/10 hover:bg-lime-400/20 px-2.5 py-0.5 rounded-full font-mono cursor-pointer border border-lime-400/20 outline-none focus:ring-1 focus:ring-lime-400 max-w-[130px] appearance-none text-center"
              style={{
                textAlignLast: "center",
              }}
            >
              {activeChallenges.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-900 text-white font-mono uppercase text-[9px]">
                  {c.title.length > 18 ? `${c.title.substring(0, 18)}...` : c.title}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[9px] text-lime-400 font-bold uppercase tracking-wider bg-lime-400/10 px-2 py-0.5 rounded-full select-none font-mono truncate max-w-[120px]" title={selectedChallenge.title}>
              {selectedChallenge.title}
            </span>
          )}
        </div>

        <div className="space-y-2 font-mono">
          {leaderboardData.length > 0 ? (
            leaderboardData.slice(0, 5).map((competitor: any, index: number) => {
              const rank = index + 1;
              const isMe = competitor.userId === profile.id;
              
              let gapText = "";
              if (index === 0) {
                gapText = "Leader";
              } else {
                const ahead = leaderboardData[index - 1];
                const gap = ahead.completed - competitor.completed;
                gapText = `-${gap.toFixed(1)} ${unit}`;
              }

              return (
                <motion.div 
                  key={competitor.userId}
                  whileHover={{ scale: 1.01 }}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition-all ${
                    isMe 
                      ? "bg-lime-950/20 border-lime-400/30 shadow-[0_0_12px_rgba(163,230,53,0.05)]" 
                      : "bg-zinc-950/40 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-5.5 w-5.5 rounded-full flex items-center justify-center font-bold text-[10px] border ${
                      rank === 1 ? "bg-amber-400/15 border-amber-400/30 text-amber-400" :
                      rank === 2 ? "bg-zinc-400/15 border-zinc-450/30 text-zinc-350" :
                      rank === 3 ? "bg-amber-700/15 border-amber-700/30 text-amber-600" :
                      "bg-zinc-900 border-white/5 text-zinc-500"
                    }`}>
                      {rank}
                    </span>
                    <span className={`font-bold uppercase tracking-wide truncate max-w-[120px] ${isMe ? "text-lime-400" : "text-white"}`}>
                      {competitor.name} {isMe && "(You)"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`font-extrabold text-[11px] ${isMe ? "text-lime-400" : "text-zinc-300"}`}>
                      {competitor.completed.toFixed(1)} {unit}
                    </span>
                    <span className={`text-[8px] font-bold tracking-wider mt-0.5 ${index === 0 ? "text-amber-400/80" : "text-red-400/80"}`}>
                      {gapText}
                    </span>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <p className="text-xs text-zinc-500 font-mono py-2 text-center">No participants joined yet.</p>
          )}
        </div>

        <Button
          variant="ghost"
          asChild
          className="w-full h-9 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider font-extrabold cursor-pointer"
        >
          <Link href={`/challenge/${selectedChallenge.id}`}>
            <span>View Full Leaderboard</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  // Render Diagnostics Console Accordion Drawer


  // Render User Settings & Onboarding Preferences Modal
  function renderSettingsModal() {
    if (!isSettingsOpen) return null;
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSettingsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative max-w-md w-full bg-zinc-950 border border-zinc-850 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(163,230,53,0.02)] z-50 text-left space-y-6 overflow-hidden"
          >
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/30 to-transparent" />
            
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2 italic">
                <Flame className="h-4.5 w-4.5 text-lime-400 animate-pulse" />
                Athlete Settings
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-4 bg-zinc-900/30 border border-white/5 p-4 rounded-2xl">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar} alt={profile.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-lime-400/20" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-zinc-850 text-sm font-black flex items-center justify-center text-lime-400">{getInitials(profile.name)}</div>
              )}
              <div>
                <h4 className="font-extrabold text-white text-xs uppercase tracking-wide">{profile.name}</h4>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{profile.email}</p>
                <span className="inline-block text-[8px] font-bold text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full mt-1.5 uppercase font-mono tracking-wider">
                    {(() => {
                      const joined = activeChallenges.find(c => c.userJoined && c.status === "active");
                      if (!joined) return "Not Participating";
                      return joined.userRank ? `Rank #${joined.userRank} Athlete` : "Rank Pending";
                    })()}
                  </span>
              </div>
            </div>

            {/* Settings Sections */}
            <div className="space-y-5">
              <div>
                <h5 className="text-[9px] font-black uppercase tracking-widest text-zinc-550 mb-2 font-bold">Preferences</h5>
                <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h6 className="text-[10px] font-extrabold text-white uppercase tracking-wider">Interactive Tour</h6>
                      <p className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed">Restart the interactive walkthrough of the KYL Arena dashboard.</p>
                    </div>
                    <Button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        setIsTourOpen(true);
                      }}
                      className="h-8 px-3.5 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-xl text-[9px] uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-md shadow-lime-400/10 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      Restart Tour
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-[9px] font-black uppercase tracking-widest text-zinc-550 mb-2 font-bold">Tracker Integrations</h5>
                <div className="bg-zinc-900/20 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h6 className="text-[10px] font-extrabold text-white uppercase tracking-wider">Strava Account</h6>
                      <p className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed">
                        {profile.strava_connected 
                          ? `Linked to Strava (Athlete ID: ${profile.strava_athlete_id || "Connected"}).` 
                          : "Connect your Strava profile to synchronize fitness logs."}
                      </p>
                    </div>
                    {profile.strava_connected ? (
                      <Button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          handleDisconnectStrava();
                        }}
                        disabled={loadingDisconnect}
                        className="h-8 px-3 border border-red-500/15 hover:border-red-500/35 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 text-[9px] uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer font-bold"
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          handleConnectStrava();
                        }}
                        disabled={loadingConnect}
                        className="h-8 px-3 bg-[#FC6100] hover:bg-[#E55500] text-white text-[9px] uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer font-extrabold shadow-md shadow-[#FC6100]/10 hover:scale-[1.01]"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Options */}
            <div className="flex gap-2.5 pt-2">
              <Button
                onClick={() => setIsSettingsOpen(false)}
                variant="outline"
                className="flex-1 h-9.5 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-[9.5px] uppercase tracking-wider transition-all cursor-pointer"
              >
                Close Settings
              </Button>
              <Button
                onClick={() => {
                  setIsSettingsOpen(false);
                  handleLogout();
                }}
                disabled={loadingLogout}
                className="flex-1 h-9.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-350 hover:text-white rounded-xl text-[9.5px] uppercase tracking-wider transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5"
              >
                {loadingLogout ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                Sign Out
              </Button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  function renderChallengePortalModal() {
    if (!isChallengePortalOpen) return null;

    // Filter to challenges not joined
    const unjoinedChallenges = activeChallenges.filter(
      c => !c.userJoined && !justJoinedIds.includes(c.id)
    );

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsChallengePortalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative max-w-xl w-full bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(163,230,53,0.02)] z-50 text-left space-y-6 overflow-hidden max-h-[85vh] flex flex-col"
          >
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/30 to-transparent" />
            
            <div className="flex justify-between items-center border-b border-white/5 pb-4 shrink-0">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2 italic font-mono">
                <Trophy className="h-4.5 w-4.5 text-lime-400 animate-pulse" />
                CHALLENGE PORTAL TERMINAL
              </h3>
              <button
                onClick={() => setIsChallengePortalOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {unjoinedChallenges.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.1)] animate-bounce">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">ALL CHALLENGES ENROLLED</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
                      Incredible! You have joined all available community challenges in KYL Arena. Sync your workouts to lead the rankings.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">AVAILABLE FOR ENROLLMENT</p>
                  {unjoinedChallenges.map((c) => {
                    const isRide = c.sportType === "Ride";
                    const isRun = c.sportType === "Run";
                    const isWalk = c.sportType === "Walk";
                    const unit = c.goalType === "Distance" ? "km" : c.goalType === "Elevation" ? "m" : "hrs";
                    const isJoining = loadingJoinId === c.id;

                    return (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 space-y-3 hover:border-lime-400/20 transition-all duration-300 relative group/card"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${
                              isRide ? "border-lime-400/20 bg-lime-400/5 text-lime-400" :
                              isRun ? "border-red-400/20 bg-red-400/5 text-red-400" :
                              "border-blue-400/20 bg-blue-400/5 text-blue-400"
                            }`}>
                              {isRide ? <Bike className="h-2.5 w-2.5 shrink-0" /> : 
                               isRun ? <Flame className="h-2.5 w-2.5 shrink-0" /> :
                               <Footprints className="h-2.5 w-2.5 shrink-0" />} {c.sportType}
                            </div>
                            <h4 className="font-extrabold text-xs text-white uppercase tracking-tight mt-1.5">{c.title}</h4>
                            <p className="text-[10px] text-zinc-500 leading-relaxed mt-1 font-semibold max-w-sm">{c.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0 text-right font-mono text-[9px] text-zinc-500 font-bold">
                            <span>{c.participantsCount} joined</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-lime-400/20 bg-lime-400/5 text-[9px] text-lime-400 font-black">
                              Target: {c.goalTarget} {unit}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1.5 border-t border-white/5">
                          <Button
                            onClick={async () => {
                              await handleJoin(c.id, c.title);
                            }}
                            disabled={isJoining}
                            className="flex-1 h-8 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer"
                          >
                            {isJoining ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Enrolling...
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                QUICK JOIN
                              </>
                            )}
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="h-8 px-3 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
                          >
                            <Link href={`/challenge/${c.id}`} onClick={() => setIsChallengePortalOpen(false)}>
                              INFO
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }
}
