"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Users, Activity, Settings, X, Search, ArrowRight,
  FileText, LayoutDashboard, Calendar, Target, Award,
  Menu, Play, Pause, CheckCircle, Flag, Map, Info, Clock, ExternalLink,
  ShieldAlert, RefreshCw, AlertTriangle
} from "lucide-react";

interface ActivitiesClientProps {
  profile: any;
  userRole: string;
  initialActivities: any[];
  initialChallenges: any[];
  initialProfiles: any[];
}

export default function ActivitiesClient({
  profile,
  userRole,
  initialActivities,
  initialChallenges,
  initialProfiles,
}: ActivitiesClientProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Activities");
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  // Sidebar navigation
  const navigationGroups = [
    {
      label: "WORKSPACE",
      links: [
        { title: "Dashboard", icon: LayoutDashboard, active: false, route: "/arena-admin" },
        { title: "Challenges", icon: Trophy, active: false, route: "/arena-admin/challenges" },
        { title: "Athletes", icon: Users, active: false, route: "/arena-admin/athletes" },
        { title: "Activities", icon: Activity, active: true, route: "/arena-admin/activities" },
        { title: "Reports", icon: FileText, active: false, route: "/arena-admin/reports" },
      ]
    }
  ];

  const filterOptions = [
    "All Activities", "Ride", "Run", "Walk", 
    "Challenge Activities", "Unassigned Activities", 
    "Failed Syncs", "Pending Syncs", "Completed Syncs"
  ];

  // Enrich Activities
  const enrichedActivities = useMemo(() => {
    return initialActivities.map(act => {
      const athlete = initialProfiles.find(p => p.id === act.user_id) || { name: "Unknown Athlete", avatar: "" };
      
      // Determine if it matches any challenge
      let assignedChallenge = null;
      const actTime = new Date(act.start_date).getTime();
      
      for (const ch of initialChallenges) {
        const start = new Date(ch.start_date).getTime();
        const end = new Date(`${ch.end_date}T23:59:59Z`).getTime();
        if (actTime >= start && actTime <= end) {
          if (ch.sport_type === "Multisport" || act.sport_type?.toLowerCase() === ch.sport_type?.toLowerCase() || (ch.sport_type === "Ride" && act.sport_type === "VirtualRide")) {
            assignedChallenge = ch;
            break;
          }
        }
      }

      const syncStatus = act.id ? "Completed" : "Pending"; // Mock logic for sync status

      return {
        ...act,
        athleteName: athlete.name,
        athleteAvatar: athlete.avatar,
        challengeName: assignedChallenge ? assignedChallenge.title : null,
        syncStatus,
        avgSpeed: act.distance && act.moving_time ? (Number(act.distance) / Number(act.moving_time)) * 3.6 : 0 // km/h
      };
    });
  }, [initialActivities, initialChallenges, initialProfiles]);

  // Apply filters
  const displayedActivities = useMemo(() => {
    return enrichedActivities.filter(act => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        (act.athleteName || "").toLowerCase().includes(q) ||
        (act.name || "").toLowerCase().includes(q) ||
        (act.strava_activity_id?.toString() || "").toLowerCase().includes(q) ||
        (act.challengeName || "").toLowerCase().includes(q) ||
        (act.sport_type || "").toLowerCase().includes(q);

      if (!matchSearch) return false;

      switch(activeFilter) {
        case "Ride": return act.sport_type === "Ride" || act.sport_type === "VirtualRide";
        case "Run": return act.sport_type === "Run";
        case "Walk": return act.sport_type === "Walk";
        case "Challenge Activities": return act.challengeName !== null;
        case "Unassigned Activities": return act.challengeName === null;
        case "Completed Syncs": return act.syncStatus === "Completed";
        case "Failed Syncs": return act.syncStatus === "Failed";
        case "Pending Syncs": return act.syncStatus === "Pending";
        default: return true;
      }
    });
  }, [enrichedActivities, searchQuery, activeFilter]);

  // Calculate Summary Stats
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let actToday = 0;
    let actWeek = 0;
    let distToday = 0;
    let distMonth = 0;

    enrichedActivities.forEach(act => {
      const t = new Date(act.start_date).getTime();
      const distKm = (Number(act.distance) || 0) / 1000;
      
      if (t >= startOfToday) {
        actToday++;
        distToday += distKm;
      }
      if (t >= startOfWeek) actWeek++;
      if (t >= startOfMonth) distMonth += distKm;
    });

    return {
      actToday, actWeek, distToday, distMonth,
      failedSyncs: 0, // Placeholder
      pendingSyncs: 0, // Placeholder
      latestSync: enrichedActivities.length > 0 ? new Date(enrichedActivities[0].start_date).toLocaleString() : "Never"
    };
  }, [enrichedActivities]);

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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 flex items-center px-6 border-b border-white/5 bg-[#09090b] shrink-0 gap-6 z-30 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-white tracking-tight hidden sm:block">Activity Operations</h1>
          </div>
          
          <div className="relative w-full max-w-[500px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by athlete, activity name, Strava ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-500/50 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded border border-white/10 hidden sm:block">⌘K</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex">
          <main className={`flex-1 min-w-0 p-6 flex flex-col gap-6 transition-all duration-300 ${selectedActivity ? 'pr-[400px]' : ''}`}>
            
            {/* STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Act Today</span>
                <span className="text-2xl font-black text-white">{stats.actToday}</span>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Act This Week</span>
                <span className="text-2xl font-black text-white">{stats.actWeek}</span>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Dist Today</span>
                <span className="text-2xl font-black text-white">{stats.distToday.toFixed(1)} <span className="text-xs font-normal text-zinc-500">km</span></span>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Dist Month</span>
                <span className="text-2xl font-black text-white">{stats.distMonth.toFixed(0)} <span className="text-xs font-normal text-zinc-500">km</span></span>
              </div>
              <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-16 h-16 bg-red-500/10 rounded-bl-full" />
                <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider block mb-1">Failed Syncs</span>
                <span className="text-2xl font-black text-red-400">{stats.failedSyncs}</span>
              </div>
              <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-16 h-16 bg-yellow-500/10 rounded-bl-full" />
                <span className="text-[10px] text-yellow-400 uppercase font-bold tracking-wider block mb-1">Pending</span>
                <span className="text-2xl font-black text-yellow-400">{stats.pendingSyncs}</span>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 col-span-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Latest Sync Timestamp</span>
                <span className="text-sm font-medium text-white">{stats.latestSync}</span>
              </div>
            </div>

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
                  {f}
                </button>
              ))}
            </div>

            {/* MAIN TABLE */}
            <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden flex-1 flex flex-col min-h-[400px]">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Athlete</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Activity</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Challenge</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Distance</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {displayedActivities.map(act => (
                      <tr 
                        key={act.id} 
                        onClick={() => setSelectedActivity(act)}
                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${selectedActivity?.id === act.id ? 'bg-white/[0.04]' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                              {act.athleteAvatar ? (
                                <img src={act.athleteAvatar} alt={act.athleteName} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-zinc-500">{act.athleteName?.charAt(0) || '?'}</div>
                              )}
                            </div>
                            <span className="text-sm font-bold text-white group-hover:text-lime-400 transition-colors">{act.athleteName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-white truncate max-w-[200px]">{act.name}</p>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold">{act.sport_type}</p>
                        </td>
                        <td className="px-6 py-4">
                          {act.challengeName ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-lime-500/10 text-lime-400 border border-lime-500/20 truncate max-w-[150px]">
                              {act.challengeName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-600 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-white">{((Number(act.distance) || 0)/1000).toFixed(1)} <span className="text-[10px] font-normal text-zinc-500">km</span></span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs text-zinc-400">{new Date(act.start_date).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          {act.syncStatus === "Completed" && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400"><CheckCircle className="h-3 w-3" /> OK</span>}
                          {act.syncStatus === "Failed" && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-red-400"><AlertTriangle className="h-3 w-3" /> Error</span>}
                          {act.syncStatus === "Pending" && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-yellow-400"><RefreshCw className="h-3 w-3 animate-spin" /> Sync</span>}
                        </td>
                      </tr>
                    ))}
                    {displayedActivities.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-500">
                          No activities found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>

          {/* INSPECTOR DRAWER */}
          <AnimatePresence>
            {selectedActivity && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-16 bottom-0 w-[400px] bg-[#0C0C0E] border-l border-white/5 z-40 shadow-2xl overflow-y-auto"
              >
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-black text-white leading-tight mb-1">{selectedActivity.name}</h3>
                      <p className="text-xs text-zinc-500 font-medium">Activity ID: {selectedActivity.strava_activity_id}</p>
                    </div>
                    <button onClick={() => setSelectedActivity(null)} className="h-8 w-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* MAP PLACEHOLDER */}
                  <div className="h-48 w-full bg-zinc-900 border border-white/5 rounded-xl flex flex-col items-center justify-center overflow-hidden relative">
                    <Map className="h-8 w-8 text-zinc-800 mb-2" />
                    <span className="text-xs font-bold text-zinc-700 uppercase">Map Data Unavailable</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900 border border-white/5 rounded-lg p-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Distance</span>
                      <span className="text-lg font-black text-white">{((Number(selectedActivity.distance) || 0)/1000).toFixed(2)} <span className="text-xs font-normal text-zinc-500">km</span></span>
                    </div>
                    <div className="bg-zinc-900 border border-white/5 rounded-lg p-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Elevation</span>
                      <span className="text-lg font-black text-white">{Number(selectedActivity.total_elevation_gain || 0).toFixed(0)} <span className="text-xs font-normal text-zinc-500">m</span></span>
                    </div>
                    <div className="bg-zinc-900 border border-white/5 rounded-lg p-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Moving Time</span>
                      <span className="text-lg font-black text-white">{Math.floor((Number(selectedActivity.moving_time) || 0) / 60)} <span className="text-xs font-normal text-zinc-500">min</span></span>
                    </div>
                    <div className="bg-zinc-900 border border-white/5 rounded-lg p-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Avg Speed</span>
                      <span className="text-lg font-black text-white">{selectedActivity.avgSpeed.toFixed(1)} <span className="text-xs font-normal text-zinc-500">km/h</span></span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">Athlete</span>
                      <span className="text-sm font-medium text-white">{selectedActivity.athleteName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">Sport</span>
                      <span className="text-sm font-medium text-white">{selectedActivity.sport_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">Date</span>
                      <span className="text-sm font-medium text-white">{new Date(selectedActivity.start_date).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">Challenge</span>
                      {selectedActivity.challengeName ? (
                        <span className="text-xs font-bold text-lime-400 bg-lime-500/10 px-2 py-0.5 rounded">{selectedActivity.challengeName}</span>
                      ) : (
                        <span className="text-xs text-zinc-500">None</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 space-y-3 flex flex-col">
                    <a 
                      href={`https://www.strava.com/activities/${selectedActivity.strava_activity_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-10 bg-[#fc4c02] hover:bg-[#fc4c02]/90 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      View on Strava
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button className="w-full h-10 bg-zinc-900 border border-white/10 hover:bg-white/5 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors">
                      <RefreshCw className="h-4 w-4" />
                      Force Refresh Activity
                    </button>
                    <button className="w-full h-10 bg-red-950/20 border border-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors">
                      <Flag className="h-4 w-4" />
                      Flag Activity
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
