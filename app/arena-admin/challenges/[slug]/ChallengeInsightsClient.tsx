"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageLoader } from "@/components/PageLoader";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Users, Activity, Settings, X, Search, ArrowRight,
  FileText, LayoutDashboard, Calendar, Target, Award,
  Menu, Play, Pause, CheckCircle, Flag, ArrowLeft, Download,
  MoreVertical, Trash2, Edit, ChevronDown, BarChart3, LineChart, PieChart, ShieldAlert
} from "lucide-react";

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
  status: "active" | "upcoming" | "archived" | "draft";
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
  completionPercentage: number;
}

interface ChallengeInsightsClientProps {
  profile: ProfileData;
  userRole: string;
  challenge: Challenge;
  initialParticipants: Participant[];
  recentFeed: any[];
}

export default function ChallengeInsightsClient({ profile, userRole, challenge, initialParticipants, recentFeed }: ChallengeInsightsClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const participants: ParticipantWithProgress[] = useMemo(() => {
    return initialParticipants.map(p => {
      let progress = 0;
      if (challenge.goalType === "Distance") {
        progress = p.distanceCompleted;
      } else if (challenge.goalType === "Elevation") {
        progress = p.elevationGain;
      } else if (challenge.goalType === "Time") {
        progress = p.movingTime / 3600;
      }
      
      const completionPercentage = Math.min(100, (progress / challenge.goalTarget) * 100);
      let status: "completed" | "in-progress" | "inactive" = "in-progress";
      if (completionPercentage >= 100) status = "completed";
      
      // Check if inactive (> 14 days)
      if (p.lastActivityDate) {
        const inactiveDays = (Date.now() - new Date(p.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24);
        if (inactiveDays > 14 && status !== "completed") status = "inactive";
      }

      return {
        ...p,
        progress,
        completionPercentage,
        status
      };
    }).sort((a, b) => b.progress - a.progress);
  }, [initialParticipants, challenge]);

  const communityStats = useMemo(() => {
    const totalDistance = participants.reduce((sum, p) => sum + p.distanceCompleted, 0);
    const totalElevation = participants.reduce((sum, p) => sum + p.elevationGain, 0);
    const totalActivities = participants.reduce((sum, p) => sum + p.activitiesCount, 0);
    const avgCompletion = participants.length > 0 
      ? participants.reduce((sum, p) => sum + p.completionPercentage, 0) / participants.length 
      : 0;
    
    return {
      totalDistance,
      totalElevation,
      totalActivities,
      avgCompletion,
      topPerformer: participants.length > 0 ? participants[0] : null
    };
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    if (!searchQuery) return participants;
    const q = searchQuery.toLowerCase();
    return participants.filter(p => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }, [participants, searchQuery]);

  const exportCSV = () => {
    const headers = "Name,Email,Join Date,Distance (km),Elevation (m),Activities,Completion (%)\n";
    const rows = participants.map(p => 
      `"${p.name.replace(/"/g, '""')}","${p.email}",${p.joinDate},${p.distanceCompleted},${p.elevationGain},${p.activitiesCount},${p.completionPercentage.toFixed(1)}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `challenge_${challenge.challenge_code}_participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("CSV Exported", "success", "The participant report has been downloaded.");
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Target },
    { id: "participants", label: "Participants", icon: Users },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans flex flex-col">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 h-16 flex items-center px-6 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl shrink-0 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/arena-admin/challenges" className="h-8 w-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              {challenge.title}
              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-black bg-lime-500/20 text-lime-400 border border-lime-500/30">
                {challenge.status}
              </span>
            </h1>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
              {challenge.challenge_code || 'CHALLENGE DETAILS'}
            </span>
          </div>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <div className="border-b border-white/5 bg-[#09090b] px-6">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`h-14 flex items-center gap-2 border-b-2 px-1 text-sm font-medium transition-colors ${
                activeTab === t.id ? "border-lime-500 text-lime-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Banner Section */}
            <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
              {challenge.bannerUrl ? (
                <img src={challenge.bannerUrl} alt={challenge.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">{challenge.title}</h2>
                  <p className="text-zinc-400 max-w-2xl text-sm leading-relaxed">{challenge.description || "No description provided."}</p>
                </div>
                <div className="shrink-0 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 flex gap-6">
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Target</span>
                    <span className="text-xl font-black text-white">{challenge.goalTarget} <span className="text-sm font-normal text-zinc-400">{challenge.goalType === 'Distance' ? 'km' : ''}</span></span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Sport</span>
                    <span className="text-xl font-black text-white">{challenge.sportType}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-lime-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                <Users className="h-5 w-5 text-lime-400 mb-4" />
                <h3 className="text-3xl font-black text-white mb-1">{participants.length}</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total Enrolled</p>
              </div>
              
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                <Target className="h-5 w-5 text-blue-400 mb-4" />
                <h3 className="text-3xl font-black text-white mb-1">{communityStats.avgCompletion.toFixed(1)}%</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Avg Completion</p>
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                <Activity className="h-5 w-5 text-emerald-400 mb-4" />
                <h3 className="text-3xl font-black text-white mb-1">{communityStats.totalDistance.toFixed(0)} <span className="text-lg">km</span></h3>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Community Distance</p>
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
                <Award className="h-5 w-5 text-purple-400 mb-4" />
                <h3 className="text-xl font-black text-white mb-1 truncate">{communityStats.topPerformer?.name || "None"}</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Top Performer</p>
              </div>
            </div>

            {/* Dates & Rules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  Timeline
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-black border border-white/10 flex items-center justify-center shrink-0">
                      <Play className="h-4 w-4 text-lime-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Challenge Starts</h4>
                      <p className="text-xs text-zinc-400">{new Date(challenge.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                    </div>
                  </div>
                  <div className="ml-5 border-l-2 border-dashed border-white/10 h-8 -my-2" />
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-black border border-white/10 flex items-center justify-center shrink-0">
                      <Flag className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Challenge Ends</h4>
                      <p className="text-xs text-zinc-400">{new Date(challenge.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PARTICIPANTS TAB */}
        {activeTab === "participants" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search participants by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-500/50 transition-all"
                />
              </div>
              <button 
                onClick={exportCSV}
                className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 shrink-0"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-black/20">
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Athlete</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Progress</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Activities</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Last Sync</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredParticipants.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                              {p.avatar ? (
                                <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-zinc-500 bg-zinc-800">
                                  {p.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white group-hover:text-lime-400 transition-colors">{p.name}</p>
                              <p className="text-[10px] text-zinc-500">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {p.status === "completed" && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"><CheckCircle className="h-3 w-3" /> Completed</span>}
                          {p.status === "in-progress" && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/20"><Activity className="h-3 w-3" /> Active</span>}
                          {p.status === "inactive" && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/20"><ShieldAlert className="h-3 w-3" /> Inactive</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold text-white">{p.progress.toFixed(1)} <span className="text-[10px] text-zinc-500 font-normal">{challenge.goalType === 'Distance' ? 'km' : ''}</span></span>
                            <span className="text-[10px] text-zinc-500">{p.completionPercentage.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-zinc-300">{p.activitiesCount}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs text-zinc-400">{p.lastActivityDate ? new Date(p.lastActivityDate).toLocaleDateString() : 'Never'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredParticipants.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-500">
                          No participants found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === "leaderboard" && (
          <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden p-2">
              {participants.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/[0.02] transition-colors group">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full shrink-0 font-black text-sm
                    ${idx === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" : 
                      idx === 1 ? "bg-zinc-400/20 text-zinc-300 border border-zinc-400/30" : 
                      idx === 2 ? "bg-amber-700/20 text-amber-600 border border-amber-700/30" : 
                      "bg-black text-zinc-600 font-medium"}
                  `}>
                    {idx + 1}
                  </div>
                  
                  <div className="h-10 w-10 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-white/10">
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-bold text-zinc-500">{p.name.charAt(0)}</div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 flex-1 bg-black/40 rounded-full overflow-hidden max-w-[200px]">
                        <div 
                          className={`h-full rounded-full ${idx === 0 ? 'bg-yellow-500' : 'bg-lime-500'}`}
                          style={{ width: `${p.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-white leading-none">{p.progress.toFixed(1)} <span className="text-[10px] text-zinc-500 font-bold uppercase">{challenge.goalType === 'Distance' ? 'km' : ''}</span></div>
                  </div>
                </div>
              ))}
              {participants.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <Trophy className="h-8 w-8 text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-sm">Leaderboard is empty. Waiting for participants to sync activities.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 min-h-[300px] flex flex-col items-center justify-center">
                <LineChart className="h-8 w-8 text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-sm">Daily Completion Graph (Rendering Engine Requires Recharts)</p>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 min-h-[300px] flex flex-col items-center justify-center">
                <PieChart className="h-8 w-8 text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-sm">Sport Distribution (Rendering Engine Requires Recharts)</p>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="max-w-3xl space-y-6 animate-in fade-in duration-500">
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 md:p-8 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Challenge Configuration</h3>
                <p className="text-sm text-zinc-400">Update the primary details for this challenge. Note that changing the goal metric while a challenge is active will recalculate progress for all participants.</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Challenge Name</label>
                    <input type="text" defaultValue={challenge.title} className="w-full h-10 bg-black border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-lime-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Challenge Code (Slug)</label>
                    <input type="text" defaultValue={challenge.challenge_code} disabled className="w-full h-10 bg-black/50 border border-white/5 rounded-lg px-3 text-sm text-zinc-500 cursor-not-allowed" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea defaultValue={challenge.description} className="w-full h-24 bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-lime-500/50 resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Start Date</label>
                    <input type="date" defaultValue={challenge.startDate} className="w-full h-10 bg-black border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-lime-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">End Date</label>
                    <input type="date" defaultValue={challenge.endDate} className="w-full h-10 bg-black border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-lime-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target</label>
                    <input type="number" defaultValue={challenge.goalTarget} className="w-full h-10 bg-black border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-lime-500/50" />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button className="px-4 h-10 rounded-lg text-sm font-medium text-white bg-lime-500 hover:bg-lime-400 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>

            <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-400/70">Destructive actions cannot be undone. Archiving a challenge preserves data, deleting it wipes all participant progress.</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 h-10 rounded-lg text-sm font-medium text-zinc-300 bg-zinc-900 border border-white/10 hover:bg-white/5 transition-colors">
                  Archive Challenge
                </button>
                <button className="px-4 h-10 rounded-lg text-sm font-medium text-red-400 bg-red-950/50 border border-red-900/50 hover:bg-red-900/80 transition-colors">
                  Delete Challenge
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
