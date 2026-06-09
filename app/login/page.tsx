"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Trophy, Flame, Shield, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "strava" | null>(null);

  const handleLogin = (provider: "google" | "strava") => {
    setLoadingProvider(provider);
    
    // Simulate API redirect latency
    setTimeout(() => {
      setLoadingProvider(null);
      alert(`Simulation: Redirecting to ${provider === "strava" ? "Strava OAuth Flow" : "Google Authentication"}...`);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-lime-400 selection:text-black overflow-hidden flex flex-col justify-between">
      
      {/* Background Radial & Grid Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-lime-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen w-full">
        
        {/* Left Side: Desktop-Only Premium Visual Panel */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative flex-col justify-between p-16 overflow-hidden border-r border-white/5">
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 opacity-90" />
          
          {/* Diagonal slash background highlight */}
          <div className="absolute -top-[40%] -right-[30%] w-[80%] h-[150%] bg-gradient-to-b from-lime-500/5 to-transparent rotate-12 transform blur-2xl pointer-events-none" />

          {/* Logo Area */}
          <Link href="/" className="relative z-10 flex items-center gap-3 group">
            <svg className="h-10 w-10 shrink-0 transition-transform duration-500 group-hover:rotate-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <span className="text-xl font-black tracking-wider text-white leading-none">
                KYL <span className="text-lime-400">ARENA</span>
              </span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                Know Your Limits
              </span>
            </div>
          </Link>

          {/* Epic Slogan / Large typography */}
          <div className="relative z-10 my-auto space-y-8 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lime-500/20 bg-lime-500/5 text-lime-400 text-xs font-semibold tracking-wide uppercase">
              <Trophy className="h-3.5 w-3.5" />
              Next-Gen Fitness Challenges
            </div>
            
            <h1 className="text-6xl xl:text-7xl font-black uppercase tracking-tighter leading-[0.95]">
              IRUNGA <br />
              <span className="text-lime-400">BHAI!</span>
            </h1>
            
            <p className="text-lg text-zinc-400 leading-relaxed font-medium">
              No manual spreadsheets. No tedious profile verification. Connect your fitness tracker and immediately jump into local and global challenges.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-lime-400 shrink-0">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white uppercase">Automated Sync</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Activities sync effortlessly from your Strava profile in real time.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-lime-400 shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white uppercase">Fair Competition</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Verification rules prevent duplicate or tampered activities.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Info */}
          <div className="relative z-10 flex justify-between items-center text-xs text-zinc-500">
            <span>© 2026 KYL Arena. All rights reserved.</span>
            <span>Built by Know Your Limits Community</span>
          </div>
        </div>

        {/* Right Side: Centered Mobile-First Login Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 md:p-16 relative">
          
          {/* Header Mobile / Navigation Row */}
          <div className="flex items-center justify-between w-full">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors group/back"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover/back:-translate-x-1" />
              Back
            </Link>

            {/* Mobile-only Header Logo */}
            <div className="flex lg:hidden items-center gap-2">
              <svg className="h-7 w-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g fill="#22c55e">
                  <circle cx="48" cy="20" r="7" />
                  <path d="M 28 69 C 14 78, 12 79, 10 80 C 15 78, 25 65, 32 50 C 37 40, 48 30, 60 22 C 60 23, 56 28, 48 35 C 42 42, 34 50, 28 69 Z" />
                </g>
                <g fill="#ef4444">
                  <circle cx="78" cy="32" r="7" />
                  <path d="M 46 48 C 58 40, 68 35, 75 42 Z" />
                </g>
                <g fill="#3b82f6">
                  <circle cx="53" cy="68" r="7" />
                  <path d="M 6 81 C 12 83, 25 75, 35 68 Z" />
                </g>
              </svg>
              <span className="text-sm font-black tracking-wider text-white">
                KYL <span className="text-lime-400">ARENA</span>
              </span>
            </div>
            
            <div className="w-12 h-1 lg:hidden" /> {/* Spacer to align elements */}
          </div>

          {/* Login Form Card Content */}
          <div className="my-auto w-full max-w-sm mx-auto space-y-8 py-8">
            
            {/* Title / Slogan block */}
            <div className="text-center space-y-3">
              <div className="text-xs font-black tracking-widest text-lime-400 uppercase select-none">
                KYL ARENA ONBOARDING
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                Enter the Arena
              </h2>
              <div className="text-xs font-bold tracking-tight text-zinc-300 uppercase select-none flex items-center justify-center gap-1.5">
                <span>Compete</span><span className="text-lime-400 font-extrabold">•</span>
                <span>Track</span><span className="text-lime-400 font-extrabold">•</span>
                <span>Conquer</span>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm mt-2">
                Connect your account to immediately unlock challenge stats, track progress and join active tournaments.
              </p>
            </div>

            {/* Authentication Buttons Card */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden group">
              {/* Highlight glowing border element */}
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/20 to-transparent" />
              
              <div className="space-y-4">
                
                {/* Strava Authentication Button (Primary CTA) */}
                <Button
                  onClick={() => handleLogin("strava")}
                  disabled={loadingProvider !== null}
                  className="w-full h-14 bg-[#FC6100] hover:bg-[#E55500] text-white font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(252,97,0,0.25)] hover:shadow-[0_6px_25px_rgba(252,97,0,0.35)] hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loadingProvider === "strava" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
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
                  className="w-full h-14 bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loadingProvider === "google" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
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

              {/* Motivational Footer Note */}
              <div className="mt-6 flex justify-center items-center gap-2 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
                Ready to sync cycling, running & walking
              </div>
            </div>

            {/* Terms and Privacy disclaimer */}
            <p className="text-[11px] text-zinc-500 text-center leading-relaxed max-w-[280px] mx-auto">
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
          <div className="flex flex-col items-center gap-2 lg:hidden text-[10px] text-zinc-650 mt-8 text-center">
            <span>© 2026 KYL Arena. Built by Know Your Limits Community.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
