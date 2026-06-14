"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Activity, AlertTriangle, CheckCircle, ShieldAlert, Award, ArrowLeft, Bike, Footprints } from "lucide-react";

interface ProfileData {
  id: string;
  email: string;
  name: string;
  avatar: string;
  auth_provider: string;
  strava_connected: boolean;
  strava_athlete_id: string | null;
  last_synced_at?: string | null;
  activities?: {
    name: string;
    sport_type: string;
    distance: number;
    moving_time: number;
    start_date: string;
  }[];
  activities_count?: number;
  strava_connection?: {
    athlete_name: string | null;
    athlete_username: string | null;
    athlete_avatar: string | null;
    created_at?: string | null;
  } | null;
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
}

export default function DashboardClient({ 
  initialProfile, 
  errorParam, 
  infoParam, 
  diagnostics 
}: DashboardClientProps) {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingDisconnect, setLoadingDisconnect] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

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

  const handleSyncActivities = async () => {
    setIsSyncing(true);
    setSyncError(null);
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
      } else {
        setSyncError(data.error || "Failed to synchronize activities. Please try again.");
      }
    } catch {
      setSyncError("Network error synchronizing activities.");
    } finally {
      setIsSyncing(false);
    }
  };

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
      // Clear localStorage
      localStorage.removeItem("kyl_mock_user");
      localStorage.removeItem("kyl_mock_strava_linked");
      localStorage.removeItem("kyl_mock_activities_synced");
      localStorage.removeItem("kyl_mock_last_synced_at");
      
      // Always redirect to login page
      window.location.href = "/login";
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
        }));
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

  // Get initials for avatar fallback
  const getInitials = (fullName: string) => {
    if (!fullName) return "A";
    const parts = fullName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-lime-400 selection:text-black overflow-hidden flex flex-col justify-between">
      
      {/* Background Radial & Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-lime-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Miniature Top Nav */}
      <nav className="relative z-10 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <svg className="h-6 w-6 transition-transform duration-500 group-hover:rotate-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g fill="#22c55e"><circle cx="48" cy="20" r="7" /><path d="M 28 69 C 14 78, 12 79, 10 80 C 15 78, 25 65, 32 50 C 37 40, 48 30, 60 22 Z" /></g>
                <g fill="#ef4444"><circle cx="78" cy="32" r="7" /><path d="M 46 48 C 58 40, 68 35, 75 42 Z" /></g>
                <g fill="#3b82f6"><circle cx="53" cy="68" r="7" /><path d="M 6 81 C 12 83, 25 75, 35 68 Z" /></g>
              </svg>
              <span className="text-sm font-black tracking-wider text-white">
                KYL <span className="text-lime-400">ARENA</span>
              </span>
            </Link>

            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Landing
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full space-y-6">
          
          {/* Header Description */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold uppercase tracking-widest text-lime-400 select-none">
              ATHLETE CONTROL CENTER
            </h1>
            <p className="text-xs text-zinc-500">
              Manage your connection endpoints, synchronize data, and access user preferences.
            </p>
          </div>

          {/* Profile Card Container */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            
            {/* Top border ambient gradient highlight */}
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/20 to-transparent" />
            
            {/* Ambient card background glow */}
            <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-lime-400/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              
              {/* Alert Banners */}
              {errorParam && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-950/25 border border-red-500/20 text-red-400 text-xs text-left animate-in fade-in duration-300">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold uppercase tracking-wider text-[10px] text-red-500">Authentication Alert</p>
                    <p className="font-medium text-zinc-300">
                      {errorParam === "strava_already_linked"
                        ? "This Strava account is already linked to another account."
                        : errorParam === "invalid_state"
                        ? "Security verification failed (Invalid State). Please try connecting again."
                        : errorParam === "oauth_exchange_failed"
                        ? "Failed to exchange authorization tokens with Strava."
                        : errorParam === "db_insert_failed"
                        ? "Failed to save Strava connection in the database."
                        : errorParam === "signup_failed"
                        ? "Failed to register an athlete profile account."
                        : errorParam === "signin_failed"
                        ? "Failed to establish a login session."
                        : errorParam === "db_query_failed"
                        ? "Database verification query failed."
                        : `Error: ${errorParam}`}
                    </p>
                  </div>
                </div>
              )}

              {infoParam === "already_connected" && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/20 text-emerald-400 text-xs text-left animate-in fade-in duration-300">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-400">Notice</p>
                    <p className="font-medium text-zinc-300">
                      Your Strava account is already successfully linked.
                    </p>
                  </div>
                </div>
              )}

              {/* Profile Details Row */}
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                {profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-lime-400/40"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-lime-400 font-extrabold text-lg tracking-wider ring-2 ring-white/5">
                    {getInitials(profile.name)}
                  </div>
                )}
                <div className="space-y-1 text-left">
                  <h2 className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">
                    Welcome, {profile.name.split(" ")[0]} 👋
                  </h2>
                  <p className="text-xs text-zinc-400 font-medium truncate max-w-[200px] sm:max-w-[240px]">
                    {profile.email}
                  </p>
                  
                  {/* Auth Provider Badge */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950 border border-white/5 text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    Provider: {profile.auth_provider}
                  </span>
                </div>
              </div>

              {/* Status Banner Area */}
              <div className="space-y-4">
                
                {profile.strava_connected ? (
                  /* Strava Connected State */
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/5 p-5 text-left space-y-4 shadow-inner relative overflow-hidden group/connected">
                    <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-400 transition-transform group-hover/connected:scale-110">
                      <Award className="h-16 w-16" />
                    </div>
                    
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="h-5 w-5 shrink-0" />
                      <span className="font-extrabold text-sm uppercase tracking-wider">
                        Strava Connected ✅
                      </span>
                    </div>

                    {/* Athlete Profile Summary */}
                    {profile.strava_connection && (
                      <div className="flex items-center gap-3 bg-zinc-950/40 p-3 rounded-xl border border-white/5">
                        {profile.strava_connection.athlete_avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profile.strava_connection.athlete_avatar}
                            alt={profile.strava_connection.athlete_name || "Athlete"}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-500/30"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-emerald-400 font-extrabold text-sm">
                            {getInitials(profile.strava_connection.athlete_name || "A")}
                          </div>
                        )}
                        <div className="space-y-0.5 text-left min-w-0">
                          <h4 className="font-bold text-sm text-white truncate">
                            {profile.strava_connection.athlete_name || "Strava Athlete"}
                          </h4>
                          {profile.strava_connection.athlete_username && (
                            <p className="text-[11px] text-zinc-500 font-mono truncate">
                              @{profile.strava_connection.athlete_username}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                      Your Strava account is linked successfully. Your cycling, running, and walking activities will sync automatically to challenges and leaderboards.
                    </p>
                    
                    <div className="space-y-2 text-[10px] text-zinc-500 bg-zinc-950/20 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold uppercase text-zinc-400">Athlete ID:</span>
                          <code className="font-mono text-emerald-400/80">{profile.strava_athlete_id}</code>
                        </div>
                        
                        <Button
                          onClick={handleDisconnectStrava}
                          disabled={loadingDisconnect}
                          variant="ghost"
                          className="h-5 px-1.5 text-[9px] font-black uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded border border-red-500/10 cursor-pointer"
                        >
                          {loadingDisconnect ? "Disconnecting..." : "Disconnect"}
                        </Button>
                      </div>

                      {profile.strava_connection?.created_at && (
                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/5">
                          <span className="font-bold uppercase text-zinc-400">Connected Date:</span>
                          <span className="text-zinc-350 font-mono" suppressHydrationWarning>
                            {new Date(profile.strava_connection.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Sync Activities Action & Stats */}
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="space-y-0.5 text-left">
                          <p className="text-zinc-500 font-bold uppercase text-[8px] tracking-wider">Last Sync</p>
                          <p className="font-mono text-zinc-300 text-[11px]" suppressHydrationWarning>
                            {profile.last_synced_at 
                              ? new Date(profile.last_synced_at).toLocaleString() 
                              : "Never Synced"}
                          </p>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <p className="text-zinc-500 font-bold uppercase text-[8px] tracking-wider">Total Activities</p>
                          <p className="font-mono text-emerald-400 font-extrabold text-[11px]">{profile.activities_count || 0}</p>
                        </div>
                      </div>

                      {syncError && (
                        <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-red-950/20 border border-red-500/10 text-red-400 text-[10px] text-left">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>{syncError}</span>
                        </div>
                      )}

                      <Button
                        onClick={handleSyncActivities}
                        disabled={isSyncing}
                        className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-[0_2px_8px_rgba(16,185,129,0.15)] hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Syncing Activities...
                          </>
                        ) : (
                          <>
                            <Activity className="h-4 w-4" />
                            Sync Activities
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Strava Not Connected State */
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-950/5 p-5 text-left space-y-4 shadow-inner relative overflow-hidden group/warning">
                    <div className="absolute top-0 right-0 p-3 opacity-10 text-amber-500">
                      <ShieldAlert className="h-16 w-16" />
                    </div>
                    
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="h-5 w-5 shrink-0 animate-bounce" />
                      <span className="font-extrabold text-sm uppercase tracking-wider">
                        Strava Not Connected ⚠️
                      </span>
                    </div>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                      Connect your Strava profile to synchronize fitness activities, participate in active community challenges, and secure rankings on local leaderboards.
                    </p>
                    
                    {/* Connect Strava CTA (Visual Emphasis) */}
                    <Button
                      onClick={handleConnectStrava}
                      disabled={loadingConnect}
                      className="w-full h-12 bg-[#FC6100] hover:bg-[#E55500] text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-[0_4px_12px_rgba(252,97,0,0.15)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      {loadingConnect ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Authorizing Strava...
                        </>
                      ) : (
                        <>
                          <svg className="h-4.5 w-4.5 fill-white shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l-2.836 5.637h4.372l1.548-3.087 1.546 3.087h4.373L13.626 2.52l-5.247 9.825" />
                          </svg>
                          Connect Strava
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
              </div>

              {/* Logout button */}
              <Button
                onClick={handleLogout}
                disabled={loadingLogout}
                variant="outline"
                className="w-full h-11 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
              >
                {loadingLogout ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing Out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </>
                )}
              </Button>

            </div>
          </div>

          {/* Latest Activities Card */}
          {profile.strava_connected && profile.activities && profile.activities.length > 0 && (
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              {/* Top border ambient highlight */}
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    LATEST SYNCED ACTIVITIES
                  </h3>
                  <span className="text-[9px] text-zinc-500 font-medium font-mono">
                    Showing 5 newest
                  </span>
                </div>

                <div className="space-y-2">
                  {profile.activities.map((activity, index) => {
                    const isRide = activity.sport_type === "Ride";
                    const isRun = activity.sport_type === "Run";
                    
                    return (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-white/5 hover:border-white/10 transition-all hover:translate-x-0.5 group/activity"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Sport Specific Icon */}
                          <div className={`p-2 rounded-lg shrink-0 ${
                            isRide ? "bg-amber-500/10 text-amber-400" :
                            isRun ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-blue-500/10 text-blue-400"
                          }`}>
                            {isRide ? <Bike className="h-4 w-4" /> :
                             isRun ? <Footprints className="h-4 w-4" /> :
                             <Footprints className="h-4 w-4" />}
                          </div>
                          <div className="text-left min-w-0">
                            <h4 className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-[190px]">
                              {activity.name}
                            </h4>
                            <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-wide mt-0.5" suppressHydrationWarning>
                              {activity.sport_type} • {new Date(activity.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-mono font-bold text-white">
                            {(activity.distance / 1000).toFixed(2)} km
                          </p>
                          <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                            {Math.round(activity.moving_time / 60)} min
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Diagnostics Console Accordion */}
          {diagnostics && (
            <div className="bg-zinc-900/20 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden mt-6 animate-in fade-in duration-300">
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
                
                <div className="p-4 border-t border-white/5 bg-zinc-950/90 text-left font-mono text-[10px] text-zinc-400 space-y-3.5 overflow-x-auto leading-relaxed">
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
          )}
          
        </div>
      </main>

      {/* Miniature Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-[10px] text-zinc-650">
        <span>© 2026 KYL Arena. Built by Know Your Limits Community.</span>
      </footer>

    </div>
  );
}
