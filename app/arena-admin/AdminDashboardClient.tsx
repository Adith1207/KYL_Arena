"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, Activity, Trophy, Flame, Plus, ArrowLeft,
  CheckCircle, Target, LogOut, Loader2,
  TrendingUp, Award, BarChart3, Search, Shield, X, Bike, Footprints,
  RefreshCw, Zap, Eye, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileData {
  id: string;
  email: string;
  name: string;
  avatar: string;
  auth_provider: string;
  role: string;
  tour_completed?: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  sportType: string;
  goalType: string;
  goalTarget: number;
  startDate: string;
  endDate: string;
  bannerUrl: string;
  status: "active" | "upcoming" | "archived";
  participantsCount: number;
  challenge_code: string;
  slug: string;
}

interface MetricData {
  totalMembers: number;
  activeAthletes: number;
  activeChallenges: number;
  syncedActivities: number;
  totalDistance?: number;
  averageCompletionRate?: number;
}

interface Athlete {
  id: string;
  name: string;
  email: string;
  avatar: string;
  athleteId: string;
  stravaAthleteName: string;
  stravaAthleteUsername: string;
  joinedAt: string;
  stravaConnected: boolean;
  challengeDistance: number;
  recentActivities: {
    id: string;
    name: string;
    sportType: string;
    distance: number;
    movingTime: number;
    elevationGain: number;
    startDate: string;
  }[];
}

interface FeedItem {
  id: string;
  name: string;
  avatar: string;
  action: string;
  sportType: string;
  displayValue: string;
  time: string;
  participantId: string;
}

interface AdminDashboardClientProps {
  profile: ProfileData;
  userRole: string;
  initialChallenges: Challenge[];
  initialMetrics: MetricData;
  allAthletes?: Athlete[];
  recentFeed?: FeedItem[];
}

