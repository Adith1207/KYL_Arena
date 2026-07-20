"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Users, Activity, Settings, X, Search, ArrowRight,
  FileText, LayoutDashboard, Calendar, Target, Award,
  Menu, Play, Pause, CheckCircle, Flag
} from "lucide-react";

interface ChallengesClientProps {
  profile: any;
  userRole: string;
  initialChallenges: any[];
  initialParticipations: any[];
  initialProfiles: any[];
  initialActivities: any[];
}

export default function ChallengesClient({
  profile,
  userRole,
  initialChallenges,
  initialParticipations,
  initialProfiles,
  initialActivities,
}: ChallengesClientProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // Sidebar navigation
  const navigationGroups = [
    {
      label: "WORKSPACE",
      links: [
        { title: "Dashboard", icon: LayoutDashboard, active: false, route: "/arena-admin" },
        { title: "Challenges", icon: Trophy, active: true, route: "/arena-admin/challenges" },
        { title: "Athletes", icon: Users, active: false, route: "/arena-admin/athletes" },
        { title: "Activities", icon: Activity, active: false, route: "/arena-admin/activities" },
        { title: "Reports", icon: FileText, active: false, route: "/arena-admin/reports" },
      ]
    }
  ];

  const filterOptions = ["All", "Active", "Upcoming", "Completed", "Archived", "Draft"];

  // Enrich challenges
  const enrichedChallenges = useMemo(() => {
    return initialChallenges.map((challenge) => {
      const parts = initialParticipations.filter(p => p.challenge_id === challenge.id);
      const participantCount = parts.length;
      
      const challengeStart = new Date(challenge.start_date).getTime();
      const challengeEnd = new Date(`${challenge.end_date}T23:59:59Z`).getTime();

      let communityDistance = 0;
      let communityElevation = 0;
      let communityMovingTime = 0;
      
      const participantProgress: Record<string, number> = {};

      parts.forEach(p => {
        participantProgress[p.user_id] = 0;
      });

      // Filter activities inside window and matching sport
      const validActivities = initialActivities.filter(act => {
        const actTime = new Date(act.start_date).getTime();
        if (actTime < challengeStart || actTime > challengeEnd) return false;
        if (challenge.sport_type !== "Multisport" && act.sport_type?.toLowerCase() !== challenge.sport_type?.toLowerCase() && !(challenge.sport_type === "Ride" && act.sport_type === "VirtualRide")) {
          return false;
        }
        return true;
      });

      validActivities.forEach(act => {
        if (parts.some(p => p.user_id === act.user_id)) {
          communityDistance += Number(act.distance || 0) / 1000;
          communityElevation += Number(act.total_elevation_gain || 0);
          communityMovingTime += Number(act.moving_time || 0) / 3600;

          if (challenge.goal_metric === "Distance") {
            participantProgress[act.user_id] = (participantProgress[act.user_id] || 0) + (Number(act.distance || 0) / 1000);
          } else if (challenge.goal_metric === "Elevation") {
            participantProgress[act.user_id] = (participantProgress[act.user_id] || 0) + Number(act.total_elevation_gain || 0);
          }
        }
      });

      // Find top athlete
      let topAthleteId: string | null = null;
      let maxProgress = -1;
      Object.keys(participantProgress).forEach(uid => {
        if (participantProgress[uid] > maxProgress) {
          maxProgress = participantProgress[uid];
          topAthleteId = uid;
        }
      });

      let topAthleteName = "None";
      if (topAthleteId) {
        const topProf = initialProfiles.find(p => p.id === topAthleteId);
        if (topProf) topAthleteName = topProf.name;
      }

      // Calculations based on metric
      let averageProgress = 0;
      let completionPercentage = 0;
      let metricValue = communityDistance;
      
      if (challenge.goal_metric === "Elevation") metricValue = communityElevation;
      if (challenge.goal_metric === "Time") metricValue = communityMovingTime;

      if (participantCount > 0) {
        averageProgress = metricValue / participantCount;
        completionPercentage = Math.min(100, (averageProgress / Number(challenge.goal_target)) * 100);
      }

      // Evaluate dates for accurate status display
      const now = Date.now();
      let dynamicStatus = challenge.status;
      if (dynamicStatus !== 'archived' && dynamicStatus !== 'draft') {
        if (now < challengeStart) dynamicStatus = "upcoming";
        else if (now > challengeEnd) dynamicStatus = "completed";
        else dynamicStatus = "active";
      }

      return {
        ...challenge,
        dynamicStatus,
        participantCount,
        communityMetric: metricValue,
        averageProgress,
        completionPercentage,
        topAthleteName,
        maxProgress: maxProgress > 0 ? maxProgress : 0
      };
    });
  }, [initialChallenges, initialParticipations, initialProfiles, initialActivities]);

  // Apply Search and Filters
  const displayedChallenges = useMemo(() => {
    return enrichedChallenges.filter((ch) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        ch.title.toLowerCase().includes(q) ||
        (ch.challenge_code || "").toLowerCase().includes(q) ||
        ch.sport_type.toLowerCase().includes(q) ||
        ch.status.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (activeFilter !== "All") {
        if (ch.dynamicStatus.toLowerCase() !== activeFilter.toLowerCase()) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [enrichedChallenges, searchQuery, activeFilter]);


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
              {/* Similar header/links as desktop */}
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
        {/* HEADER */}
        <header className="h-16 flex items-center px-6 border-b border-white/5 bg-[#09090b] shrink-0 gap-6 z-30 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-white tracking-tight hidden sm:block">Challenge Management</h1>
          </div>
          
          {/* SEARCH HERO */}
          <div className="relative w-full max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, code, or sport..."
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
                  {f}
                </button>
              ))}
            </div>

            {/* CHALLENGE DIRECTORY */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max pb-12">
              {displayedChallenges.map(ch => {
                const statusColors: any = {
                  active: "bg-lime-500/20 text-lime-400 border-lime-500/30",
                  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
                  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                };

                const sColor = statusColors[ch.dynamicStatus] || statusColors.draft;
                
                return (
                  <div key={ch.id} className="group bg-zinc-900 border border-white/5 hover:border-white/15 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col">
                    
                    {/* Banner Image */}
                    <div className="h-32 w-full bg-zinc-800 relative overflow-hidden">
                      {ch.banner_url ? (
                        <img src={ch.banner_url} alt={ch.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-700" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${sColor}`}>
                          {ch.dynamicStatus}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded border border-white/10 text-white">
                        <Trophy className="h-3 w-3" />
                        <span className="text-[10px] font-bold">{ch.challenge_code || 'CODE-MISSING'}</span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-white mb-1 group-hover:text-lime-400 transition-colors leading-tight">{ch.title}</h3>
                          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(ch.start_date).toLocaleDateString('en-US', {month:'short', day:'numeric'})} - {new Date(ch.end_date).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
                          </p>
                        </div>
                        <div className="shrink-0 text-center">
                          <span className="block text-xs font-bold text-zinc-500 uppercase">{ch.sport_type}</span>
                          <span className="block font-black text-white">{ch.goal_target} <span className="text-xs font-normal text-zinc-500">{ch.goal_metric === 'Distance' ? 'km' : ''}</span></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Participants</span>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-zinc-400" />
                            <span className="text-sm font-semibold text-white">{ch.participantCount}</span>
                          </div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Top Athlete</span>
                          <div className="flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5 text-zinc-400" />
                            <span className="text-sm font-semibold text-white truncate max-w-[80px]">{ch.topAthleteName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-auto space-y-2">
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                          <span className="text-zinc-500">Avg Progress</span>
                          <span className="text-lime-400">{ch.completionPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-lime-500 rounded-full"
                            style={{ width: `${ch.completionPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
                        <Link href={`/arena-admin/challenges/${ch.slug}`} className="flex-1">
                          <button className="w-full py-2 bg-white/5 hover:bg-lime-500/10 text-white hover:text-lime-400 border border-transparent hover:border-lime-500/20 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2">
                            Manage
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {displayedChallenges.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                  <Trophy className="h-8 w-8 text-zinc-600 mb-3" />
                  <p className="text-zinc-400 text-sm">No challenges found matching the current filters.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
