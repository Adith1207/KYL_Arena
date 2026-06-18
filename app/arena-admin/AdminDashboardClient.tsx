"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, Activity, Trophy, Flame, Plus, ArrowLeft,
  CheckCircle, Target, LogOut, Loader2,
  TrendingUp, Award, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

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
  participantsCount?: number;
}

interface MetricData {
  totalMembers: number;
  activeAthletes: number;
  activeChallenges: number;
  syncedActivities: number;
}

interface AdminDashboardClientProps {
  profile: ProfileData;
  userRole: string;
  initialChallenges: Challenge[];
  initialMetrics: MetricData;
}

export default function AdminDashboardClient({ 
  profile, 
  userRole, 
  initialChallenges, 
  initialMetrics 
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
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

  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);

  useEffect(() => {
    setChallenges(initialChallenges);
  }, [initialChallenges]);

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

    const todayStr = "2026-06-18"; // Current mock time context
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

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("challenges")
        .insert({
          title,
          description,
          sport_type: sportType,
          goal_metric: goalType,
          goal_target: Number(goalTarget),
          start_date: startDate,
          end_date: endDate,
          banner_url: defaultBanner,
          status: determinedStatus,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) {
        alert(`Failed to create challenge: ${error.message}`);
        return;
      }

      setSuccessMessage(`"${title}" has been successfully added to the database!`);
      
      // Reset form
      setTitle("");
      setDescription("");
      setGoalTarget("");
      setStartDate("");
      setEndDate("");
      setBannerUrl("");

      // Refresh serverside state
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

  // Get initials for avatar fallback
  const getInitials = (fullName: string) => {
    if (!fullName) return "A";
    const parts = fullName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const filteredChallenges = challenges.filter(c => c.status === activeTab);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-lime-400 selection:text-black overflow-hidden flex flex-col justify-between font-sans">
      
      {/* Premium Background Grid & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 translate-x-1/2 w-[550px] h-[550px] bg-lime-500/5 rounded-full blur-[130px] pointer-events-none animate-pulse duration-[10000ms]" />
      <div className="absolute bottom-10 left-1/4 -translate-x-1/2 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[110px] pointer-events-none animate-pulse duration-[8000ms]" />

      {/* Admin Top Navigation */}
      <nav className="relative z-20 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md">
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

            <div className="flex items-center gap-3">
              {/* User avatar/role info */}
              <div className="flex items-center gap-2.5 bg-zinc-900/40 border border-lime-400/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <div className="text-right">
                  <p className="text-[10px] font-black text-white uppercase italic leading-none">{profile.name.split(" ")[0]}</p>
                  <p className="text-[8px] text-lime-400 font-mono mt-0.5 leading-none">{userRole.replace("_", " ").toUpperCase()}</p>
                </div>
                {profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar} alt={profile.name} className="h-6 w-6 rounded-full object-cover ring-1 ring-lime-400/30" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-zinc-800 text-[9px] font-black flex items-center justify-center text-lime-400">{getInitials(profile.name)}</div>
                )}
              </div>

              {/* Dashboard Switcher Button (Only for super_admin and challenge_admin) */}
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
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28 md:pb-12 text-left">
        
        {/* Banner/Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic">
              KYL Arena <span className="text-lime-400 not-italic">Control Center</span>
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              Initialize new events, moderate participant ranks, and analyze KYL community metrics.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-lime-400/20 bg-lime-400/5 text-lime-400 text-[10px] uppercase font-bold tracking-wider select-none">
            <Target className="h-3.5 w-3.5 animate-pulse" /> Mock Operations Active
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
                <span className="font-medium text-zinc-350">{successMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Community Overview (Metrics Cards Row) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-lime-400/25 transition-all">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Total Members</p>
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
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Active Athletes</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-white">{initialMetrics.activeAthletes}</p>
              </div>
              <div className="p-2 rounded-lg bg-lime-400/5 text-lime-400 border border-lime-400/10">
                <Activity className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="text-[9px] text-zinc-400 font-mono mt-3">
              {initialMetrics.totalMembers > 0 ? ((initialMetrics.activeAthletes / initialMetrics.totalMembers) * 100).toFixed(1) : 0}% community connection rate
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-lime-400/25 transition-all">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Active Challenges</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-white">{initialMetrics.activeChallenges}</p>
              </div>
              <div className="p-2 rounded-lg bg-lime-400/5 text-lime-400 border border-lime-400/10">
                <Trophy className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="text-[9px] text-zinc-400 font-mono mt-3">
              Events active right now
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-lime-400/25 transition-all">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Synced Activities</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-white">{initialMetrics.syncedActivities}</p>
              </div>
              <div className="p-2 rounded-lg bg-lime-400/5 text-lime-400 border border-lime-400/10">
                <Flame className="h-4.5 w-4.5 animate-pulse" />
              </div>
            </div>
            <p className="text-[9px] text-lime-400 font-mono mt-3">
              Total logs processed
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
                          ? "bg-lime-400 text-black" 
                          : "text-zinc-500 hover:text-white"
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
                      href={`/arena-admin/challenges/${challenge.id}`}
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
                          <p className="text-[10px] text-zinc-500 leading-normal line-clamp-2">
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
                  <div className="sm:col-span-2 py-8 text-center text-zinc-555 text-xs font-mono border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <Award className="h-6 w-6 text-zinc-700" />
                    <span>No {activeTab} challenges configured.</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Community Analytics */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 sm:p-6 space-y-6 backdrop-blur-md text-left">
              <h3 className="font-extrabold uppercase tracking-wider text-xs text-white border-b border-white/5 pb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-lime-400" /> Community Analytics (V1 Mock)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[8px] text-zinc-500 uppercase block font-bold">Total Distance</span>
                  <span className="text-sm sm:text-base font-black text-white font-mono">12,450 km</span>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-lime-400 w-3/4 rounded-full" />
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[8px] text-zinc-500 uppercase block font-bold">Most Active Athlete</span>
                  <span className="text-xs sm:text-sm font-black text-lime-400 truncate block">Adith Google</span>
                  <span className="text-[8.5px] font-mono text-zinc-500 block">14 sessions / month</span>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[8px] text-zinc-500 uppercase block font-bold">Popular Challenge</span>
                  <span className="text-xs sm:text-sm font-black text-white truncate block">Summer Century</span>
                  <span className="text-[8.5px] font-mono text-zinc-500 block">114 enrolled athletes</span>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[8px] text-zinc-500 uppercase block font-bold">Completion Rate</span>
                  <span className="text-sm sm:text-base font-black text-white font-mono">76%</span>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-emerald-400 w-[76%] rounded-full" />
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT: Create Challenge Form */}
          <div className="lg:col-span-4 bg-zinc-900/30 border border-white/5 rounded-3xl p-5 sm:p-6 space-y-5 backdrop-blur-md">
            <h3 className="font-extrabold uppercase tracking-wider text-xs text-white border-b border-white/5 pb-4 flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-lime-400" /> Create Challenge
            </h3>

            <form onSubmit={handleCreateChallenge} className="space-y-4 text-left">
              
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
                    className="w-full h-11 bg-zinc-950 border border-white/5 rounded-xl px-3.5 text-xs text-zinc-300 outline-none focus:border-lime-400/30 transition-all"
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
                    className="w-full h-11 bg-zinc-950 border border-white/5 rounded-xl px-3.5 text-xs text-zinc-300 outline-none focus:border-lime-400/30 transition-all"
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
                    className="w-full h-11 bg-zinc-950 border border-white/5 rounded-xl px-3 text-xs text-zinc-300 outline-none focus:border-lime-450/40 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">End Date *</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-11 bg-zinc-950 border border-white/5 rounded-xl px-3 text-xs text-zinc-300 outline-none focus:border-lime-450/40 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 font-sans">
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

      </main>

      {/* Admin Panel Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-[10px] text-zinc-650 bg-zinc-950 mb-16 md:mb-0">
        <span>© 2026 KYL Arena. Built by Know Your Limits Community.</span>
      </footer>

      {/* FLOATING STATE SIMULATOR PANEL (Mock Developer Controls for Admin View) */}
      <div className="fixed bottom-6 right-6 z-50 bg-zinc-900/90 border border-white/10 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col items-center gap-2 max-w-[200px]">
        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">State Simulator</span>
        
        {/* Mock Role Selector */}
        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider mt-1 pt-1 border-t border-white/5 w-full text-center">Mock Role</span>
        <div className="grid grid-cols-2 gap-1 w-full">
          {(["athlete", "challenge_admin", "organization_admin", "super_admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                localStorage.setItem("kyl_mock_role", r);
                document.cookie = `kyl-mock-role=${r}; path=/; max-age=3600; SameSite=Lax`;
                if (r === "athlete") {
                  window.location.href = "/dashboard";
                } else if (r === "organization_admin" && window.location.pathname === "/dashboard") {
                  window.location.href = "/arena-admin";
                } else {
                  window.location.reload();
                }
              }}
              className={`h-6 px-1 text-[8.5px] font-bold rounded flex items-center justify-center transition-all cursor-pointer truncate ${
                userRole === r
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

    </div>
  );
}