export default function AdminDashboardClient({ 
  profile, 
  userRole, 
  initialChallenges, 
  initialMetrics,
  allAthletes = [],
  recentFeed = []
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "archived">("active");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sportType, setSportType] = useState("Ride");
  const [goalType, setGoalType] = useState("Distance");
  const [goalTarget, setGoalTarget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  // Search and Modal states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const createFormRef = useRef<HTMLFormElement>(null);

  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);

  useEffect(() => {
    setChallenges(initialChallenges);
  }, [initialChallenges]);

  // Click outside search handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      localStorage.removeItem("kyl_mock_role");
      window.location.href = "/login";
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !goalTarget || !startDate || !endDate) {
      alert("Please fill out all required fields.");
      return;
    }

    setLoadingCreate(true);

    const todayStr = "2026-06-24";
    let determinedStatus: "active" | "upcoming" | "archived" = "active";

    if (startDate > todayStr) {
      determinedStatus = "upcoming";
    } else if (endDate < todayStr) {
      determinedStatus = "archived";
    }

    const defaultBanner = bannerUrl || (
      sportType === "Ride" ? "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?auto=format&fit=crop&w=400&q=80" :
      sportType === "Run" ? "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80" :
      sportType === "Walk" ? "https://images.unsplash.com/photo-1502224562085-639556652f33?auto=format&fit=crop&w=400&q=80" :
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80"
    );

    // Compute code and slug client-side just in case we are in mock mode
    const baseSlug = title.toLowerCase().trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const yearStr = startDate.split("-")[0];
    const yearChallenges = challenges.filter(c => c.challenge_code?.startsWith(`KYL-${yearStr}-`));
    const nextSeq = yearChallenges.length + 1;
    const computedCode = `KYL-${yearStr}-${String(nextSeq).padStart(3, "0")}`;

    try {
      const response = await fetch("/api/auth/session"); // check backend connection
      const isRealDb = response.ok;
      
      const payload = {
        title,
        description,
        sport_type: sportType,
        goal_metric: goalType,
        goal_target: Number(goalTarget),
        start_date: startDate,
        end_date: endDate,
        banner_url: defaultBanner,
        status: determinedStatus,
        created_by: profile.id,
        // Send explicit columns in case the trigger isn't available
        challenge_code: computedCode,
        slug: baseSlug
      };

      const { createClient } = require("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("challenges")
        .insert(payload)
        .select()
        .single();

      if (error) {
        alert(`Failed to create challenge: ${error.message}`);
        return;
      }

      setSuccessMessage(`Challenge "${title}" configured successfully!`);
      
      // Reset form
      setTitle("");
      setDescription("");
      setGoalTarget("");
      setStartDate("");
      setEndDate("");
      setBannerUrl("");

      router.refresh();
    } catch (e: any) {
      console.error("Failed to create challenge:", e);
      alert("Error occurred while creating challenge.");
    } finally {
      setLoadingCreate(false);
    }

    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  const handleSyncAll = async () => {
    setLoadingSync(true);
    try {
      const res = await fetch("/api/admin/sync-all", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Bulk sync complete. Synced ${data.stats.successfulSyncs} athletes!`);
        router.refresh();
      } else {
        alert(`Bulk sync failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to trigger bulk sync:", err);
      alert("Failed to connect to the bulk sync endpoint.");
    } finally {
      setLoadingSync(false);
    }
    setTimeout(() => {
      setSuccessMessage(null);
    }, 6000);
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return "A";
    const parts = fullName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const filteredChallenges = challenges.filter(c => c.status === activeTab);

  // Global search filtering
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { challenges: [], athletes: [] };

    const matchedChallenges = challenges.filter(c => 
      c.title.toLowerCase().includes(q) ||
      c.challenge_code?.toLowerCase().includes(q) ||
      c.sportType.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedAthletes = allAthletes.filter(a => 
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.stravaAthleteName?.toLowerCase().includes(q) ||
      a.stravaAthleteUsername?.toLowerCase().includes(q)
    ).slice(0, 5);

    return { challenges: matchedChallenges, athletes: matchedAthletes };
  }, [searchQuery, challenges, allAthletes]);

  const hasSearchResults = searchResults.challenges.length > 0 || searchResults.athletes.length > 0;

  // Challenge insights calculation
  const insights = useMemo(() => {
    if (challenges.length === 0) return { popular: "None", highestRate: "0%" };
    
    // Most popular
    const sortedByPopular = [...challenges].sort((a,b) => (b.participantsCount || 0) - (a.participantsCount || 0));
    const popular = sortedByPopular[0]?.title || "None";

    return { popular, highestRate: `${initialMetrics.averageCompletionRate || 0}%` };
  }, [challenges, initialMetrics.averageCompletionRate]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-lime-400 selection:text-black overflow-hidden flex flex-col justify-between font-sans">
      
      {/* Cyber-Dark Ambient Lights */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 translate-x-1/2 w-[550px] h-[550px] bg-lime-500/5 rounded-full blur-[130px] pointer-events-none animate-pulse duration-[10000ms]" />
      <div className="absolute bottom-10 left-1/4 -translate-x-1/2 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[110px] pointer-events-none animate-pulse duration-[8000ms]" />

      {/* Admin Top Navigation */}
      <nav className="relative z-30 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="h-7 w-7 transition-transform duration-500 hover:rotate-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g fill="#22c55e"><circle cx="48" cy="20" r="7" /><path d="M 28 69 C 14 78, 12 79, 10 80 Z" /></g>
              </svg>
              <div className="flex flex-col text-left">
                <span className="text-sm font-black tracking-wider text-white leading-none">
                  KYL <span className="text-lime-400">ARENA</span>
                </span>
                <span className="text-[7.5px] font-bold text-lime-450 uppercase tracking-widest mt-0.5">
                  Admin Console
                </span>
              </div>
            </div>

            {/* Global Search Bar Container */}
            <div ref={searchRef} className="relative hidden md:block w-72 lg:w-96 z-40">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Search challenges, athlete codes, names..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full h-9 pl-10 pr-4 bg-zinc-900/50 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-lime-400/40 focus:ring-1 focus:ring-lime-400/20 focus:bg-zinc-900 transition-all placeholder:text-zinc-550"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Instant Global Dropdown results */}
              <AnimatePresence>
                {isSearchFocused && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl max-h-[380px] overflow-y-auto text-left"
                  >
                    {!hasSearchResults ? (
                      <div className="p-5 text-center text-zinc-500 text-xs font-mono">
                        No matches found for &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {/* Challenges Section */}
                        {searchResults.challenges.length > 0 && (
                          <div className="p-3 space-y-1.5">
                            <span className="text-[8px] uppercase tracking-widest text-lime-400 font-extrabold px-2">Challenges</span>
                            {searchResults.challenges.map(chal => (
                              <Link 
                                key={chal.id}
                                href={`/arena-admin/challenges/${chal.slug}`}
                                onClick={() => {
                                  setSearchQuery("");
                                  setIsSearchFocused(false);
                                }}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-950/60 border border-transparent hover:border-white/5 transition-all group"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className="text-xs font-bold text-white group-hover:text-lime-400 truncate transition-colors">{chal.title}</p>
                                  <p className="text-[9px] text-zinc-550 font-mono">{chal.challenge_code}</p>
                                </div>
                                <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-450 border border-white/5 uppercase font-mono">{chal.sportType}</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Athletes Section */}
                        {searchResults.athletes.length > 0 && (
                          <div className="p-3 space-y-1.5">
                            <span className="text-[8px] uppercase tracking-widest text-lime-400 font-extrabold px-2">Athletes</span>
                            {searchResults.athletes.map(ath => (
                              <button
                                key={ath.id}
                                onClick={() => {
                                  setSelectedAthlete(ath);
                                  setSearchQuery("");
                                  setIsSearchFocused(false);
                                }}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-950/60 border border-transparent hover:border-white/5 transition-all text-left group"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={ath.avatar} alt={ath.name} className="h-6.5 w-6.5 rounded-full object-cover ring-1 ring-white/10" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-white group-hover:text-lime-400 truncate transition-colors">{ath.name}</p>
                                  <p className="text-[9px] text-zinc-550 font-mono truncate">{ath.email}</p>
                                </div>
                                <div className="text-right font-mono text-[9px] text-zinc-450">
                                  {ath.challengeDistance.toFixed(0)} km
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3">
              {/* User avatar/role info */}
              <div className="flex items-center gap-2.5 bg-zinc-900/40 border border-lime-400/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <div className="text-right">
                  <p className="text-[10px] font-black text-white uppercase italic leading-none">{profile.name.split(" ")[0]}</p>
                  <p className="text-[8px] text-lime-450 font-mono mt-0.5 leading-none">{userRole.replace("_", " ").toUpperCase()}</p>
                </div>
                {profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar} alt={profile.name} className="h-6 w-6 rounded-full object-cover ring-1 ring-lime-400/30" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-zinc-800 text-[9px] font-black flex items-center justify-center text-lime-400">{getInitials(profile.name)}</div>
                )}
              </div>

              {(userRole === "super_admin" || userRole === "challenge_admin") && (
                <Button
                  asChild
                  className="h-9 px-3.5 border border-lime-400/25 hover:border-lime-400 bg-lime-400/5 hover:bg-lime-400/10 text-lime-400 font-extrabold rounded-xl transition-all flex items-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  <Link href="/dashboard">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Athlete View
                  </Link>
                </Button>
              )}

              <Button
                onClick={handleLogout}
                disabled={loadingLogout}
                variant="outline"
                className="h-9 px-3.5 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all flex items-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer"
              >
                {loadingLogout ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28 md:pb-12 text-left animate-fadeIn">
        
        {/* Banner/Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic">
              KYL Arena <span className="text-lime-400 not-italic">Control Center</span>
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              Initialize new events, audit participant achievements, and monitor sync status.
            </p>
          </div>

          {/* Premium Production Status Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-lime-450/20 bg-lime-400/5 text-lime-400 text-[10px] uppercase font-bold tracking-wider select-none font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-ping" /> Community: Online
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-lime-450/20 bg-lime-400/5 text-lime-400 text-[10px] uppercase font-bold tracking-wider select-none font-mono">
              <Target className="h-3 w-3 text-lime-400" /> Health: Healthy
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-zinc-900 text-zinc-350 text-[10px] uppercase font-bold tracking-wider select-none font-mono">
              <Trophy className="h-3 w-3 text-zinc-400" /> {initialMetrics.activeChallenges} Active
            </div>
          </div>
        </div>

        {/* Success Alert Micro-interaction */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              className="p-4 rounded-2xl bg-lime-950/20 border border-lime-400/30 text-lime-400 flex items-center gap-3 shadow-lg shadow-lime-400/5"
            >
              <CheckCircle className="h-5 w-5 shrink-0 text-lime-400" />
              <div className="text-xs">
                <span className="font-extrabold uppercase tracking-wider mr-1.5">Action Complete:</span>
                <span className="font-medium text-zinc-300">{successMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Community Overview (Metrics Cards Row) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slideIn">
          
          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-lime-400/25 transition-all">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-550 font-black uppercase tracking-wider">Total Members</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-white">{initialMetrics.totalMembers}</p>
              </div>
              <div className="p-2 rounded-lg bg-lime-400/5 text-lime-400 border border-lime-400/10">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="text-[9px] text-lime-400 font-mono mt-3 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Live user registrations
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-lime-400/25 transition-all">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-550 font-black uppercase tracking-wider">Active Athletes</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-white">{initialMetrics.activeAthletes}</p>
              </div>
              <div className="p-2 rounded-lg bg-lime-400/5 text-lime-400 border border-lime-400/10">
                <Activity className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="text-[9px] text-zinc-400 font-mono mt-3">
              {initialMetrics.totalMembers > 0 ? ((initialMetrics.activeAthletes / initialMetrics.totalMembers) * 100).toFixed(1) : 0}% connection rate
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-lime-400/25 transition-all">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-550 font-black uppercase tracking-wider">Total Distance</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-white">{(initialMetrics.totalDistance || 0).toLocaleString()} km</p>
              </div>
              <div className="p-2 rounded-lg bg-lime-400/5 text-lime-400 border border-lime-400/10">
                <Trophy className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="text-[9px] text-zinc-450 font-mono mt-3">
              Cumulative log distance
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-lime-400/25 transition-all">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-550 font-black uppercase tracking-wider">Completion Rate</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-white">{initialMetrics.averageCompletionRate || 0}%</p>
              </div>
              <div className="p-2 rounded-lg bg-lime-400/5 text-lime-400 border border-lime-400/10">
                <Flame className="h-4.5 w-4.5 animate-pulse" />
              </div>
            </div>
            <p className="text-[9px] text-lime-400 font-mono mt-3">
              Average target completions
            </p>
          </div>

        </div>

        {/* 2. Challenge Control Center & 3. Create Challenge Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Challenge Control Center */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header / Tabs */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 sm:p-6 space-y-6 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <h3 className="font-extrabold uppercase tracking-wider text-xs text-white flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-lime-400" /> Challenge Control Center
                </h3>

                {/* Status Switcher Tabs */}
                <div className="flex rounded-lg bg-zinc-950 p-1 border border-white/5 self-start">
                  {(["active", "upcoming", "archived"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`h-7 px-3.5 rounded text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                        activeTab === tab 
                          ? "bg-lime-400 text-black animate-pulseFast" 
                          : "text-zinc-555 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Challenge Grid list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredChallenges.length > 0 ? (
                  filteredChallenges.map((challenge) => (
                    <Link 
                      key={challenge.id}
                      href={`/arena-admin/challenges/${challenge.slug}`}
                      className="bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-lime-400/20 transition-all cursor-pointer block"
                    >
                      {/* Banner Image with Overlay */}
                      <div className="h-28 w-full relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={challenge.bannerUrl} 
                          alt={challenge.title} 
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-zinc-950/20" />
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md border border-white/10 bg-zinc-950/80 text-[8px] font-mono text-zinc-400 uppercase tracking-widest select-none">
                          {challenge.sportType}
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-left">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs uppercase tracking-tight text-white group-hover:text-lime-400 transition-colors">
                            {challenge.title}
                          </h4>
                          <span className="inline-block text-[8px] font-mono text-zinc-500 tracking-wider">CODE: {challenge.challenge_code}</span>
                          <p className="text-[10px] text-zinc-500 leading-normal line-clamp-2 mt-1">
                            {challenge.description}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/5 font-mono text-[9px] text-zinc-400">
                          <div>
                            <span className="text-[8px] text-zinc-650 uppercase block font-bold">Target</span>
                            <span className="font-extrabold text-white truncate block">
                              {challenge.goalTarget.toLocaleString()} {challenge.goalType === "Distance" ? "km" : challenge.goalType === "Elevation" ? "m" : "hrs"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-650 uppercase block font-bold">Duration</span>
                            <span className="truncate block">
                              {challenge.startDate.split("-")[1]}/{challenge.startDate.split("-")[2]}—{challenge.endDate.split("-")[1]}/{challenge.endDate.split("-")[2]}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-650 uppercase block font-bold">Enrolled</span>
                            <span className="font-extrabold text-white block">
                              {challenge.participantsCount ?? 0} joined
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="sm:col-span-2 py-8 text-center text-zinc-550 text-xs font-mono border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <Award className="h-6 w-6 text-zinc-700" />
                    <span>No {activeTab} challenges configured.</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Global Recent Athlete Activities Feed */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4 backdrop-blur-md">
              <h3 className="font-extrabold uppercase tracking-wider text-xs text-white border-b border-white/5 pb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-lime-400" /> Recent Community Activity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {recentFeed.length > 0 ? (
                  recentFeed.map((item) => {
                    const matchedAthlete = allAthletes.find(a => a.id === item.participantId);
                    return (
                      <div
                        key={item.id}
                        onClick={() => matchedAthlete && setSelectedAthlete(matchedAthlete)}
                        className="bg-zinc-950 border border-white/5 hover:border-lime-400/20 p-3.5 rounded-2xl flex items-center justify-between text-xs cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.avatar} alt={item.name} className="h-6.5 w-6.5 rounded-full object-cover shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="font-extrabold text-[11px] text-white truncate group-hover:text-lime-400 transition-colors">
                              {item.name}
                            </p>
                            <p className="text-[9px] text-zinc-500 truncate m-0 font-medium leading-none mt-0.5">
                              {item.action}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2 font-mono">
                          <span className="font-black text-[10px] text-zinc-350 block">{item.displayValue}</span>
                          <span className="text-[8px] text-zinc-600 block">{item.time}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="sm:col-span-2 py-6 text-center text-zinc-550 font-mono text-[10px] border border-dashed border-white/5 rounded-xl">
                    No community activity logged.
                  </div>
                )}
              </div>
            </div>

            {/* 5. Challenge Performance Insights */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4 backdrop-blur-md text-left">
              <h3 className="font-extrabold uppercase tracking-wider text-xs text-white border-b border-white/5 pb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-lime-400" /> Challenge Performance Insights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                  <span className="text-[8px] text-zinc-500 uppercase block font-bold font-mono">Top Challenge</span>
                  <span className="text-xs sm:text-sm font-black text-lime-400 truncate block mt-0.5">{insights.popular}</span>
                  <span className="text-[8.5px] font-mono text-zinc-550 block mt-1">Most athlete registrations</span>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                  <span className="text-[8px] text-zinc-500 uppercase block font-bold font-mono">Avg Completion</span>
                  <span className="text-sm sm:text-base font-black text-white font-mono block mt-0.5">{insights.highestRate}</span>
                  <span className="text-[8.5px] font-mono text-zinc-555 block mt-1">Completed target metric</span>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                  <span className="text-[8px] text-zinc-500 uppercase block font-bold font-mono">Total Activities</span>
                  <span className="text-sm sm:text-base font-black text-white font-mono block mt-0.5">{initialMetrics.syncedActivities} logs</span>
                  <span className="text-[8.5px] font-mono text-zinc-555 block mt-1">Parsed and updated live</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Quick Actions & Create Challenge Form */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4 backdrop-blur-md text-left">
              <h3 className="font-extrabold uppercase tracking-wider text-xs text-white border-b border-white/5 pb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-lime-400" /> Admin Quick Actions
              </h3>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleSyncAll}
                  disabled={loadingSync}
                  className="w-full h-11 bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-lime-400/20 text-lime-400 hover:text-lime-300 font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                >
                  {loadingSync ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-lime-400" /> Syncing community...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" /> Sync All Athlete Data
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => createFormRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full h-11 bg-lime-400 hover:bg-lime-300 text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Create New Challenge
                </Button>
              </div>
            </div>

            {/* Create Challenge Form */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 sm:p-6 space-y-5 backdrop-blur-md">
              <h3 className="font-extrabold uppercase tracking-wider text-xs text-white border-b border-white/5 pb-4 flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-lime-400" /> Configure Challenge
              </h3>

              <form onSubmit={handleCreateChallenge} ref={createFormRef} className="space-y-4 text-left">
                
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Challenge Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Summer Trail Run 🏃" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 bg-zinc-950/70 border border-white/5 rounded-xl px-3.5 text-xs text-white outline-none focus:border-lime-450/40 focus:ring-1 focus:ring-lime-450/30 transition-all placeholder:text-zinc-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Description *</label>
                  <textarea 
                    placeholder="Summarize the rules and goals..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-950/70 border border-white/5 rounded-xl p-3.5 text-xs text-white outline-none focus:border-lime-450/40 focus:ring-1 focus:ring-lime-450/30 transition-all placeholder:text-zinc-600 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Sport Type</label>
                    <select 
                      value={sportType} 
                      onChange={(e) => setSportType(e.target.value)}
                      className="w-full h-11 bg-zinc-950 border border-white/5 rounded-xl px-3.5 text-xs text-zinc-350 outline-none focus:border-lime-450/30 transition-all"
                    >
                      <option value="Ride">Ride</option>
                      <option value="Run">Run</option>
                      <option value="Walk">Walk</option>
                      <option value="Multisport">Multisport</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Goal Type</label>
                    <select 
                      value={goalType} 
                      onChange={(e) => setGoalType(e.target.value)}
                      className="w-full h-11 bg-zinc-950 border border-white/5 rounded-xl px-3.5 text-xs text-zinc-350 outline-none focus:border-lime-450/30 transition-all"
                    >
                      <option value="Distance">Distance</option>
                      <option value="Elevation">Elevation</option>
                      <option value="Duration">Duration</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Goal Target ({goalType === "Distance" ? "km" : goalType === "Elevation" ? "meters" : "hours"}) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 100" 
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    min="1"
                    className="w-full h-11 bg-zinc-950/70 border border-white/5 rounded-xl px-3.5 text-xs text-white outline-none focus:border-lime-450/40 focus:ring-1 focus:ring-lime-450/30 transition-all placeholder:text-zinc-600"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Start Date *</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-11 bg-zinc-950 border border-white/5 rounded-xl px-3 text-xs text-zinc-350 outline-none focus:border-lime-450/40 transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">End Date *</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-11 bg-zinc-950 border border-white/5 rounded-xl px-3 text-xs text-zinc-350 outline-none focus:border-lime-450/40 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Banner Image URL (Optional)</label>
                  <input 
                    type="url" 
                    placeholder="https://unsplash.com/..." 
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full h-11 bg-zinc-950/70 border border-white/5 rounded-xl px-3.5 text-xs text-white outline-none focus:border-lime-450/40 focus:ring-1 focus:ring-lime-450/30 transition-all placeholder:text-zinc-600"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loadingCreate}
                  className="w-full h-12 bg-lime-400 hover:bg-lime-300 text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider shadow-lg shadow-lime-400/10 cursor-pointer mt-2"
                >
                  {loadingCreate ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" /> Configuring...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4.5 w-4.5" /> Configure Event
                    </>
                  )}
                </Button>

              </form>
            </div>

          </div>

        </div>

      </main>

      {/* Admin Panel Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-[10px] text-zinc-650 bg-zinc-950 mb-16 md:mb-0">
        <span>© 2026 KYL Arena. Built by Know Your Limits Community.</span>
      </footer>

      {/* INTERACTIVE ATHLETE AUDIT INSPECTOR DRAWER */}
      <AnimatePresence>
        {selectedAthlete && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAthlete(null)}
              className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm"
            />

            {/* Sliding Drawer container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 150 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-zinc-950 border-l border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col justify-between"
            >
              {/* Drawer Scroll Container */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 text-left">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5 text-lime-400" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Athlete Audit Profile</span>
                  </div>
                  <button 
                    onClick={() => setSelectedAthlete(null)}
                    className="h-8 w-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Profile Hero section */}
                <div className="flex items-center gap-4.5 bg-zinc-900/25 border border-white/5 p-5 rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={selectedAthlete.avatar} 
                    alt={selectedAthlete.name} 
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-lime-400/40 shrink-0" 
                  />
                  <div className="space-y-1 text-left min-w-0">
                    <h4 className="font-extrabold text-base uppercase text-white truncate">
                      {selectedAthlete.name}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-550 truncate">
                      {selectedAthlete.email}
                    </p>
                    <p className="text-[8.5px] font-mono font-black text-lime-400 uppercase border border-lime-400/20 px-2 py-0.5 rounded bg-lime-400/5 w-fit">
                      ID: {selectedAthlete.athleteId || "NOT LINKED"}
                    </p>
                  </div>
                </div>

                {/* Strava metadata info */}
                <div className="space-y-2.5">
                  <h5 className="text-[9px] uppercase font-black text-zinc-550 tracking-wider">Strava Connection Details</h5>
                  <div className="bg-zinc-900/25 border border-white/5 p-4 rounded-xl font-mono text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Strava Name:</span>
                      <span className="text-white font-bold">{selectedAthlete.stravaAthleteName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Strava Username:</span>
                      <span className="text-white font-bold">{selectedAthlete.stravaAthleteUsername || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Join Date:</span>
                      <span className="text-white">{selectedAthlete.joinedAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Sync Status:</span>
                      <span className={`font-black uppercase ${selectedAthlete.stravaConnected ? "text-lime-400" : "text-zinc-550"}`}>
                        {selectedAthlete.stravaConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Metrics */}
                <div className="space-y-2.5">
                  <h5 className="text-[9px] uppercase font-black text-zinc-550 tracking-wider">Auditable Sync Statistics</h5>
                  <div className="grid grid-cols-2 gap-3.5">
                    
                    <div className="bg-zinc-900/25 border border-white/5 p-4 rounded-xl space-y-1">
                      <span className="text-[8px] text-zinc-650 uppercase block font-bold font-mono">Distance in Challenges</span>
                      <span className="text-sm sm:text-base font-black text-white font-mono">
                        {selectedAthlete.challengeDistance.toLocaleString()} km
                      </span>
                    </div>

                    <div className="bg-zinc-900/25 border border-white/5 p-4 rounded-xl space-y-1">
                      <span className="text-[8px] text-zinc-650 uppercase block font-bold font-mono">Synced logs count</span>
                      <span className="text-sm sm:text-base font-black text-white font-mono">
                        {selectedAthlete.recentActivities.length} logs
                      </span>
                    </div>

                  </div>
                </div>

                {/* Recent Strava Activities lists */}
                <div className="space-y-2.5">
                  <h5 className="text-[9px] uppercase font-black text-zinc-550 tracking-wider">Recent Synced Activities</h5>
                  <div className="space-y-2">
                    {selectedAthlete.recentActivities.length > 0 ? (
                      selectedAthlete.recentActivities.map((act) => (
                        <div 
                          key={act.id}
                          className="bg-zinc-900/20 border border-white/5 rounded-xl p-3.5 flex justify-between items-center text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-zinc-950 border border-white/5 text-lime-400">
                              {act.sportType === "Ride" ? <Bike className="h-4 w-4" /> : <Footprints className="h-4 w-4" />}
                            </div>
                            <div className="text-left">
                              <p className="font-extrabold text-white text-[11px] leading-tight">{act.name}</p>
                              <p className="text-[8px] text-zinc-600 font-mono mt-0.5 leading-none">{act.startDate}</p>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <p className="font-black text-white text-[11px] leading-none">{act.distance} km</p>
                            <p className="text-[8px] text-zinc-600 mt-1 leading-none">{formatTime(act.movingTime)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-zinc-600 font-mono text-[10px] border border-dashed border-white/5 rounded-xl">
                        No individual workout sessions logged.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Drawer bottom Close action */}
              <div className="border-t border-white/5 p-6 bg-zinc-950/80 backdrop-blur-md">
                <Button
                  onClick={() => setSelectedAthlete(null)}
                  className="w-full h-11 border border-zinc-850 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 text-white font-extrabold rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center"
                >
                  Close Profile Audit
                </Button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
