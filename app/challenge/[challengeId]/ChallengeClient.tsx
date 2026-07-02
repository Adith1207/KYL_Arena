"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Users, Calendar, ArrowLeft, Loader2, CheckCircle, 
  Bike, Flame, Footprints, Clock, Award, Shield, AlertTriangle, 
  Check, Sparkles, AlertCircle, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  name: string | null;
  avatar: string | null;
  strava_connected: boolean;
}

interface LeaderboardItem {
  userId: string;
  name: string;
  avatar: string;
  completed: number;
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
  status: string;
  userJoined: boolean;
  participantsCount: number;
  userRank: number | null;
  userProgress: number;
  leaderboard: LeaderboardItem[];
}

interface ChallengeClientProps {
  profile: Profile;
  challenge: Challenge;
}

export default function ChallengeClient({ profile, challenge }: ChallengeClientProps) {
  const router = useRouter();

  // Loading and action state
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [justJoined, setJustJoined] = useState(challenge.userJoined);

  // Toast notifications state
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; type: "success" | "error" | "info" | "warning" }[]>([]);
  const addNotification = (title: string, message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleJoinChallenge = async () => {
    if (loadingJoin || justJoined) return;

    if (!profile.strava_connected) {
      addNotification(
        "Strava Required", 
        "Please connect your Strava account in your profile/dashboard first to participate in challenges.", 
        "warning"
      );
      return;
    }

    setLoadingJoin(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: challenge.id,
          user_id: profile.id
        });

      if (error) {
        addNotification("Enrollment Failed", `Failed to join challenge: ${error.message}`, "error");
        return;
      }

      setJustJoined(true);
      addNotification(
        "Joined Challenge", 
        `You have successfully enrolled in the "${challenge.title}" challenge!`, 
        "success"
      );

      // Refresh to fetch updated server metrics
      setTimeout(() => {
        router.refresh();
      }, 1000);

    } catch (e: any) {
      console.error("Error joining challenge:", e);
      addNotification("Enrollment Error", e.message || "An unexpected error occurred.", "error");
    } finally {
      setLoadingJoin(false);
    }
  };

  const unit = challenge.goalType === "Distance" ? "km" : challenge.goalType === "Elevation" ? "m" : "hrs";
  const defaultBanner = "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80";

  // Calculate user progress percentage
  const pct = Math.min(100, Math.round((challenge.userProgress / challenge.goalTarget) * 100));

  const isRide = challenge.sportType === "Ride";
  const isRun = challenge.sportType === "Run";
  const isWalk = challenge.sportType === "Walk";

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-lime-400 selection:text-black overflow-x-hidden font-sans">
      
      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className="pointer-events-auto flex gap-3 p-4 bg-zinc-900/95 border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md items-start text-left"
            >
              {n.type === "success" && <CheckCircle className="h-5 w-5 text-lime-400 shrink-0 mt-0.5" />}
              {n.type === "error" && <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
              {n.type === "info" && <Sparkles className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />}
              {n.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase text-white tracking-wide">{n.title}</p>
                <p className="text-[10px] text-zinc-400 mt-1 leading-normal font-medium">{n.message}</p>
              </div>
              <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-zinc-550 hover:text-white shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Background Radial Overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-lime-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10 text-left">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 group">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> 
            Back to Dashboard
          </Link>
        </div>

        {/* HERO BANNER CARD */}
        <div className="relative rounded-3xl bg-zinc-900/30 border border-white/5 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={challenge.bannerUrl || defaultBanner} 
              alt={challenge.title} 
              className="w-full h-48 sm:h-64 object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
          </div>

          <div className="relative p-6 sm:p-8 pt-20 sm:pt-32 space-y-3">
            <div className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
              isRide ? "border-lime-400/20 bg-lime-400/5 text-lime-400" :
              isRun ? "border-red-400/20 bg-red-400/5 text-red-400" :
              "border-blue-400/20 bg-blue-400/5 text-blue-400"
            }`}>
              {isRide ? <Bike className="h-3 w-3 shrink-0" /> : 
               isRun ? <Flame className="h-3 w-3 shrink-0" /> :
               <Footprints className="h-3 w-3 shrink-0" />} {challenge.sportType} Challenge
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight italic text-white leading-tight">
              {challenge.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-400 font-mono font-bold uppercase">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-zinc-550" />
                {challenge.participantsCount} Enrolled Athletes
              </span>
              <span className="text-zinc-700">•</span>
              <span>Organized by KYL Arena</span>
            </div>
          </div>
        </div>

        {/* METRICS & STANDINGS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* LEFT: Challenge details details */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Overview Card */}
            <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6 space-y-4">
              <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono pb-2 border-b border-white/5">Challenge Overview</h3>
              <p className="text-sm text-zinc-350 leading-relaxed font-medium">
                {challenge.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-2 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-550">Start Date</span>
                  <span className="block font-bold text-white uppercase">{new Date(challenge.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-550">End Date</span>
                  <span className="block font-bold text-white uppercase">{new Date(challenge.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-550">Goal Target</span>
                  <span className="block font-bold text-lime-400">{challenge.goalTarget} {unit}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-550">Activity type</span>
                  <span className="block font-bold text-white uppercase">{challenge.sportType} ONLY</span>
                </div>
              </div>
            </div>

            {/* Rules Card */}
            <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6 space-y-3">
              <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono pb-2 border-b border-white/5">Competition Rules</h3>
              <ul className="space-y-2.5 text-xs text-zinc-400 font-medium">
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-lime-400 shrink-0 mt-0.5" />
                  <span>Only activities imported directly from connected Strava profiles will be counted.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-lime-400 shrink-0 mt-0.5" />
                  <span>Workouts must occur between the active start and end dates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-lime-400 shrink-0 mt-0.5" />
                  <span>Manual edits, duplicate uploads, or telemetry flagged as helper-motor assisted will be automatically rejected.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-lime-400 shrink-0 mt-0.5" />
                  <span>Distance, time, or elevation are accumulated incrementally across all valid workouts.</span>
                </li>
              </ul>
            </div>

            {/* Reward Preview badge */}
            <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6 flex items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono">Completion Reward</h3>
                <p className="text-xs text-zinc-400 font-medium leading-normal">Conquer the target metric and unlock the digital medal on your athlete dashboard profile!</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0 shadow-[0_0_15px_rgba(163,230,53,0.1)]">
                <Award className="h-6 w-6" />
              </div>
            </div>

          </div>

          {/* RIGHT: Standings & Leaderboard Preview */}
          <div className="md:col-span-5 space-y-6">
            
            {/* User Enrollment Progress (if joined) */}
            {justJoined && (
              <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6 space-y-4">
                <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono pb-2 border-b border-white/5">Your Performance</h3>
                
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <span className="text-zinc-400">Progress: <strong className="text-white font-black">{challenge.userProgress}</strong> / {challenge.goalTarget} {unit}</span>
                    <span className="text-lime-400 font-black">{pct}%</span>
                  </div>
                  
                  {/* Progress Line */}
                  <div className="w-full h-2 bg-zinc-950 border border-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-lime-400 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-mono pt-1 text-zinc-400">
                  <span>Current Standings:</span>
                  <span className="font-extrabold text-white uppercase tracking-wider">
                    {challenge.userRank ? `Rank #${challenge.userRank}` : "Unranked"}
                  </span>
                </div>
              </div>
            )}

            {/* Leaderboard Standings Card */}
            <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6 space-y-4">
              <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono pb-2 border-b border-white/5">Leaderboard Standing</h3>
              
              {challenge.leaderboard.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 font-mono text-xs">
                  No standings compiled yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {challenge.leaderboard.map((item, idx) => (
                    <div 
                      key={item.userId} 
                      className={`flex items-center justify-between p-2.5 rounded-xl border ${
                        item.userId === profile.id 
                          ? "bg-lime-400/5 border-lime-400/20" 
                          : "bg-zinc-950/20 border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <div className={`h-5 w-5 rounded-md text-[9px] font-mono font-black flex items-center justify-center border shrink-0 ${
                          idx === 0 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          idx === 1 ? "bg-zinc-300/10 text-zinc-300 border-zinc-300/20" :
                          idx === 2 ? "bg-amber-800/10 text-amber-800 border-amber-800/20" :
                          "bg-zinc-900 text-zinc-500 border-white/5"
                        }`}>
                          {idx + 1}
                        </div>

                        {/* Avatar */}
                        {item.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.avatar} alt={item.name} className="h-6 w-6 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-zinc-800 text-[8px] font-black flex items-center justify-center text-lime-450 shrink-0">
                            {item.name.substring(0,2).toUpperCase()}
                          </div>
                        )}

                        <span className="text-xs font-bold text-white truncate max-w-[100px]">{item.name}</span>
                      </div>

                      <span className="text-[10px] font-mono text-zinc-400 font-bold shrink-0">
                        {item.completed} {unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* BOTTOM ACTION - JOIN CHALLENGE CTA */}
        <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-[0_-8px_32px_rgba(0,0,0,0.3)]">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-mono">
            {justJoined ? "Challenge Enrollment Verified" : "Ready to prove your limits?"}
          </h3>
          <p className="text-xs text-zinc-550 leading-relaxed max-w-lg mx-auto">
            {justJoined 
              ? "Your progress is tracked automatically in real time. Work out and sync your Strava activities weekly to update your standing."
              : "Connecting and joining allows the leaderboard processor to sync distance, duration, or elevation from your workouts. Sign up below."
            }
          </p>

          <div className="max-w-xs mx-auto pt-2">
            <Button
              onClick={handleJoinChallenge}
              disabled={loadingJoin || justJoined}
              className={`w-full h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                justJoined
                  ? "bg-lime-400/10 text-lime-400 border border-lime-400/20 cursor-default shadow-none"
                  : "bg-lime-400 hover:bg-lime-500 text-black hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-[0_4px_20px_rgba(163,230,53,0.2)]"
              }`}
            >
              {loadingJoin ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining Challenge...
                </>
              ) : justJoined ? (
                <>
                  <Check className="h-4 w-4" />
                  Joined ✓
                </>
              ) : (
                "Join Challenge"
              )}
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
}
