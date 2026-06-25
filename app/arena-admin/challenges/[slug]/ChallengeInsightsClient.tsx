"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Users, Activity, Trophy, Flame, ArrowLeft, CheckCircle, 
  LogOut, Loader2, Search, Bike, Footprints, 
  Shield, X, Calendar, Sparkles
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
  challenge_code: string;
}

interface MockActivity {
  id: string;
  name: string;
  sportType: string;
  distance: number;
  movingTime: number;
  elevationGain: number;
  startDate: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar: string;
  athleteId: string;
  stravaAthleteName: string;
  stravaAthleteUsername: string;
  joinDate: string;
  distanceCompleted: number;
  activitiesCount: number;
  lastActivityDate: string;
  movingTime: number;
  elevationGain: number;
  recentActivities: MockActivity[];
}

interface ParticipantWithProgress extends Participant {
  progress: number;
  status: "completed" | "in-progress" | "inactive";
}

interface FeedItem {
  id: string;
  name: string;
  action: string;
  sportType: string;
  displayValue: string;
  time: string;
  participantId: string;
}

interface ChallengeInsightsClientProps {
  profile: ProfileData;
  userRole: string;
  challenge: Challenge;
  initialParticipants: Participant[];
  recentFeed: FeedItem[];
}

export default function ChallengeInsightsClient({ profile, userRole, challenge, initialParticipants, recentFeed }: ChallengeInsightsClientProps) {
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithProgress | null>(null);

  // Formatting helper: seconds to hours and minutes
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const baseParticipants = initialParticipants;
  const unit = challenge.goalType === "Distance" ? "km" : challenge.goalType === "Elevation" ? "m" : "hrs";

  // Calculate dynamic progress & active standing lists based on the challenge goal target
  const participants = useMemo(() => {
    return baseParticipants.map((p) => {
      const progress = Math.min(100, Math.round((p.distanceCompleted / challenge.goalTarget) * 100));
      const status = progress >= 100 ? "completed" : (progress > 0 ? "in-progress" : "inactive");
      return {
        ...p,
        progress,
        status: status as "completed" | "in-progress" | "inactive"
      };
    }).sort((a, b) => b.distanceCompleted - a.distanceCompleted);
  }, [baseParticipants, challenge.goalTarget]);

  // General counts
  const totalCount = participants.length;
  const completedCount = participants.filter((p) => p.status === "completed").length;
  const inProgressCount = participants.filter((p) => p.status === "in-progress").length;
  const inactiveCount = participants.filter((p) => p.status === "inactive").length;

  // Real stats calculation
  const totalDistanceAccumulated = useMemo(() => {
    return baseParticipants.reduce((sum, p) => sum + p.distanceCompleted, 0);
  }, [baseParticipants]);

  // Filter participants by search query matching: name, email, strava athlete name, or username
  const filteredParticipants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return participants;
    return participants.filter((p) => 
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.athleteId.toLowerCase().includes(q) ||
      (p.stravaAthleteName && p.stravaAthleteName.toLowerCase().includes(q)) ||
      (p.stravaAthleteUsername && p.stravaAthleteUsername.toLowerCase().includes(q))
    );
  }, [searchQuery, participants]);

  // Standard sign out handler
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

  const getInitials = (fullName: string) => {
    if (!fullName) return "A";
    const parts = fullName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-lime-400 selection:text-black overflow-hidden flex flex-col justify-between font-sans">
      
      {/* Background Grids & Ambient Lighting */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-lime-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-10 right-1/4 translate-x-1/2 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[110px] pointer-events-none animate-pulse duration-[10000ms]" />

      {/* Cyberpunk Top Bar */}
      <nav className="relative z-20 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/arena-admin" className="flex items-center gap-3 group">
              <svg className="h-7 w-7 transition-transform duration-500 group-hover:rotate-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            </Link>

            <div className="flex items-center gap-3">
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

              <Button
                asChild
                className="h-9 px-3.5 border border-lime-400/25 hover:border-lime-400 bg-lime-400/5 hover:bg-lime-400/10 text-lime-400 font-extrabold rounded-xl transition-all flex items-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer"
              >
                <Link href="/arena-admin">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Control Center
                </Link>
              </Button>

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
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/arena-admin" className="text-zinc-550 hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Challenges
          </Link>
          <span className="text-zinc-750 text-xs">/</span>
          <span className="text-lime-450 text-[10px] font-black uppercase tracking-wider">{challenge.title}</span>
        </div>

        {/* Challenge Insights Header Banner */}
        <div className="relative rounded-3xl bg-zinc-900/30 border border-white/5 overflow-hidden p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/25 to-transparent" />
          
          <div className="space-y-2 max-w-2xl text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-lime-400/20 bg-lime-400/5 rounded-full text-[9px] font-black uppercase tracking-widest text-lime-400">
              <Trophy className="h-3 w-3 animate-bounce text-lime-400" /> {challenge.sportType} Challenge
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic leading-tight">
              {challenge.title} <span className="text-lime-400 not-italic font-normal">Standings</span>
            </h2>
            <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase mt-0.5 leading-none">CODE: {challenge.challenge_code}</p>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium mt-2">
              {challenge.description}
            </p>
          </div>

          {/* Goal & Dates target */}
          <div className="flex flex-col sm:flex-row gap-6 p-4 rounded-2xl bg-zinc-950/60 border border-white/5 font-mono text-xs text-zinc-450 self-start md:self-auto min-w-[220px]">
            <div>
              <span className="text-[8px] text-zinc-650 uppercase block font-bold">Goal Target</span>
              <span className="text-base font-black text-white">
                {challenge.goalTarget} {unit}
              </span>
            </div>
            <div className="sm:border-l sm:border-white/5 sm:pl-6">
              <span className="text-[8px] text-zinc-650 uppercase block font-bold">Duration</span>
              <span className="text-sm font-black text-white">{challenge.startDate} — {challenge.endDate}</span>
            </div>
          </div>
        </div>

        {/* 1. Challenge Overview metrics cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slideIn">
          
          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-lime-400/20 transition-all">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Total Enrolled</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-white">{totalCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-lime-400/5 text-lime-400 border border-lime-400/10">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="text-[9px] text-zinc-450 font-mono mt-3">
              Total connected community members
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-lime-400/20 transition-all">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Completion Rate</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-lime-400">{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</p>
              </div>
              <div className="p-2 rounded-lg bg-lime-400/5 text-lime-400 border border-lime-400/10">
                <CheckCircle className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="text-[9px] text-lime-400 font-mono mt-3">
              {completedCount} athletes completed target metric
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-lime-400/20 transition-all">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Accumulated Distance</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-white">{totalDistanceAccumulated.toLocaleString()} {unit}</p>
              </div>
              <div className="p-2 rounded-lg bg-lime-400/5 text-lime-400 border border-lime-400/10">
                <Sparkles className="h-4.5 w-4.5 text-lime-400" />
              </div>
            </div>
            <p className="text-[9px] text-zinc-450 font-mono mt-3">
              Cumulative log stats across participants
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-lime-400/20 transition-all">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/10 to-transparent" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">In Progress</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-white">{inProgressCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-lime-400/5 text-lime-400 border border-lime-400/10">
                <Activity className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="text-[9px] text-zinc-450 font-mono mt-3">
              Athletes logging matching logs
            </p>
          </div>

        </div>

        {/* Table & Leaderboard layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Participant List & Instant Search */}
          <div className="lg:col-span-8 bg-zinc-900/30 border border-white/5 rounded-3xl p-5 sm:p-6 space-y-6 backdrop-blur-md">
            
            {/* Header + Search input */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <h3 className="font-extrabold uppercase tracking-wider text-xs text-white flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-lime-400" /> Participant Standings
              </h3>

              {/* Instant Search box */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-650" />
                <input 
                  type="text" 
                  placeholder="Search name, email, Strava athlete..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8.5 pl-9.5 pr-3.5 bg-zinc-950 border border-white/5 rounded-lg text-xs text-white outline-none focus:border-lime-400/30 transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Participant Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase font-black text-zinc-550 tracking-wider font-mono">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Athlete / Profile</th>
                    <th className="py-3 px-3">Strava Details</th>
                    <th className="py-3 px-3">Joined</th>
                    <th className="py-3 px-3">Completed</th>
                    <th className="py-3 px-3">Progress</th>
                    <th className="py-3 px-3 text-center">Activities</th>
                    <th className="py-3 px-3 text-right">Last Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((p) => {
                      const actualRank = participants.findIndex(item => item.id === p.id) + 1;
                      return (
                        <tr 
                          key={p.id}
                          onClick={() => setSelectedParticipant(p)}
                          className="border-b border-white/5 hover:bg-zinc-900/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3 font-mono font-bold text-zinc-400 group-hover:text-lime-400">
                            #{actualRank}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.avatar} alt={p.name} className="h-7.5 w-7.5 rounded-full object-cover ring-1 ring-white/5" />
                              <div className="text-left">
                                <p className="font-extrabold text-white group-hover:text-lime-400 transition-colors leading-tight">{p.name}</p>
                                <p className="text-[9px] text-zinc-550 font-mono leading-none mt-0.5 truncate max-w-[140px]">{p.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-left leading-tight">
                              <p className="font-semibold text-zinc-300 font-mono text-[10px]">{p.stravaAthleteName || "N/A"}</p>
                              <p className="text-[8.5px] text-zinc-500 font-mono leading-none mt-0.5">@{p.stravaAthleteUsername || "N/A"}</p>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-zinc-400 text-[10px]">
                            {p.joinDate}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            {p.distanceCompleted.toFixed(1)} {unit}
                          </td>
                          <td className="py-3 px-3">
                            <div className="w-24 space-y-1">
                              <span className="font-mono text-[9px] text-zinc-400 font-bold block">{p.progress}%</span>
                              <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                <div 
                                  className={`h-full rounded-full ${p.progress >= 100 ? "bg-lime-400" : "bg-emerald-500"}`} 
                                  style={{ width: `${p.progress}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-zinc-350">
                            {p.activitiesCount}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-zinc-500 text-[10px]">
                            {p.lastActivityDate}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-650 font-mono text-xs border border-dashed border-white/5 rounded-2xl">
                        No matches found for &quot;{searchQuery}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* RIGHT: Leaders Podium & Sync Feed */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Top Performers Podium */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 sm:p-6 space-y-6 backdrop-blur-md text-center">
              <h3 className="font-extrabold uppercase tracking-wider text-xs text-white border-b border-white/5 pb-4 flex items-center gap-2 justify-center">
                <Trophy className="h-4.5 w-4.5 text-lime-400" /> Leaderboard Leaders
              </h3>

              <div className="flex items-end justify-center gap-3 pt-12 pb-2 h-48 select-none">
                
                {/* 2nd Place (Left) */}
                {participants[1] && (
                  <div 
                    onClick={() => setSelectedParticipant(participants[1])}
                    className="flex flex-col items-center justify-end w-24 h-28 rounded-t-2xl border-t border-x border-slate-500/20 bg-slate-500/5 hover:bg-slate-500/10 hover:border-slate-400/40 transition-all cursor-pointer relative group"
                  >
                    <span className="absolute -top-10 text-base">🥈</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={participants[1].avatar} 
                      alt={participants[1].name} 
                      className="absolute -top-5 h-9 w-9 rounded-full object-cover ring-2 ring-slate-400/50 group-hover:scale-105 transition-transform" 
                    />
                    <div className="p-2 text-center w-full min-w-0">
                      <p className="font-black text-[10px] text-zinc-300 truncate leading-none">{participants[1].name.split(" ")[0]}</p>
                      <p className="font-mono text-[9px] text-zinc-550 font-black mt-1 leading-none">{participants[1].distanceCompleted.toFixed(0)} {unit}</p>
                    </div>
                  </div>
                )}

                {/* 1st Place (Center) */}
                {participants[0] && (
                  <div 
                    onClick={() => setSelectedParticipant(participants[0])}
                    className="flex flex-col items-center justify-end w-28 h-36 rounded-t-2xl border-t border-x border-amber-400/30 bg-amber-400/5 hover:bg-amber-400/10 hover:border-amber-400/50 transition-all cursor-pointer relative group shadow-[0_4px_20px_rgba(251,191,36,0.04)]"
                  >
                    <span className="absolute -top-11 text-xl animate-pulse">👑</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={participants[0].avatar} 
                      alt={participants[0].name} 
                      className="absolute -top-6 h-11 w-11 rounded-full object-cover ring-2 ring-amber-400 group-hover:scale-105 transition-transform" 
                    />
                    <div className="p-3.5 text-center w-full min-w-0">
                      <p className="font-black text-[11px] text-white truncate leading-none">{participants[0].name.split(" ")[0]}</p>
                      <p className="font-mono text-[9.5px] text-amber-450 font-black mt-1.5 leading-none">{participants[0].distanceCompleted.toFixed(0)} {unit}</p>
                    </div>
                  </div>
                )}

                {/* 3rd Place (Right) */}
                {participants[2] && (
                  <div 
                    onClick={() => setSelectedParticipant(participants[2])}
                    className="flex flex-col items-center justify-end w-24 h-24 rounded-t-2xl border-t border-x border-amber-700/20 bg-amber-700/5 hover:bg-amber-700/10 hover:border-amber-700/40 transition-all cursor-pointer relative group"
                  >
                    <span className="absolute -top-9 text-base">🥉</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={participants[2].avatar} 
                      alt={participants[2].name} 
                      className="absolute -top-4.5 h-8 w-8 rounded-full object-cover ring-2 ring-amber-700/60 group-hover:scale-105 transition-transform" 
                    />
                    <div className="p-2 text-center w-full min-w-0">
                      <p className="font-black text-[9.5px] text-zinc-400 truncate leading-none">{participants[2].name.split(" ")[0]}</p>
                      <p className="font-mono text-[8.5px] text-zinc-555 font-black mt-1 leading-none">{participants[2].distanceCompleted.toFixed(0)} {unit}</p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Live Sync Feed */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4 backdrop-blur-md text-left">
              <h3 className="font-extrabold uppercase tracking-wider text-xs text-white border-b border-white/5 pb-4">Live Sync Ticker</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {recentFeed.length > 0 ? (
                  recentFeed.map((item) => {
                    const targetParticipant = participants.find(p => p.id === item.participantId);
                    return (
                      <div
                        key={item.id}
                        onClick={() => targetParticipant && setSelectedParticipant(targetParticipant)}
                        className="bg-zinc-950 border border-white/3 hover:border-lime-400/20 p-3 rounded-2xl flex items-center justify-between text-xs cursor-pointer group/feed transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            {targetParticipant ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={targetParticipant.avatar} alt={item.name} className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-zinc-800" />
                            )}
                            <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-lime-400 ring-1 ring-zinc-950 animate-ping" />
                          </div>

                          <div className="text-left min-w-0 max-w-[150px]">
                            <p className="font-extrabold text-[11px] text-white truncate group-hover/feed:text-lime-400 transition-colors">
                              {item.name}
                            </p>
                            <p className="text-[9px] text-zinc-550 truncate m-0 mt-0.5">
                              {item.action}
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="font-black text-[10px] text-zinc-300 block">{item.displayValue}</span>
                          <span className="text-[8.5px] text-zinc-550 block">{item.time}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-zinc-600 font-mono text-[10px] border border-dashed border-white/5 rounded-xl">
                    No recent activities logged in this challenge.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Admin Panel Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-[10px] text-zinc-650 bg-zinc-950 mb-16 md:mb-0">
        <span>© 2026 KYL Arena. Built by Know Your Limits Community.</span>
      </footer>

      {/* PARTICIPANT DETAIL DRAWER */}
      <AnimatePresence>
        {selectedParticipant && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedParticipant(null)}
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
                
                {/* Header: Close button */}
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5 text-lime-400" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-550">Athlete Audit Profile</span>
                  </div>
                  <button 
                    onClick={() => setSelectedParticipant(null)}
                    className="h-8 w-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Profile Hero section */}
                <div className="flex items-center gap-4.5 bg-zinc-900/25 border border-white/5 p-5 rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={selectedParticipant.avatar} 
                    alt={selectedParticipant.name} 
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-lime-400/40 shrink-0" 
                  />
                  <div className="space-y-1 text-left min-w-0">
                    <h4 className="font-extrabold text-base uppercase text-white truncate">
                      {selectedParticipant.name}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-500 truncate">
                      {selectedParticipant.email}
                    </p>
                    <p className="text-[8.5px] font-mono font-black text-lime-400 uppercase border border-lime-400/20 px-2 py-0.5 rounded bg-lime-400/5 w-fit">
                      ID: {selectedParticipant.athleteId}
                    </p>
                  </div>
                </div>

                {/* Strava profile details */}
                <div className="space-y-2.5 font-mono text-xs">
                  <h5 className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">Strava Account Metadata</h5>
                  <div className="bg-zinc-900/25 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Strava Name:</span>
                      <span className="text-white font-bold">{selectedParticipant.stravaAthleteName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Strava Username:</span>
                      <span className="text-white font-bold">@{selectedParticipant.stravaAthleteUsername || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Challenge Join Date:</span>
                      <span className="text-white">{selectedParticipant.joinDate}</span>
                    </div>
                  </div>
                </div>

                {/* Challenge Standing progress indicators */}
                <div className="space-y-2.5">
                  <h5 className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">Challenge Progress</h5>
                  <div className="bg-zinc-900/25 border border-white/5 p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center font-mono">
                      <div>
                        <span className="text-[8px] text-zinc-650 uppercase block font-bold">Goal Target</span>
                        <span className="text-sm font-black text-white">{challenge.goalTarget} {unit}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] text-zinc-650 uppercase block font-bold">Progress</span>
                        <span className="text-sm font-black text-lime-400">{selectedParticipant.progress}%</span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.3)]`} 
                        style={{ width: `${selectedParticipant.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Auditable Sync Metrics details */}
                <div className="space-y-2.5">
                  <h5 className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">Auditable Sync Statistics</h5>
                  <div className="grid grid-cols-2 gap-3.5">
                    
                    <div className="bg-zinc-900/25 border border-white/5 p-4 rounded-xl space-y-1">
                      <span className="text-[8px] text-zinc-650 uppercase block font-bold font-mono">Leaderboard Rank</span>
                      <span className="text-sm sm:text-base font-black text-white font-mono">
                        #{participants.findIndex(item => item.id === selectedParticipant.id) + 1}
                      </span>
                    </div>

                    <div className="bg-zinc-900/25 border border-white/5 p-4 rounded-xl space-y-1">
                      <span className="text-[8px] text-zinc-650 uppercase block font-bold font-mono font-mono">Synced completed</span>
                      <span className="text-sm sm:text-base font-black text-white font-mono">
                        {selectedParticipant.distanceCompleted.toFixed(1)} {unit}
                      </span>
                    </div>

                    <div className="bg-zinc-900/25 border border-white/5 p-4 rounded-xl space-y-1">
                      <span className="text-[8px] text-zinc-650 uppercase block font-bold font-mono font-mono">Activities logs</span>
                      <span className="text-sm sm:text-base font-black text-white font-mono">
                        {selectedParticipant.activitiesCount}
                      </span>
                    </div>

                    <div className="bg-zinc-900/25 border border-white/5 p-4 rounded-xl space-y-1">
                      <span className="text-[8px] text-zinc-650 uppercase block font-bold font-mono font-mono">Moving Duration</span>
                      <span className="text-sm sm:text-base font-black text-white font-mono">
                        {formatTime(selectedParticipant.movingTime)}
                      </span>
                    </div>

                    <div className="bg-zinc-900/25 border border-white/5 p-4 rounded-xl col-span-2 space-y-1">
                      <span className="text-[8px] text-zinc-650 uppercase block font-bold font-mono font-mono">Total Elevation gain</span>
                      <span className="text-sm sm:text-base font-black text-lime-400 font-mono">
                        {selectedParticipant.elevationGain.toLocaleString()} meters
                      </span>
                    </div>

                  </div>
                </div>

                {/* Recent Strava Activities lists */}
                <div className="space-y-2.5">
                  <h5 className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">Recent Synced Activities</h5>
                  <div className="space-y-2">
                    {selectedParticipant.recentActivities.length > 0 ? (
                      selectedParticipant.recentActivities.map((act) => (
                        <div 
                          key={act.id}
                          className="bg-zinc-900/20 border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-zinc-950 border border-white/5 text-lime-400">
                              {act.sportType === "Ride" ? <Bike className="h-4 w-4" /> : <Footprints className="h-4 w-4" />}
                            </div>
                            <div className="text-left">
                              <p className="font-extrabold text-white text-[11px] leading-tight">{act.name}</p>
                              <p className="text-[8.5px] text-zinc-500 font-mono mt-0.5 leading-none">{act.startDate}</p>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <p className="font-black text-white text-[11px] leading-none">{act.distance} km</p>
                            <p className="text-[8.5px] text-zinc-505 mt-1 leading-none">{formatTime(act.movingTime)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-zinc-650 font-mono text-[10px] border border-dashed border-white/5 rounded-xl">
                        No individual workout sessions logged.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Close panel action CTA at drawer bottom */}
              <div className="border-t border-white/5 p-6 bg-zinc-950/80 backdrop-blur-md">
                <Button
                  onClick={() => setSelectedParticipant(null)}
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
