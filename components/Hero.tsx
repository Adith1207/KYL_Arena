"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-start bg-[url('/hero_backdrop.png')] bg-cover bg-center pt-24 overflow-hidden">
      
      {/* Dark overlay with side-to-side gradient for typography readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full z-10 py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Tagline */}
            <div className="text-sm md:text-base font-black tracking-widest text-lime-400 uppercase">
              KYL 2026 IS BACK
            </div>

            {/* Massive Heading */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white uppercase leading-[0.95] select-none">
              IRUNGA <br className="hidden sm:inline" />
              BHAI!
            </h1>

            {/* Slogan with colored points */}
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Compete<span className="text-lime-400">.</span> Track<span className="text-lime-400">.</span> Conquer<span className="text-lime-400">.</span>
            </h2>

            {/* Description */}
            <p className="max-w-xl text-base sm:text-lg text-zinc-350 leading-relaxed font-medium">
              Automated challenge management for cycling, running and walking communities.
            </p>

            {/* Call To Actions */}
            <div className="flex flex-row items-center gap-4 pt-2">
              <Button
                variant="default"
                size="lg"
                className="bg-lime-400 hover:bg-lime-300 text-black font-extrabold rounded-lg h-12 px-6 flex items-center gap-2 text-xs uppercase tracking-wider transition-all hover:scale-102"
                onClick={() => alert("Redirecting to challenge registration!")}
              >
                Join Challenge
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 rounded-lg h-12 px-6 text-xs uppercase tracking-wider font-extrabold transition-all"
                onClick={() => {
                  const el = document.getElementById("challenge-preview");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View Leaderboard
              </Button>
            </div>

            {/* Social Proof Avatars */}
            <div className="flex items-center gap-4 pt-6">
              <div className="flex -space-x-2.5 overflow-hidden">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
                ].map((src, i) => (
                  <div key={i} className="relative inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 overflow-hidden bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt="Participant Avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-lime-400 uppercase tracking-wider">
                  500+ Athletes
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  Already Competing
                </span>
              </div>
            </div>

          </div>
          
          {/* Right Spacer (empty to let backdrop shine through) */}
          <div className="hidden lg:block lg:col-span-5 h-20" />

        </div>
      </div>

      {/* Decorative 2026 Stamp Seal bottom right */}
      <div className="absolute bottom-8 right-8 hidden md:block select-none pointer-events-none opacity-40">
        <div className="relative flex items-center justify-center w-28 h-28 border-2 border-dashed border-white/20 rounded-full animate-[spin_20s_linear_infinite]">
          <div className="absolute font-black tracking-widest text-[10px] text-white">
            KYL ARENA • 2026 •
          </div>
        </div>
      </div>

      {/* Bounce Down Chevron Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer"
           onClick={() => {
             const el = document.getElementById("features");
             if (el) el.scrollIntoView({ behavior: "smooth" });
           }}>
        <ChevronDown className="h-5 w-5 text-zinc-500 animate-bounce" />
      </div>

    </section>
  );
}
