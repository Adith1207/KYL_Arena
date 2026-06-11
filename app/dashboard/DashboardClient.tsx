"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Activity, AlertTriangle, CheckCircle, ShieldAlert, Award, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  id: string;
  email: string;
  name: string;
  avatar: string;
  auth_provider: string;
  strava_connected: boolean;
  strava_athlete_id: string | null;
  strava_connection?: {
    athlete_name: string | null;
    athlete_username: string | null;
    athlete_avatar: string | null;
  } | null;
}

interface DashboardClientProps {
  initialProfile: ProfileData;
}

export default function DashboardClient({ initialProfile }: DashboardClientProps) {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingDisconnect, setLoadingDisconnect] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);

  const handleLogout = async () => {
    setLoadingLogout(true);
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  const handleConnectStrava = async () => {
    setLoadingConnect(true);

    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const isStravaMock = 
      !clientId || 
      clientId.includes("placeholder");

    const callbackUrl = `${window.location.origin}/api/strava/callback`;

    if (isStravaMock) {
      // Redirect to server-side mock callback to insert DB connection & update state
      window.location.href = `${callbackUrl}?code=mock_code&state=${profile.id}&mock=true`;
    } else {
      // Live Strava OAuth Authorization Redirect
      window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=read,activity:read_all&state=${profile.id}`;
    }
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
      } else {
        const data = await res.json();
        alert(`Failed to disconnect: ${data.error || "Unknown error"}`);
      }
    } catch (e) {
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
                    
                    <div className="text-[10px] text-zinc-500 flex items-center justify-between gap-1.5 bg-zinc-950/20 px-2.5 py-1.5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold uppercase text-zinc-400">Athlete ID:</span>
                        <code className="font-mono text-emerald-400/80">{profile.strava_athlete_id}</code>
                      </div>
                      
                      <Button
                        onClick={handleDisconnectStrava}
                        disabled={loadingDisconnect}
                        variant="ghost"
                        className="h-6 px-2 text-[9px] font-black uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded border border-red-500/10 cursor-pointer"
                      >
                        {loadingDisconnect ? "Disconnecting..." : "Disconnect"}
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
          
        </div>
      </main>

      {/* Miniature Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-[10px] text-zinc-650">
        <span>© 2026 KYL Arena. Built by Know Your Limits Community.</span>
      </footer>

    </div>
  );
}
