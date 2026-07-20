"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { usePageLoader } from "@/components/PageLoader";
import { 
  Users, Activity, Trophy, Plus, 
  Target, LogOut, Loader2,
  Search, X, Bike, Footprints,
  RefreshCw, Eye, AlertTriangle, Send, 
  Download, Database, Bell, Settings, Menu,
  CheckCircle, ChevronRight, MapPin, Calendar, Clock,
  MessageSquare, ShieldAlert
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
  const { addToast } = useToast();
  const { showLoader, hideLoader } = usePageLoader();
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "archived">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Quick Actions Modals
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);

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

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-search-input");
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    setLoadingLogout(true);
    showLoader("Signing out...");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !goalTarget || !startDate || !endDate) {
      addToast("Validation Error", "error", "Please fill out all required fields.");
      return;
    }
    setLoadingCreate(true);
    
    // Simulating creation for mockup
    setTimeout(() => {
      addToast("Challenge Created", "success", `"${title}" has been added.`);
      setIsCreateDrawerOpen(false);
      setLoadingCreate(false);
      setTitle("");
      setDescription("");
      setGoalTarget("");
      setStartDate("");
      setEndDate("");
      setBannerUrl("");
    }, 1000);
  };

  const handleSyncAll = async () => {
    setLoadingSync(true);
    addToast("Sync Triggered", "info", "Requesting sync for all connections...");
    setTimeout(() => {
      addToast("Sync Complete", "success", "System is fully synchronized.");
      setLoadingSync(false);
    }, 1500);
  };

  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    addToast("Announcement Sent", "success", "Message broadcasted to community.");
    setIsBroadcastModalOpen(false);
    setBroadcastText("");
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return "A";
    const parts = fullName.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return fullName.slice(0, 2).toUpperCase();
  };

  const allActivitiesList = useMemo(() => {
    const list: any[] = [];
    allAthletes.forEach(a => {
      a.recentActivities.forEach(act => {
        list.push({
          athleteName: a.name,
          athleteAvatar: a.avatar,
          activityName: act.name,
          distance: act.distance,
          sportType: act.sportType,
          startDate: act.startDate,
          id: act.id,
          user_id: a.id
        });
      });
    });
    return list;
  }, [allAthletes]);

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { challenges: [], athletes: [], activities: [] };

    const matchedChallenges = challenges.filter(c => 
      c.title.toLowerCase().includes(q) ||
      c.challenge_code?.toLowerCase().includes(q) ||
      c.sportType.toLowerCase().includes(q)
    ).slice(0, 3);

    const matchedAthletes = allAthletes.filter(a => 
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.athleteId.toLowerCase().includes(q) ||
      a.stravaAthleteName?.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedActivities = allActivitiesList.filter(act =>
      act.activityName.toLowerCase().includes(q) ||
      act.athleteName.toLowerCase().includes(q)
    ).slice(0, 3);

    return { challenges: matchedChallenges, athletes: matchedAthletes, activities: matchedActivities };
  }, [searchQuery, challenges, allAthletes, allActivitiesList]);

  const hasSearchResults = searchResults.challenges.length > 0 || searchResults.athletes.length > 0 || searchResults.activities.length > 0;

  const sidebarLinks = [
    { title: "Dashboard", icon: Database, active: true },
    { title: "Challenges", icon: Trophy, active: false, badge: String(initialMetrics.activeChallenges) },
    { title: "Athletes", icon: Users, active: false },
    { title: "Activities", icon: Activity, active: false },
    { title: "Reports", icon: Download, active: false },
    { title: "Settings", icon: Settings, active: false },
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-300 font-sans overflow-hidden">
      
      {/* SIDEBAR (Fixed) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 bg-[#09090b] shrink-0 h-full">
        <div className="h-16 flex items-center px-6 border-b border-white/5 gap-3">
          <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center text-[#09090b]">
            <Trophy className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight leading-none">KYL Arena</span>
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-1">Admin</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-600 mb-4 px-2">Menu</div>
          {sidebarLinks.map((link) => (
            <button
              key={link.title}
              onClick={() => {
                if (link.title === "Athletes") router.push("/arena-admin/athletes");
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                link.active 
                  ? "bg-zinc-100 text-[#09090b]" 
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <link.icon className={`h-4 w-4 ${link.active ? "text-[#09090b]" : "text-zinc-500"}`} />
                <span>{link.title}</span>
              </div>
              {link.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  link.active ? "bg-zinc-200 text-zinc-800" : "bg-zinc-800 text-zinc-300"
                }`}>
                  {link.badge}
                </span>
              )}
            </button>
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
              className="fixed inset-y-0 left-0 w-64 z-50 bg-[#09090b] border-r border-white/5 flex flex-col lg:hidden"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center text-[#09090b]">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-white tracking-tight">KYL Arena</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1">
                {sidebarLinks.map((link) => (
                  <button
                    key={link.title}
                    onClick={() => {
                      setIsSidebarOpen(false);
                      if (link.title === "Athletes") router.push("/arena-admin/athletes");
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      link.active ? "bg-zinc-100 text-[#09090b]" : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    <span>{link.title}</span>
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP BAR / COMMAND CENTER */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-white/5 bg-[#09090b] shrink-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Global Search */}
            <div ref={searchRef} className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                id="global-search-input"
                type="text"
                placeholder="Search athletes, challenges, activities... (Cmd+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full h-10 pl-9 pr-4 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              
              {/* Search Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-[400px] overflow-y-auto"
                  >
                    {!hasSearchResults ? (
                      <div className="p-4 text-center text-sm text-zinc-500">No results found for "{searchQuery}"</div>
                    ) : (
                      <div className="py-2">
                        {searchResults.athletes.length > 0 && (
                          <div className="px-3 pb-2">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">Athletes</div>
                            {searchResults.athletes.map(ath => (
                              <button
                                key={ath.id}
                                onClick={() => {
                                  setSelectedAthlete(ath);
                                  setSearchQuery("");
                                  setIsSearchFocused(false);
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-zinc-800 rounded-lg transition-colors text-left"
                              >
                                <img src={ath.avatar} alt="" className="h-8 w-8 rounded-full bg-zinc-800 object-cover" />
                                <div>
                                  <div className="text-sm font-medium text-white">{ath.name}</div>
                                  <div className="text-xs text-zinc-500">{ath.email}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {searchResults.challenges.length > 0 && (
                          <div className="px-3 py-2 border-t border-white/5">
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">Challenges</div>
                            {searchResults.challenges.map(chal => (
                              <Link
                                key={chal.id}
                                href={`/arena-admin/challenges/${chal.slug}`}
                                className="w-full flex items-center justify-between p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                <div>
                                  <div className="text-sm font-medium text-white">{chal.title}</div>
                                  <div className="text-xs text-zinc-500">{chal.participantsCount} enrolled</div>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{chal.sportType}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden md:flex text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-zinc-900 transition-colors">
              Athlete View
            </Link>
            
            {/* Compact Notifications */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsMenuOpen(!isNotificationsMenuOpen)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 border-2 border-[#09090b]" />
              </button>
              
              <AnimatePresence>
                {isNotificationsMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 p-2"
                    >
                      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 border-b border-white/5">Notifications</div>
                      <div className="space-y-1">
                        <div className="p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors">
                          <div className="text-sm font-medium text-white">System Sync Complete</div>
                          <div className="text-xs text-zinc-500 mt-1">All athlete data pipelines processed successfully.</div>
                          <div className="text-[10px] text-zinc-600 mt-2">1h ago</div>
                        </div>
                        <div className="p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors">
                          <div className="text-sm font-medium text-white">New Athlete Joined</div>
                          <div className="text-xs text-zinc-500 mt-1">Sarah Jenkins connected Strava account.</div>
                          <div className="text-[10px] text-zinc-600 mt-2">4h ago</div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="h-4 w-px bg-white/10 mx-1" />

            {/* Profile Dropdown (Simplified) */}
            <div className="flex items-center gap-2">
              <img src={profile.avatar || "/placeholder.svg"} alt="" className="h-8 w-8 rounded-full bg-zinc-800 object-cover" />
              <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                {loadingLogout ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-8 pb-20">
            
            {/* Header / Intro */}
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Good evening, {profile.name.split(" ")[0]}</h1>
              <p className="text-sm text-zinc-400 mt-1">Here is the latest pulse of the KYL Arena community.</p>
            </div>

            {/* COMMUNITY HEALTH SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-3 text-zinc-400 mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Total Members</span>
                </div>
                <div className="text-3xl font-bold text-white">{initialMetrics.totalMembers}</div>
                <div className="text-xs text-zinc-500 mt-2">+12 this week</div>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-3 text-zinc-400 mb-2">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Active Challenges</span>
                </div>
                <div className="text-3xl font-bold text-white">{initialMetrics.activeChallenges}</div>
                <div className="text-xs text-zinc-500 mt-2">{initialMetrics.averageCompletionRate}% avg completion</div>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-3 text-zinc-400 mb-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Total Distance</span>
                </div>
                <div className="text-3xl font-bold text-white">{initialMetrics.totalDistance?.toLocaleString()} <span className="text-lg text-zinc-500 font-normal">km</span></div>
                <div className="text-xs text-zinc-500 mt-2">{initialMetrics.syncedActivities} total activities</div>
              </div>
              <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
                <div className="flex items-center gap-3 text-zinc-400 mb-2">
                  <Database className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">System Status</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-white">All Systems Operational</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Last synced 2m ago</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN: Challenges */}
              <div className="lg:col-span-2 space-y-6">
                
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Challenges</h2>
                  <div className="flex bg-zinc-900 p-1 rounded-lg border border-white/5">
                    {(["active", "upcoming", "archived"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                          activeTab === tab ? "bg-zinc-100 text-[#09090b]" : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  {challenges.filter(c => c.status === activeTab).map(chal => {
                    // Mock progress logic for cleaner cards
                    const progress = chal.status === "active" ? 64 : chal.status === "archived" ? 100 : 0;
                    return (
                      <div key={chal.id} className="bg-zinc-900 border border-white/5 rounded-xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center hover:border-white/10 transition-colors">
                        <div className="h-20 w-20 sm:h-16 sm:w-16 rounded-lg bg-zinc-800 shrink-0 overflow-hidden relative">
                          <img src={chal.bannerUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-white truncate">{chal.title}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-zinc-800 text-zinc-400">
                              {chal.sportType}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-500 truncate mb-3">{chal.description}</p>
                          
                          {/* Clean Progress Bar */}
                          <div className="space-y-1.5 max-w-md">
                            <div className="flex justify-between text-xs text-zinc-400">
                              <span>Progress to {chal.goalTarget}{chal.goalType === "Distance" ? "km" : ""}</span>
                              <span className="font-medium text-white">{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-zinc-100 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </div>
                        
                        <div className="shrink-0 flex flex-col items-end gap-2 border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-5 w-full sm:w-auto">
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">{chal.participantsCount}</div>
                            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Participants</div>
                          </div>
                          <Link
                            href={`/arena-admin/challenges/${chal.slug}`}
                            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            View Details &rarr;
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                  {challenges.filter(c => c.status === activeTab).length === 0 && (
                    <div className="p-10 text-center border border-dashed border-white/10 rounded-xl text-sm text-zinc-500">
                      No {activeTab} challenges found.
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Quick Actions & Recent */}
              <div className="space-y-6">
                
                {/* Quick Actions */}
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsCreateDrawerOpen(true)} className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-white/5 bg-zinc-950 hover:bg-zinc-800 transition-colors">
                      <Plus className="h-5 w-5 text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-300">New Challenge</span>
                    </button>
                    <button onClick={() => document.getElementById("global-search-input")?.focus()} className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-white/5 bg-zinc-950 hover:bg-zinc-800 transition-colors">
                      <Search className="h-5 w-5 text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-300">Find Athlete</span>
                    </button>
                    <button onClick={handleSyncAll} disabled={loadingSync} className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-white/5 bg-zinc-950 hover:bg-zinc-800 transition-colors">
                      {loadingSync ? <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" /> : <RefreshCw className="h-5 w-5 text-zinc-400" />}
                      <span className="text-xs font-medium text-zinc-300">Force Sync</span>
                    </button>
                    <button onClick={() => setIsBroadcastModalOpen(true)} className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-white/5 bg-zinc-950 hover:bg-zinc-800 transition-colors">
                      <Send className="h-5 w-5 text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-300">Announcement</span>
                    </button>
                  </div>
                </div>

                {/* Recent Activities (Compact) */}
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Logs</h2>
                  </div>
                  <div className="space-y-3">
                    {recentFeed.slice(0, 5).map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img src={item.avatar} alt="" className="h-8 w-8 rounded-full bg-zinc-800 object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{item.name}</div>
                          <div className="text-xs text-zinc-500 truncate">{item.action}</div>
                        </div>
                        <div className="text-xs font-bold text-zinc-300">{item.displayValue}</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ATHLETE SLIDE-OUT INSPECTOR */}
      <AnimatePresence>
        {selectedAthlete && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAthlete(null)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#09090b] border-l border-white/10 z-50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">Athlete Inspector</h2>
                <button onClick={() => setSelectedAthlete(null)} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Profile Header */}
                <div className="flex gap-4 items-center">
                  <img src={selectedAthlete.avatar} alt="" className="h-16 w-16 rounded-full bg-zinc-800 object-cover ring-4 ring-zinc-900" />
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedAthlete.name}</h3>
                    <p className="text-sm text-zinc-400">{selectedAthlete.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedAthlete.stravaConnected ? "bg-orange-500/10 text-orange-500" : "bg-zinc-800 text-zinc-500"}`}>
                        Strava {selectedAthlete.stravaConnected ? "Connected" : "Offline"}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">ID: {selectedAthlete.athleteId}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900 rounded-xl p-4 border border-white/5">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Challenge Dist</div>
                    <div className="text-2xl font-bold text-white">{selectedAthlete.challengeDistance} <span className="text-sm font-normal text-zinc-500">km</span></div>
                  </div>
                  <div className="bg-zinc-900 rounded-xl p-4 border border-white/5">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Activities</div>
                    <div className="text-2xl font-bold text-white">{selectedAthlete.recentActivities.length}</div>
                  </div>
                </div>

                {/* Recent Activities */}
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Recent Logs</h4>
                  <div className="space-y-3">
                    {selectedAthlete.recentActivities.map(act => (
                      <div key={act.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-zinc-800 text-zinc-400">
                            {act.sportType === "Ride" ? <Bike className="h-4 w-4" /> : <Footprints className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{act.name}</div>
                            <div className="text-xs text-zinc-500">{act.startDate}</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-white">{act.distance} km</div>
                      </div>
                    ))}
                    {selectedAthlete.recentActivities.length === 0 && (
                      <div className="text-sm text-zinc-500">No recent activities found.</div>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Admin Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-zinc-900 transition-colors text-zinc-300">
                      <MessageSquare className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm font-medium">Send Direct Message</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-500/10 hover:bg-red-500/10 transition-colors text-red-400">
                      <ShieldAlert className="h-4 w-4 text-red-500/70" />
                      <span className="text-sm font-medium">Revoke Access</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CREATE CHALLENGE DRAWER (Simplified visual) */}
      <AnimatePresence>
        {isCreateDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateDrawerOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full max-w-md bg-[#09090b] border-l border-white/10 z-50 flex flex-col">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">New Challenge</h2>
                <button onClick={() => setIsCreateDrawerOpen(false)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <form id="create-challenge-form" onSubmit={handleCreateChallenge} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Title</label>
                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-zinc-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Description</label>
                    <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-zinc-400 min-h-[100px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">Sport Type</label>
                      <select value={sportType} onChange={e => setSportType(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none">
                        <option value="Ride">Ride</option>
                        <option value="Run">Run</option>
                        <option value="Walk">Walk</option>
                        <option value="Multisport">Multisport</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">Goal Metric</label>
                      <select value={goalType} onChange={e => setGoalType(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none">
                        <option value="Distance">Distance</option>
                        <option value="Elevation">Elevation</option>
                        <option value="Time">Time</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Target Value</label>
                    <input type="number" required value={goalTarget} onChange={e => setGoalTarget(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-zinc-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">Start Date</label>
                      <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">End Date</label>
                      <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none" />
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-white/5 bg-[#09090b]">
                <Button type="submit" form="create-challenge-form" disabled={loadingCreate} className="w-full bg-zinc-100 hover:bg-white text-black font-medium h-12">
                  {loadingCreate ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publish Challenge"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BROADCAST MODAL (Simplified) */}
      <AnimatePresence>
        {isBroadcastModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5">
                  <h3 className="text-lg font-bold text-white">Broadcast Announcement</h3>
                  <p className="text-sm text-zinc-500 mt-1">Send a message to all active athletes.</p>
                </div>
                <form onSubmit={handleBroadcastAnnouncement} className="p-6 space-y-4">
                  <textarea 
                    value={broadcastText} 
                    onChange={e => setBroadcastText(e.target.value)} 
                    placeholder="Type your message here..."
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-zinc-500 min-h-[120px]"
                  />
                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="ghost" onClick={() => setIsBroadcastModalOpen(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
                    <Button type="submit" className="bg-zinc-100 hover:bg-white text-black">Send Message</Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
