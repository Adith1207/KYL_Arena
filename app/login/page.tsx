"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Trophy, Flame, Shield, Activity } from "lucide-react";

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "strava" | null>(null);

  const handleLogin = async (provider: "google" | "strava") => {
    setLoadingProvider(provider);
    
    if (provider === "strava") {
      window.location.href = "/api/strava/connect";
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      
      if (error) {
        alert(`Authentication Error: ${error.message}`);
        setLoadingProvider(null);
      }
    } catch (e) {
      alert("Failed to initialize authentication.");
      setLoadingProvider(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-lime-400 selection:text-black overflow-hidden flex flex-col justify-between">
      
      {/* Background Radial Ambient Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-lime-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse duration-[10000ms]" />

      {/* Main Responsive Container */}
      <div className="relative z-10 flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-screen w-full">
        
        {/* Left/Top Panel: Cinematic Visual Panel */}
        <div className="relative flex flex-col justify-between p-6 sm:p-10 lg:p-16 h-[38vh] lg:h-auto lg:col-span-6 xl:col-span-7 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
          
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 bg-[url('/login_sports_backdrop.png')] bg-cover bg-center transition-transform duration-[20000ms] hover:scale-105" />
          
          {/* Black-to-Green Gradient Overlay for premium Nike/Strava look and high readability */}
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/80 to-lime-950/40 opacity-90 lg:opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent lg:hidden" />

          {/* Logo Area */}
          <Link href="/" className="relative z-10 flex items-center gap-3 group self-start">
            <svg className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 transition-transform duration-500 group-hover:rotate-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Green Runner */}
              <g fill="#22c55e">
                <circle cx="48" cy="20" r="7" />
                <path d="M 28 69 C 14 78, 12 79, 10 80 C 15 78, 25 65, 32 50 C 37 40, 48 30, 60 22 C 60 23, 56 28, 48 35 C 42 42, 34 50, 28 69 Z" />
                <path d="M 33 48 C 30 35, 27 25, 24 20 C 24 23, 27 34, 33 48 Z" />
                <path d="M 48 35 C 54 30, 58 29, 61 28 C 58 31, 52 35, 48 35 Z" />
              </g>
              {/* Red Cyclist */}
              <g fill="#ef4444">
                <circle cx="78" cy="32" r="7" />
                <path d="M 46 48 C 58 40, 68 35, 75 42 C 68 49, 58 55, 50 58 C 55 52, 65 48, 72 45 C 65 42, 58 44, 46 48 Z" />
                <path d="M 70 58 C 76 50, 85 52, 92 48 C 92 60, 82 72, 70 72 C 62 72, 65 60, 70 58 Z" stroke="#ef4444" strokeWidth="3" fill="none" />
              </g>
              {/* Blue Swimmer */}
              <g fill="#3b82f6">
                <circle cx="53" cy="68" r="7" />
                <path d="M 6 81 C 12 83, 25 75, 35 68 C 45 61, 58 58, 68 62 C 60 62, 52 64, 42 70 C 32 76, 18 83, 6 81 Z" />
                <path d="M 35 68 C 45 61, 58 58, 68 62 C 63 65, 55 70, 53 72 C 45 78, 30 83, 10 83 C 25 81, 32 74, 35 68 Z" />
              </g>
            </svg>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl font-black tracking-wider text-white leading-none">
                KYL <span className="text-lime-400">ARENA</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5 sm:mt-1">
                Know Your Limits
              </span>
            </div>
          </Link>

          {/* Slogan / Large typography */}
          <div className="relative z-10 my-auto space-y-3 lg:space-y-6 max-w-lg mt-auto lg:mt-auto">
            
            {/* Desktop Only Badges */}
            <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lime-500/20 bg-lime-500/5 text-lime-400 text-xs font-semibold tracking-wide uppercase">
              <Trophy className="h-3.5 w-3.5" />
              Next-Gen Fitness Challenges
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-black uppercase tracking-tighter leading-[0.9] italic select-none">
                ENTER THE <br className="hidden lg:inline" />
                <span className="text-lime-400 not-italic">ARENA</span>
              </h1>
              
              <div className="text-xs sm:text-sm lg:text-xl font-bold tracking-wider text-zinc-300 uppercase flex items-center gap-2">
                <span>Compete</span>
                <span className="text-lime-400 font-extrabold">•</span>
                <span>Track</span>
                <span className="text-lime-400 font-extrabold">•</span>
                <span>Conquer</span>
              </div>
            </div>
            
            <p className="hidden lg:block text-base text-zinc-400 leading-relaxed font-medium">
              No manual spreadsheets. No tedious profile verification. Connect your fitness tracker and immediately jump into local and global challenges.
            </p>

            {/* Desktop Features */}
            <div className="hidden lg:grid grid-cols-2 gap-6 pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900/80 border border-white/5 text-lime-400 shrink-0">
                  <Flame className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Automated Sync</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Activities sync effortlessly from your Strava profile in real time.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900/80 border border-white/5 text-lime-400 shrink-0">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Fair Competition</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Verification rules prevent duplicate or tampered activities.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Info (Desktop only) */}
          <div className="relative z-10 hidden lg:flex justify-between items-center text-xs text-zinc-650">
            <span>© 2026 KYL Arena. All rights reserved.</span>
            <span>Built by Know Your Limits Community</span>
          </div>
        </div>

        {/* Right Panel: Login card container */}
        <div className="flex-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-16 relative min-h-[62vh] lg:min-h-0 overflow-y-auto">
          
          {/* Subtle topogeographical contour map vector backdrop */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04] text-lime-500 select-none overflow-hidden">
            <svg className="w-full h-full object-cover" viewBox="0 0 800 800" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
              {/* Contour lines loop A */}
              <path d="M100 250 C 150 200, 250 180, 300 240 C 350 300, 300 400, 250 450 C 200 500, 100 480, 80 400 C 60 320, 50 300, 100 250 Z" />
              <path d="M120 270 C 160 230, 230 210, 270 260 C 310 310, 280 380, 230 420 C 180 460, 120 440, 100 380 C 80 320, 80 310, 120 270 Z" strokeDasharray="3 3" />
              <path d="M140 290 C 170 260, 210 240, 240 280 C 270 320, 250 360, 210 390 C 170 420, 130 400, 120 360 C 110 320, 110 320, 140 290 Z" />
              
              {/* Contour lines loop B */}
              <path d="M500 550 C 580 500, 680 520, 720 580 C 760 640, 700 720, 640 740 C 580 760, 480 720, 460 660 C 440 600, 420 600, 500 550 Z" />
              <path d="M520 570 C 590 530, 660 540, 690 590 C 720 640, 680 700, 630 710 C 580 720, 500 690, 480 640 C 460 590, 450 610, 520 570 Z" strokeDasharray="4 2" />
              
              {/* Tactical network traces */}
              <path d="M 50 120 L 250 140 L 320 70 L 500 170 L 620 110 L 750 200" strokeDasharray="6 6" />
              <circle cx="250" cy="140" r="4" fill="currentColor" />
              <circle cx="500" cy="170" r="4" fill="currentColor" />
              <circle cx="750" cy="200" r="4" fill="currentColor" />
            </svg>
          </div>

          {/* Navigation link / back button */}
          <div className="relative z-10 flex items-center justify-between w-full">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors group/back"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover/back:-translate-x-0.5" />
              Back
            </Link>
            
            {/* Active Status Header */}
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-ping" />
              Live Leaderboard Sync
            </div>
          </div>

          {/* Center Content: Login Form Card */}
          <div className="my-auto w-full max-w-sm mx-auto space-y-6 py-6 relative z-10">
            
            {/* Title block */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-lime-400 uppercase select-none border border-lime-400/20 px-2.5 py-0.5 rounded-md bg-lime-400/5">
                <Activity className="h-3 w-3" /> Athlete Portal
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white italic">
                Step into the Arena
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Unlock automated challenge verification, global statistics, and climb community rankings.
              </p>
            </div>

            {/* Authentication Glass Card */}
            <div className="bg-zinc-900/35 backdrop-blur-lg border border-white/5 rounded-2xl p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              
              {/* Subtle top card glow line */}
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/25 to-transparent" />
              
              {/* Background card pulse blob */}
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-lime-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-lime-400/10 transition-all duration-500" />
              
              <div className="space-y-3.5 relative z-10">
                
                {/* Strava Authentication Button (Primary CTA) */}
                <Button
                  onClick={() => handleLogin("strava")}
                  disabled={loadingProvider !== null}
                  className="w-full h-14 bg-[#FC6100] hover:bg-[#E55500] text-white font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(252,97,0,0.2)] hover:shadow-[0_6px_22px_rgba(252,97,0,0.35)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {loadingProvider === "strava" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting Strava...
                    </>
                  ) : (
                    <>
                      {/* Strava SVG Icon */}
                      <svg className="h-5 w-5 fill-white shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l-2.836 5.637h4.372l1.548-3.087 1.546 3.087h4.373L13.626 2.52l-5.247 9.825" />
                      </svg>
                      Continue with Strava
                    </>
                  )}
                </Button>

                {/* Google Authentication Button */}
                <Button
                  onClick={() => handleLogin("google")}
                  disabled={loadingProvider !== null}
                  variant="outline"
                  className="w-full h-14 bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {loadingProvider === "google" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting Google...
                    </>
                  ) : (
                    <>
                      {/* Google SVG Icon */}
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fill="#EA4335"
                          d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.63 15.02 1 12 1 7.35 1 3.39 3.67 1.41 7.56l3.89 3.02C6.22 7.56 8.87 5.04 12 5.04z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.74-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.02 3.67-8.64z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.3 14.42c-.25-.73-.39-1.5-.39-2.3s.14-1.57.39-2.3L1.41 6.8c-.83 1.66-1.3 3.53-1.3 5.5s.47 3.84 1.3 5.5l3.89-2.88z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.24 0 5.97-1.09 7.96-2.96l-3.76-2.91c-1.11.75-2.53 1.21-4.2 1.21-3.13 0-5.78-2.52-6.7-5.54L1.41 15.68C3.39 19.57 7.35 23 12 23z"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>

              </div>

              {/* Motivational message */}
              <div className="mt-5 text-center text-[9px] uppercase font-bold text-zinc-500 tracking-widest flex items-center justify-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-lime-400 animate-ping" />
                Cycling • Running • Walking Verified
              </div>
            </div>

            {/* Terms and Privacy disclaimer */}
            <p className="text-[10px] sm:text-[11px] text-zinc-500 text-center leading-relaxed max-w-[270px] mx-auto">
              By connecting your profile, you agree to the KYL Arena{" "}
              <Link href="#" className="underline text-zinc-400 hover:text-white transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline text-zinc-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* Footer Mobile View */}
          <div className="flex flex-col items-center gap-1.5 lg:hidden text-[9px] text-zinc-600 mt-4 text-center relative z-10">
            <span>© 2026 KYL Arena. Built by Know Your Limits Community.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
