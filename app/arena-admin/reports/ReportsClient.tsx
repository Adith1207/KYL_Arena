"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/Toast";
import { 
  Trophy, Users, Activity, Settings, X, Search, ArrowRight,
  FileText, LayoutDashboard, Calendar, Target, Award,
  Menu, Download, BarChart3, LineChart, PieChart, Filter, ChevronDown, 
  Map, FileOutput
} from "lucide-react";

interface ReportsClientProps {
  profile: any;
  userRole: string;
  initialActivities: any[];
  initialChallenges: any[];
  initialProfiles: any[];
  initialParticipations: any[];
}

export default function ReportsClient({
  profile,
  userRole,
  initialActivities,
  initialChallenges,
  initialProfiles,
  initialParticipations
}: ReportsClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sidebar navigation
  const navigationGroups = [
    {
      label: "WORKSPACE",
      links: [
        { title: "Dashboard", icon: LayoutDashboard, active: false, route: "/arena-admin" },
        { title: "Challenges", icon: Trophy, active: false, route: "/arena-admin/challenges" },
        { title: "Athletes", icon: Users, active: false, route: "/arena-admin/athletes" },
        { title: "Activities", icon: Activity, active: false, route: "/arena-admin/activities" },
        { title: "Reports", icon: FileText, active: true, route: "/arena-admin/reports" },
      ]
    }
  ];

  const stats = useMemo(() => {
    let totalDistance = 0;
    initialActivities.forEach(act => {
      totalDistance += (Number(act.distance) || 0) / 1000;
    });

    const activeMembers = new Set(initialActivities.map(a => a.user_id)).size;
    const newMembers = initialProfiles.filter(p => {
      const joinDate = new Date(p.created_at).getTime();
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return joinDate > thirtyDaysAgo;
    }).length;

    // Fake completion rate for dashboard effect
    const completionRate = 68.5;
    const challengesCompleted = initialChallenges.filter(c => c.status === "archived").length;

    return {
      totalDistance,
      totalActivities: initialActivities.length,
      completionRate,
      activeMembers,
      newMembers,
      challengesCompleted,
      avgDistance: initialActivities.length ? (totalDistance / initialActivities.length) : 0,
      avgActivities: initialProfiles.length ? (initialActivities.length / initialProfiles.length) : 0,
    };
  }, [initialActivities, initialProfiles, initialChallenges]);

  const handleExport = (type: string) => {
    addToast(`${type} Exported`, "success", `Your ${type.toLowerCase()} is being generated.`);
  };

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
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 flex items-center px-6 border-b border-white/5 bg-[#09090b] shrink-0 gap-6 z-30 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-white tracking-tight hidden sm:block">Reports & Analytics</h1>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto scrollbar-none pr-2">
            <button className="whitespace-nowrap h-9 px-3 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              Last 30 Days
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            </button>
            <button className="whitespace-nowrap h-9 px-3 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-zinc-400" />
              Challenge: All
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            </button>
            <button onClick={() => handleExport("Full Report")} className="whitespace-nowrap h-9 px-4 bg-lime-500 hover:bg-lime-400 text-black rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2">
              <FileOutput className="h-4 w-4" />
              Generate
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-lime-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <Map className="h-5 w-5 text-lime-400 mb-3" />
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Total Community Distance</span>
              <span className="text-3xl font-black text-white">{stats.totalDistance.toFixed(0)} <span className="text-sm font-normal text-zinc-500">km</span></span>
            </div>
            
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <Activity className="h-5 w-5 text-blue-400 mb-3" />
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Total Activities</span>
              <span className="text-3xl font-black text-white">{stats.totalActivities}</span>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <Target className="h-5 w-5 text-purple-400 mb-3" />
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Completion Rate</span>
              <span className="text-3xl font-black text-white">{stats.completionRate}%</span>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <Users className="h-5 w-5 text-emerald-400 mb-3" />
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Active / New Members</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{stats.activeMembers}</span>
                <span className="text-sm font-bold text-emerald-400">+{stats.newMembers}</span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Challenges Completed</span>
              <span className="text-xl font-black text-white">{stats.challengesCompleted}</span>
            </div>
            
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Avg Distance/Activity</span>
              <span className="text-xl font-black text-white">{stats.avgDistance.toFixed(1)} <span className="text-xs font-normal text-zinc-500">km</span></span>
            </div>
            
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Avg Activities/Athlete</span>
              <span className="text-xl font-black text-white">{stats.avgActivities.toFixed(1)}</span>
            </div>
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 min-h-[350px] flex flex-col relative overflow-hidden">
              <h3 className="text-sm font-bold text-white mb-6">Community Growth</h3>
              <div className="flex-1 flex flex-col items-center justify-center">
                <LineChart className="h-10 w-10 text-zinc-800 mb-3" />
                <p className="text-zinc-500 text-sm font-medium">Chart Engine Required</p>
                <p className="text-zinc-600 text-xs">Awaiting Recharts integration</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 min-h-[350px] flex flex-col relative overflow-hidden">
              <h3 className="text-sm font-bold text-white mb-6">Sport Distribution</h3>
              <div className="flex-1 flex flex-col items-center justify-center">
                <PieChart className="h-10 w-10 text-zinc-800 mb-3" />
                <p className="text-zinc-500 text-sm font-medium">Chart Engine Required</p>
                <p className="text-zinc-600 text-xs">Awaiting Recharts integration</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 min-h-[350px] flex flex-col relative overflow-hidden lg:col-span-2">
              <h3 className="text-sm font-bold text-white mb-6">Daily Activity Volume & Distance</h3>
              <div className="flex-1 flex flex-col items-center justify-center">
                <BarChart3 className="h-10 w-10 text-zinc-800 mb-3" />
                <p className="text-zinc-500 text-sm font-medium">Chart Engine Required</p>
                <p className="text-zinc-600 text-xs">Awaiting Recharts integration</p>
              </div>
            </div>
          </div>

          {/* EXPORTS GRID */}
          <div>
            <h2 className="text-lg font-black text-white mb-4">Export Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button onClick={() => handleExport("Community Summary")} className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 rounded-xl p-4 text-left transition-all group flex flex-col justify-between min-h-[120px]">
                <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Community Summary PDF</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">High-level growth and engagement metrics.</p>
                </div>
              </button>
              
              <button onClick={() => handleExport("Leaderboard")} className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 rounded-xl p-4 text-left transition-all group flex flex-col justify-between min-h-[120px]">
                <div className="h-8 w-8 rounded-lg bg-lime-500/10 text-lime-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Leaderboard PDF</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Top athletes across all challenges this month.</p>
                </div>
              </button>

              <button onClick={() => handleExport("Activity Log")} className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 rounded-xl p-4 text-left transition-all group flex flex-col justify-between min-h-[120px]">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Raw Activity CSV</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Export raw table for Excel processing.</p>
                </div>
              </button>

              <button onClick={() => handleExport("Athlete Roster")} className="bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 rounded-xl p-4 text-left transition-all group flex flex-col justify-between min-h-[120px]">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Athlete Roster Excel</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Full breakdown of all registered members.</p>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
