"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Loader2, LogOut, Activity, AlertTriangle, CheckCircle, 
  Award, Bike, Footprints, Flame, Trophy, 
  ChevronRight, TrendingUp, Sparkles, Clock, Target, 
  Dumbbell, Home, Users, HelpCircle, X, Shield, Settings,
  Lock, Check, Bell, AlertCircle
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
  activeChallenges
}: DashboardClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingDisconnect, setLoadingDisconnect] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingJoinId, setLoadingJoinId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Responsive bottom nav tab selector for mobile screens
  const [activeTab, setActiveTab] = useState<"dashboard" | "challenges" | "leaderboard">("dashboard");

  // Toast notifications state
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; type: "success" | "error" | "info" | "warning" }[]>([]);
  const addNotification = (title: string, message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };
  
  // Track IDs that have been joined during this session to avoid latency gaps
  const [justJoinedIds, setJustJoinedIds] = useState<string[]>([]);

  // Onboarding & Preferences Settings Menu States
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

  // State Selector Simulator for verification purposes
  const [simulatedState, setSimulatedState] = useState<"auto" | "A" | "B" | "C" | "D" | "E">("auto");
  const [joinedChallenge, setJoinedChallenge] = useState<boolean>(false);
  const [completedChallenge, setCompletedChallenge] = useState<boolean>(false);

  // Sync success indicator for micro-interaction
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

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

  // Determine current display State (A, B, C, D, E) based on database or simulation controls
  let currentState: "A" | "B" | "C" | "D" | "E" = "A";
  if (simulatedState !== "auto") {
    currentState = simulatedState;
  } else {
    if (!profile.strava_connected) {
      currentState = "A";
    } else if (!profile.activities || profile.activities.length === 0) {
      currentState = "B";
    } else {
      if (completedChallenge) {
        currentState = "E";
      } else if (joinedChallenge) {
        currentState = "D";
      } else {
        currentState = "C";
      }
    }
  }

  // Handle live activities synchronization
  const handleSyncActivities = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setShowSyncSuccess(false);
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
          "Sync Complete", 
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
      setIsSyncing(false);
    }
  };

  // Check for completed challenges to show victory toasts
  useEffect(() => {
    const checkCompletedChallenges = () => {
      const enrolled = activeChallenges.filter(c => c.userJoined);
      enrolled.forEach(c => {
        const userActivities = profile.activities || [];
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
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      localStorage.removeItem("kyl_mock_user");
      localStorage.removeItem("kyl_mock_strava_linked");
      localStorage.removeItem("kyl_mock_activities_synced");
      localStorage.removeItem("kyl_mock_last_synced_at");
      window.location.href = "/login";
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
        setJoinedChallenge(false);
        setCompletedChallenge(false);
        setCurrentConnectionCount(prev => prev !== undefined ? Math.max(0, prev - 1) : 0);
      } else {
        const data = await res.json();
        alert(`Failed to disconnect: ${data.error || "Unknown error"}`);
      }
    } catch {
      alert("Error disconnecting Strava.");
    } finally {
      setLoadingDisconnect(false);
    }
  };

  // Helper mock activites generator to support simulated State C transitions
  const triggerMockSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        last_synced_at: new Date().toISOString(),
        activities: [
          { name: "Morning Gravel Grind 🚴", sport_type: "Ride", distance: 48500, moving_time: 7200, start_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
          { name: "Interval Speed Session ⚡", sport_type: "Run", distance: 10500, moving_time: 2900, start_date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString() },
          { name: "Recovery Run Along Park 🌳", sport_type: "Run", distance: 5200, moving_time: 1700, start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
          { name: "Lunch Walk 🚶", sport_type: "Walk", distance: 3800, moving_time: 2400, start_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
          { name: "Weekend Century Ride 🚴‍♂️🔥", sport_type: "Ride", distance: 102400, moving_time: 14800, start_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
        ],
        activities_count: 5,
      }));
      setIsSyncing(false);
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 5000);
    }, 1200);
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
      
      {/* Premium Gradient Background Blur Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[550px] h-[550px] bg-lime-500/5 rounded-full blur-[130px] pointer-events-none animate-pulse duration-[10000ms]" />
      <div className="absolute bottom-10 right-1/4 translate-x-1/2 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[110px] pointer-events-none animate-pulse duration-[8000ms]" />

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
                  className="flex items-center gap-2.5 md:gap-3 bg-zinc-900/40 border border-white/5 pl-2.5 pr-2.5 md:pl-3.5 md:pr-4 py-1.5 rounded-full backdrop-blur-sm cursor-pointer hover:border-lime-400/35 hover:bg-zinc-900/60 transition-all select-none"
                >
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] font-black text-white uppercase italic leading-none">{profile.name.split(" ")[0]}</p>
                    <p className="text-[8px] text-lime-400 font-mono mt-0.5 leading-none">Rank #9</p>
                  </div>
                  {profile.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar} alt={profile.name} className="h-6 w-6 rounded-full object-cover ring-1 ring-lime-400/30" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-zinc-800 text-[9px] font-black flex items-center justify-center text-lime-400">{getInitials(profile.name)}</div>
                  )}
                </div>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-zinc-950/95 border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(163,230,53,0.02)] backdrop-blur-xl py-2.5 z-55 text-left overflow-hidden"
                    >
                      {/* Menu Header with User details */}
                      <div className="px-4 py-2 flex items-center gap-3 border-b border-white/5 pb-3 mb-2">
                        {profile.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profile.avatar} alt={profile.name} className="h-9 w-9 rounded-full object-cover ring-1 ring-lime-400/30" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-zinc-850 text-xs font-black flex items-center justify-center text-lime-400">{getInitials(profile.name)}</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{profile.name}</p>
                          <p className="text-[9px] text-zinc-500 font-mono truncate">{profile.email}</p>
                          <span className="inline-block text-[8px] font-mono text-lime-400 bg-lime-400/10 px-1.5 py-0.5 rounded-full mt-1">Rank #9</span>
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      <div className="space-y-0.5 px-1.5">
                        
                        {/* Profile Settings */}
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsSettingsOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer"
                        >
                          <Settings className="h-4 w-4 text-zinc-500" />
                          <span>Profile Settings</span>
                        </button>

                        {/* Admin Panel switcher (if authorized) */}
                        {(profile.role === "super_admin" || profile.role === "challenge_admin") && (
                          <Link
                            href="/arena-admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-lime-400 hover:bg-lime-950/20 rounded-xl transition-all cursor-pointer"
                          >
                            <Shield className="h-4 w-4 text-lime-400" />
                            <span>Admin Console</span>
                          </Link>
                        )}

                        {/* Restart Tour */}
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsTourOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer"
                        >
                          <Sparkles className="h-4 w-4 text-zinc-500" />
                          <span>Restart Tour</span>
                        </button>

                        {/* Help FAQs */}
                        <a 
                          href="#tour-challenges-section" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            setIsMenuOpen(false); 
                            setActiveTab("challenges"); 
                            const suffix = window.innerWidth < 768 ? "-mobile" : "-desktop"; 
                            const el = document.getElementById(`tour-challenges-section${suffix}`); 
                            if (el) el.scrollIntoView({ behavior: "smooth" }); 
                          }} 
                          className="flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer"
                        >
                          <HelpCircle className="h-4 w-4 text-zinc-500" />
                          <span>FAQs & Support</span>
                        </a>

                        {/* Community Rules */}
                        <a 
                          href="#tour-leaderboard-section" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            setIsMenuOpen(false); 
                            setActiveTab("leaderboard"); 
                            const suffix = window.innerWidth < 768 ? "-mobile" : "-desktop"; 
                            const el = document.getElementById(`tour-leaderboard-section${suffix}`); 
                            if (el) el.scrollIntoView({ behavior: "smooth" }); 
                          }} 
                          className="flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer"
                        >
                          <Users className="h-4 w-4 text-zinc-500" />
                          <span>Community Rules</span>
                        </a>

                        {/* Divider */}
                        <div className="h-px bg-white/5 my-1 mx-2" />

                        {/* Sign Out */}
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleLogout();
                          }}
                          disabled={loadingLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
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
              
              {/* 2. Current Challenges */}
              {renderCurrentChallengesSection("-mobile")}
              
              {/* 3. Today's / Weekly Progress */}
              {renderStatsGrid("-mobile")}
              
              {/* 4. Recent Activities */}
              {renderRecentActivities("-mobile")}
              
              {/* 5. Community Rank */}
              {renderLeaderboardSection("-mobile")}
              
              {/* 6. Achievements */}
              {renderAchievementsSection("-mobile")}
              
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
            
            {/* 2. Current Challenges */}
            {renderCurrentChallengesSection("-desktop")}
            
            {/* 3. Today's / Weekly Progress */}
            {renderStatsGrid("-desktop")}
            
            {/* 4. Recent Activities */}
            {renderRecentActivities("-desktop")}
          </div>

          {/* RIGHT COLUMN: Community rank, achievements, upcoming challenges */}
          <div className="md:col-span-5 lg:col-span-4 space-y-8 lg:space-y-10">
            {/* 5. Community Rank */}
            {renderLeaderboardSection("-desktop")}
            
            {/* 6. Achievements */}
            {renderAchievementsSection("-desktop")}
            
            {/* 7. Upcoming Challenges */}
            {renderUpcomingChallengesSection("-desktop")}
          </div>

        </div>

        {/* Diagnostics console drawer at the bottom */}
        {diagnostics && renderDiagnosticsConsole()}

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

      {/* Premium Toast notifications container absolute stack */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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

      {/* FLOATING STATE SIMULATOR PANEL (Mock Developer Controls) */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-50 bg-zinc-900/90 border border-white/10 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col items-center gap-2 max-w-[200px]">
        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">State Simulator</span>
        <div className="flex gap-1 flex-wrap justify-center">
          {(["auto", "A", "B", "C", "D", "E"] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setSimulatedState(st);
                if (st === "D") {
                  setJoinedChallenge(true);
                  setCompletedChallenge(false);
                } else if (st === "E") {
                  setJoinedChallenge(true);
                  setCompletedChallenge(true);
                } else if (st === "C") {
                  setJoinedChallenge(false);
                  setCompletedChallenge(false);
                  if (!profile.activities || profile.activities.length === 0) {
                    setProfile(prev => ({
                      ...prev,
                      activities: [
                        { name: "Morning Gravel Grind 🚴", sport_type: "Ride", distance: 48500, moving_time: 7200, start_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
                        { name: "Interval Speed Session ⚡", sport_type: "Run", distance: 10500, moving_time: 2900, start_date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString() },
                        { name: "Recovery Run Along Park 🌳", sport_type: "Run", distance: 5200, moving_time: 1700, start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
                        { name: "Lunch Walk 🚶", sport_type: "Walk", distance: 3800, moving_time: 2400, start_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
                        { name: "Weekend Century Ride 🚴‍♂️🔥", sport_type: "Ride", distance: 102400, moving_time: 14800, start_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
                      ],
                      activities_count: 5,
                    }));
                  }
                } else if (st === "A") {
                  setJoinedChallenge(false);
                  setCompletedChallenge(false);
                } else if (st === "B") {
                  setJoinedChallenge(false);
                  setCompletedChallenge(false);
                  setProfile(prev => ({ ...prev, activities: [], activities_count: 0 }));
                }
              }}
              className={`h-6 w-8 text-[10px] font-bold rounded flex items-center justify-center transition-all cursor-pointer ${
                simulatedState === st
                  ? "bg-lime-400 text-black font-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Mock Role Selector */}
        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider mt-2 pt-2 border-t border-white/5 w-full text-center">Mock Role</span>
        <div className="grid grid-cols-2 gap-1 w-full">
          {(["athlete", "challenge_admin", "organization_admin", "super_admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                localStorage.setItem("kyl_mock_role", r);
                document.cookie = `kyl-mock-role=${r}; path=/; max-age=3600; SameSite=Lax`;
                if (r === "organization_admin") {
                  window.location.href = "/arena-admin";
                } else {
                  window.location.reload();
                }
              }}
              className={`h-6 px-1 text-[8.5px] font-bold rounded flex items-center justify-center transition-all cursor-pointer truncate ${
                profile.role === r
                  ? "bg-lime-400 text-black font-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
              title={r}
            >
              {r.replace("_admin", "")}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Modal Component */}
      {renderSettingsModal()}

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

          {/* STATE A: No Strava Connected */}
          {stateLetter === "A" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-lime-400 border border-lime-400/20 px-2.5 py-0.5 rounded-full bg-lime-400/5 select-none">
                  <Flame className="h-3 w-3 animate-pulse" /> Unlock the Arena
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white leading-tight">
                  Connect Strava <span className="text-lime-400 not-italic font-normal">To Begin</span>
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl font-medium">
                  Connect your Strava account to start syncing activities.
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
          )}

          {/* STATE B: Strava Connected, No Activities */}
          {stateLetter === "B" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-400/20 px-2.5 py-0.5 rounded-full bg-emerald-400/5 select-none">
                  <CheckCircle className="h-3 w-3 animate-ping" /> Connection Established
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white leading-tight">
                  Welcome to <span className="text-lime-400 not-italic">KYL Arena</span>
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl font-medium">
                  Your Strava connection is verified. Record your first fitness activity on Strava, and we will sync it automatically to leaderboards here.
                </p>
              </div>

              {/* Status Box */}
              <div className="p-5 rounded-2xl bg-zinc-950/50 border border-white/5 text-center flex flex-col items-center justify-center py-6 gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs text-zinc-500 font-mono">Awaiting activity signals...</span>
                </div>
                <p className="text-[10px] text-zinc-450 leading-relaxed max-w-xs">Once you finish a ride, run, or walk and save it to your Strava profile, it automatically pulls into our database.</p>
              </div>

              {/* Interactive test trigger */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={triggerMockSync} 
                  disabled={isSyncing}
                  className="px-6 h-11 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                  Sync Mock Activity
                </Button>
                <Link 
                  href="https://www.strava.com" 
                  target="_blank"
                  className="px-6 h-11 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider bg-zinc-950/20"
                >
                  Go to Strava
                </Link>
              </div>
            </div>
          )}

          {/* STATE C: Activities Present, No Active Challenge */}
          {stateLetter === "C" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-lime-400 border border-lime-400/20 px-2.5 py-0.5 rounded-full bg-lime-400/5 select-none">
                  <CheckCircle className="h-3 w-3" /> Synchronized
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white leading-tight">
                  Ready For Your <span className="text-lime-400 not-italic">Next Challenge?</span>
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl font-medium">
                  We compiled your latest activity logs. But you are not enrolled in any challenge yet. Join a community challenge to compare your limits.
                </p>
              </div>

              {/* Stats board */}
              <div className="grid grid-cols-3 gap-3 bg-zinc-950/50 p-4 rounded-2xl border border-white/5 font-mono">
                <div className="text-left">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Monthly Dist.</span>
                  <span className="text-lg font-black text-white">{totalDistanceKm} km</span>
                </div>
                <div className="text-left border-l border-white/5 pl-4">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Activities</span>
                  <span className="text-lg font-black text-white">{profile.activities_count || 5}</span>
                </div>
                <div className="text-left border-l border-white/5 pl-4">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Community Rank</span>
                  <span className="text-lg font-black text-lime-400">#9</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setActiveTab("challenges");
                  const suffix = window.innerWidth < 768 ? "-mobile" : "-desktop";
                  const challengesEl = document.getElementById(`tour-challenges-section${suffix}`);
                  if (challengesEl) challengesEl.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto px-6 h-11 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Trophy className="h-4 w-4" />
                Explore Challenges
              </Button>
            </div>
          )}

          {/* STATE D: Enrolled Active Challenge Card */}
          {stateLetter === "D" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-widest text-lime-400 border border-lime-400/20 px-2.5 py-0.5 rounded-full bg-lime-400/5 select-none mb-1">
                    <Trophy className="h-3 w-3 animate-bounce" /> Active Challenge
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight uppercase">June Century Club</h3>
                </div>
                <div className="rounded-xl bg-zinc-950/60 px-4 py-2 border border-white/5 text-xs sm:text-right font-mono self-start sm:self-center">
                  <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Days Remaining</span>
                  <span className="font-semibold text-lime-400 font-bold">15 Days Left</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                
                {/* SVG Progress Ring */}
                <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="#18181b" strokeWidth="8" fill="transparent" />
                    <motion.circle 
                      cx="56" 
                      cy="56" 
                      r="46" 
                      stroke="#a3e635" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 46}
                      initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - 0.65) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-black text-white leading-none">65%</span>
                    <span className="text-[7.5px] uppercase tracking-widest text-zinc-500 mt-1 font-bold">Complete</span>
                  </div>
                </div>

                {/* Challenge Stats */}
                <div className="flex-1 w-full grid grid-cols-2 gap-4 text-left font-mono">
                  <div className="bg-zinc-950/30 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Total Distance</span>
                    <span className="text-sm font-black text-white">324.5 / 500 km</span>
                  </div>
                  <div className="bg-zinc-950/30 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Current Standing</span>
                    <span className="text-sm font-black text-lime-400">Rank #8</span>
                  </div>
                  <div className="bg-zinc-950/30 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Active Athletes</span>
                    <span className="text-sm font-black text-white">42 Competitors</span>
                  </div>
                  <div className="bg-zinc-950/30 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Category</span>
                    <span className="text-sm font-black text-white">Cycling</span>
                  </div>
                </div>

              </div>

              {/* Progress and simulation bar */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    const suffix = window.innerWidth < 768 ? "-mobile" : "-desktop";
                    const leaderboardEl = document.getElementById(`tour-leaderboard-section${suffix}`);
                    if (leaderboardEl) leaderboardEl.scrollIntoView({ behavior: "smooth" });
                    setActiveTab("leaderboard");
                  }}
                  className="flex-1 sm:flex-none px-6 h-10 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Users className="h-4 w-4" />
                  View Leaderboard
                </Button>

                {/* Simulated fast finish button */}
                <Button
                  onClick={() => setCompletedChallenge(true)}
                  className="px-4 h-10 border border-lime-500/10 hover:border-lime-500/25 bg-lime-950/10 hover:bg-lime-950/20 text-lime-400 font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  Mock Finish
                </Button>
              </div>

            </div>
          )}

          {/* STATE E: Challenge Completed Celebration Card */}
          {stateLetter === "E" && (
            <div className="space-y-6 relative">
              {/* Gold light burst back glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-zinc-900/0 to-lime-500/5 opacity-80 rounded-3xl" />
              
              <div className="text-center space-y-4 py-4 relative z-10">
                <motion.div 
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.15 }}
                  className="mx-auto h-16 w-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.15)] animate-bounce"
                >
                  <Award className="h-9 w-9" />
                </motion.div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-widest text-amber-400 border border-amber-400/20 px-2.5 py-0.5 rounded-full bg-amber-400/5 select-none">
                    <Sparkles className="h-3 w-3" /> Challenge Conquered
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white leading-tight">
                    June Century <span className="text-amber-400 not-italic">Club Cleared!</span>
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto font-medium">
                    Incredible achievement, athlete! You conquered the limits, completed the Century target, and earned your gold medal badge.
                  </p>
                </div>

                {/* Performance Summary */}
                <div className="max-w-md mx-auto grid grid-cols-3 gap-2 bg-zinc-950/60 p-4 rounded-2xl border border-white/5 font-mono text-left">
                  <div>
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Final Standing</span>
                    <span className="text-sm font-black text-amber-400">Rank #4</span>
                  </div>
                  <div className="border-l border-white/5 pl-4">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Total Distance</span>
                    <span className="text-sm font-black text-white">612.4 km</span>
                  </div>
                  <div className="border-l border-white/5 pl-4">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Badge Issued</span>
                    <span className="text-sm font-black text-lime-400 font-extrabold uppercase tracking-wide">Gold Medal</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setJoinedChallenge(false);
                      setCompletedChallenge(false);
                    }}
                    className="px-6 h-11 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] mx-auto cursor-pointer shadow-lg shadow-lime-400/10"
                  >
                    <Trophy className="h-4 w-4" />
                    Join Another Challenge
                  </Button>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    );
  }

  // Render Athlete Performance Grid (Distance, Completed activities, Elevation, Streak)
  function renderStatsGrid(idSuffix = "") {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        id={`tour-stats-section${idSuffix}`}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Stat Card 1: Distance */}
        <motion.div 
          variants={itemVariants}
          className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-lime-400/25 transition-all duration-300 shadow-lg relative group"
        >
          <div className="absolute top-0 right-0 p-3 opacity-5 text-white"><Bike className="h-8 w-8" /></div>
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Total Distance</p>
          <div className="my-2 text-left">
            <span className="text-2xl font-black text-white tracking-tight">{totalDistanceKm}</span>
            <span className="text-[10px] text-zinc-400 font-bold ml-1 font-mono">KM</span>
          </div>
          <p className="text-[9px] text-lime-400 font-bold flex items-center gap-1 leading-none">
            <TrendingUp className="h-3 w-3" /> +12.4% from last week
          </p>
        </motion.div>

        {/* Stat Card 2: Completed activities */}
        <motion.div 
          variants={itemVariants}
          className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-lime-400/25 transition-all duration-300 shadow-lg relative group"
        >
          <div className="absolute top-0 right-0 p-3 opacity-5 text-white"><Dumbbell className="h-8 w-8" /></div>
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Activities</p>
          <div className="my-2 text-left">
            <span className="text-2xl font-black text-white tracking-tight">{profile.activities_count || displayActivities.length}</span>
            <span className="text-[10px] text-zinc-400 font-bold ml-1 uppercase">Synced</span>
          </div>
          <p className="text-[9px] text-zinc-500 font-medium leading-none">
            Avg. {(parseFloat(totalDistanceKm) / Math.max(1, profile.activities_count || displayActivities.length)).toFixed(1)} km / workout
          </p>
        </motion.div>

        {/* Stat Card 3: Elevation gain */}
        <motion.div 
          variants={itemVariants}
          className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-lime-400/25 transition-all duration-300 shadow-lg relative group"
        >
          <div className="absolute top-0 right-0 p-3 opacity-5 text-white"><Target className="h-8 w-8" /></div>
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Elevation Gain</p>
          <div className="my-2 text-left">
            <span className="text-2xl font-black text-white tracking-tight">{totalElevationGain}</span>
            <span className="text-[10px] text-zinc-400 font-bold ml-1 font-mono">M</span>
          </div>
          <p className="text-[9px] text-zinc-550 font-medium leading-none">
            Equivalent to {Math.round(totalElevationGain / 340)} hills
          </p>
        </motion.div>

        {/* Stat Card 4: Streak */}
        <motion.div 
          variants={itemVariants}
          className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-lime-400/25 transition-all duration-300 shadow-lg relative group"
        >
          <div className="absolute top-0 right-0 p-3 opacity-5 text-lime-400"><Flame className="h-8 w-8" /></div>
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Active Streak</p>
          <div className="my-2 text-left flex items-baseline gap-1">
            <span className="text-2xl font-black text-lime-400 tracking-tight">{displayActivities.length > 0 ? "5" : "0"}</span>
            <span className="text-[10px] text-zinc-400 font-bold">DAYS</span>
            <Flame className="h-4.5 w-4.5 text-lime-400 shrink-0 self-center animate-pulse" />
          </div>
          <p className="text-[9px] text-zinc-500 font-medium leading-none">
            Keep it up! Sync weekly.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  const getProgressVal = (c: any) => {
    const userActivities = profile.activities || [];
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
  };

  const handleJoin = async (challengeId: string, challengeTitle: string) => {
    if (!profile.strava_connected) {
      addNotification("Strava Required", "Please connect your Strava profile first to join challenges!", "warning");
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
  };

  // Render Enrolled Challenges Section
  function renderCurrentChallengesSection(idSuffix = "") {
    const enrolled = activeChallenges.filter(c => c.userJoined || justJoinedIds.includes(c.id));

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

        {enrolled.length > 0 ? (
          <div className="space-y-3.5">
            {enrolled.map((c) => {
              const completedVal = getProgressVal(c);
              const pct = Math.min(100, Math.round((completedVal / c.goalTarget) * 100));
              const unit = c.goalType === "Distance" ? "km" : c.goalType === "Elevation" ? "m" : "hrs";
              
              return (
                <div key={c.id} className="p-4 rounded-2xl bg-zinc-900/20 backdrop-blur-md border border-white/5 space-y-3 relative overflow-hidden group/card hover:border-lime-400/20 transition-all duration-300">
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                  
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-white uppercase tracking-tight">{c.title}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      pct >= 100 ? "text-lime-400 bg-lime-400/10" : "text-emerald-400 bg-emerald-400/10"
                    }`}>
                      {pct}% COMPLETE
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="bg-lime-400 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                      <span>{completedVal} {unit} completed</span>
                      <span>{c.goalTarget} {unit} target</span>
                    </div>
                  </div>

                  {/* Standing overview */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Users className="h-3.5 w-3.5" />
                      <span>Rank {c.userRank ? `#${c.userRank}` : "-"} of {c.participantsCount}</span>
                    </div>
                    
                    <Link 
                      href={`/challenge/${c.id}`}
                      className="text-[9px] font-extrabold uppercase text-lime-400 hover:text-lime-500 transition-colors"
                    >
                      Know More
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Premium Empty State: Explore Community Challenges */
          <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 bg-zinc-950/20 rounded-2xl gap-3">
            <div className="p-3 rounded-full bg-zinc-900 border border-white/5 text-zinc-650">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">Explore Community Challenges</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xs mx-auto">
                You are not currently enrolled in any active challenges. Join a community challenge below to compare your progress!
              </p>
            </div>
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

    return (
      <div id={`tour-upcoming-challenges${idSuffix}`} className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-5 text-left relative overflow-hidden group">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">
            SUGGESTED / UPCOMING CHALLENGES
          </h3>
          <span className="text-[9px] text-zinc-500 font-mono">
            {uniqueList.length} Available
          </span>
        </div>

        {uniqueList.length > 0 ? (
          <div className="space-y-3">
            {uniqueList.map((c) => {
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
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${
                        isRide ? "border-lime-400/20 bg-lime-400/5 text-lime-400" :
                        isRun ? "border-red-400/20 bg-red-400/5 text-red-400" :
                        "border-blue-400/20 bg-blue-400/5 text-blue-400"
                      }`}>
                        {isRide ? <Bike className="h-2.5 w-2.5 shrink-0" /> : 
                         isRun ? <Flame className="h-2.5 w-2.5 shrink-0" /> :
                         <Footprints className="h-2.5 w-2.5 shrink-0" />} {c.sportType}
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

  // Render Achievements Section
  function renderAchievementsSection(idSuffix = "") {
    const userActs = profile.activities || [];
    const totalDistance = userActs.reduce((sum: number, act: any) => sum + Number(act.distance || 0), 0) / 1000;
    const totalElevation = userActs.reduce((sum: number, act: any) => sum + Number(act.total_elevation_gain || 0), 0);
    const activeStreak = profile.active_streak || (userActs.length > 0 ? 3 : 0);

    const achievementsList = [
      {
        id: "century_club",
        title: "Century Club",
        description: "Ride 100 km in a single session or accumulate 100 km in total.",
        unlocked: totalDistance >= 100 || userActs.some(a => (a.distance || 0) >= 100000),
        metric: `${Math.round(totalDistance)} / 100 km`
      },
      {
        id: "streak_starter",
        title: "Streak Starter",
        description: "Log consecutive workouts to build a 3-day active streak.",
        unlocked: activeStreak >= 3,
        metric: `${activeStreak} / 3 Days`
      },
      {
        id: "summit_seeker",
        title: "Summit Seeker",
        description: "Scale heights and log at least 1,000 meters of vertical climb.",
        unlocked: totalElevation >= 1000,
        metric: `${Math.round(totalElevation)} / 1,000 m`
      },
      {
        id: "fit_consistent",
        title: "Consistency King",
        description: "Log and sync at least 5 activities in the database.",
        unlocked: userActs.length >= 5,
        metric: `${userActs.length} / 5 Workouts`
      }
    ];

    return (
      <div id={`tour-achievements-section${idSuffix}`} className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-5 text-left relative overflow-hidden group">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">
            ATHLETE ACHIEVEMENTS
          </h3>
          <span className="text-[9px] text-zinc-500 font-mono">
            {achievementsList.filter(a => a.unlocked).length} / {achievementsList.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {achievementsList.map((a) => (
            <div 
              key={a.id} 
              className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                a.unlocked 
                  ? "bg-lime-400/5 border-lime-400/20 shadow-[0_4px_20px_rgba(163,230,53,0.02)]" 
                  : "bg-zinc-950/25 border-white/5"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <h4 className={`text-xs font-bold uppercase tracking-tight ${a.unlocked ? "text-lime-400" : "text-zinc-400"}`}>
                    {a.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-normal font-medium">{a.description}</p>
                </div>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                  a.unlocked 
                    ? "bg-lime-400/15 border-lime-400/20 text-lime-400" 
                    : "bg-zinc-900 border-white/5 text-zinc-655"
                }`}>
                  {a.unlocked ? <Award className="h-4.5 w-4.5" /> : <Lock className="h-4.5 w-4.5" />}
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5 text-[9px] font-mono text-zinc-500">
                <span>Status:</span>
                <span className={a.unlocked ? "text-lime-400 font-bold" : "text-zinc-550"}>
                  {a.unlocked ? "UNLOCKED ✓" : "LOCKED"} ({a.metric})
                </span>
              </div>
            </div>
          ))}
        </div>
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
                {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                Refresh activities sync
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
            {profile.strava_connected ? (
              <Button 
                onClick={triggerMockSync} 
                className="h-9 px-5 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-lg transition-colors text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Simulate Activity Import
              </Button>
            ) : (
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
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            COMMUNITY LEADERBOARD
          </h3>
          <span className="text-[9px] text-lime-400 font-bold uppercase tracking-wider bg-lime-400/10 px-2 py-0.5 rounded-full select-none font-mono truncate max-w-[120px]" title={selectedChallenge.title}>
            {selectedChallenge.title}
          </span>
        </div>

        <div className="space-y-2 font-mono">
          {leaderboardData.length > 0 ? (
            leaderboardData.map((competitor: any, index: number) => {
              const rank = index + 1;
              const isMe = competitor.userId === profile.id;
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
                  <span className={`font-extrabold text-[11px] ${isMe ? "text-lime-400" : "text-zinc-300"}`}>
                    {competitor.completed.toFixed(1)} {unit}
                  </span>
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
          <Link href={`/arena-admin/challenges/${selectedChallenge.slug}`}>
            <span>View Full Leaderboard</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  // Render Diagnostics Console Accordion Drawer
  function renderDiagnosticsConsole() {
    if (!diagnostics) return null;
    return (
      <div className="bg-zinc-900/20 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden mt-8 animate-in fade-in duration-300">
        <details className="group">
          <summary className="flex items-center justify-between p-4 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-white cursor-pointer select-none">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-lime-400" />
              Session Diagnostics Console
            </span>
            <span className="text-[10px] text-zinc-500 group-open:rotate-180 transition-transform duration-200">
              ▼
            </span>
          </summary>
          
          <div className="p-4 border-t border-white/5 bg-zinc-950/90 text-left font-mono text-[10px] text-zinc-455 space-y-3.5 overflow-x-auto leading-relaxed">
            <div className="space-y-1">
              <p className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">1. Current Supabase User</p>
              <div className="pl-3 border-l border-lime-500/20 space-y-0.5">
                <p><span className="text-zinc-500">ID:</span> {diagnostics.supabaseUser.id}</p>
                <p><span className="text-zinc-500">Email:</span> {diagnostics.supabaseUser.email}</p>
                <p><span className="text-zinc-500">Auth Provider:</span> <span className="text-lime-400">{diagnostics.supabaseUser.provider}</span></p>
                <p><span className="text-zinc-500">Last Sign-In:</span> {diagnostics.supabaseUser.lastSignIn}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">2. Linked Athlete Connection</p>
              <div className="pl-3 border-l border-lime-500/20 space-y-0.5">
                <p><span className="text-zinc-500">Athlete ID:</span> {profile.strava_athlete_id || "None connected"}</p>
                <p><span className="text-zinc-500">Database Connection Count:</span> {currentConnectionCount ?? 0}</p>
                
                {profile.strava_connected && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={handleDisconnectStrava}
                      disabled={loadingDisconnect}
                      className="h-6 px-2 text-[9px] font-black uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded border border-red-500/10 cursor-pointer bg-zinc-950"
                    >
                      {loadingDisconnect ? "Disconnecting..." : "Disconnect Strava"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">3. Authentication Callback Logs</p>
              <div className="pl-3 border-l border-lime-500/20 space-y-0.5">
                <p><span className="text-zinc-500">Callback Result:</span> <span className={diagnostics.oauthCallbackResult.includes("Error") ? "text-red-400" : "text-emerald-400"}>{diagnostics.oauthCallbackResult}</span></p>
                <p><span className="text-zinc-500">Profile Lookup Result:</span> {diagnostics.profileLookupResult}</p>
              </div>
            </div>
          </div>
        </details>
      </div>
    );
  }

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
                <span className="inline-block text-[8px] font-bold text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full mt-1.5 uppercase font-mono tracking-wider">Rank #9 Athlete</span>
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
}
