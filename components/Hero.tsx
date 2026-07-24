"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { createClient } from "@/lib/supabase/client";

interface HeroProps {
  initialProfileCount: number;
  activeChallenge: any | null;
}

export default function Hero({ initialProfileCount, activeChallenge }: HeroProps) {
  const [profileCount, setProfileCount] = useState(initialProfileCount);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to new profiles to update count in realtime
    const channel = supabase
      .channel("public:profiles")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        () => {
          setProfileCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "profiles" },
        () => {
          setProfileCount((prev) => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const buttonText = activeChallenge ? `Join ${activeChallenge.title}` : "No Active Challenge";
  const buttonHref = activeChallenge ? `/challenge/${activeChallenge.slug || activeChallenge.id}` : "#"; // Or just /login as it was

  return (
    <section id="home" className="relative min-h-[90vh] md:min-h-screen flex items-center justify-start bg-[url('/hero_backdrop.png')] bg-cover bg-center pt-24 overflow-hidden">
      
      {/* Dark overlay with side-to-side gradient for typography readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full z-10 py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Tagline */}
            <ScrollReveal delayMs={100} durationMs={800} direction="up">
              <div className="text-sm md:text-base font-black tracking-widest text-lime-400 uppercase">
                KYL 2026 IS BACK
              </div>
            </ScrollReveal>

            {/* Massive Heading */}
            <ScrollReveal delayMs={200} durationMs={900} direction="up">
              <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white uppercase leading-[0.95] select-none">
                IRUNGA <br className="hidden sm:inline" />
                BHAI!
              </h1>
            </ScrollReveal>

            {/* Slogan with colored points */}
            <ScrollReveal delayMs={300} durationMs={800} direction="up">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Compete<span className="text-lime-400">.</span> Track<span className="text-lime-400">.</span> Conquer<span className="text-lime-400">.</span>
              </h2>
            </ScrollReveal>

            {/* Description */}
            <ScrollReveal delayMs={400} durationMs={800} direction="up">
              <p className="max-w-xl text-base sm:text-lg text-zinc-350 leading-relaxed font-medium">
                Automated challenge management for cycling, running and walking communities.
              </p>
            </ScrollReveal>

            {/* Call To Actions */}
            <ScrollReveal delayMs={500} durationMs={800} direction="up">
              <div className="flex flex-row items-center gap-4 pt-2">
                <Button
                  variant="default"
                  size="lg"
                  disabled={!activeChallenge}
                  className="bg-lime-400 hover:bg-lime-300 text-black font-extrabold rounded-lg h-12 px-6 flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-wider transition-all hover:scale-102 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  asChild={!!activeChallenge}
                >
                  {activeChallenge ? (
                    <Link href="/login">
                      <span className="truncate max-w-[150px] sm:max-w-xs">{buttonText}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  ) : (
                    <span className="truncate">{buttonText}</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10 rounded-lg h-12 px-6 text-xs uppercase tracking-wider font-extrabold transition-all shrink-0 cursor-pointer"
                  onClick={() => {
                    const el = document.getElementById("challenge-preview");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  View Leaderboard
                </Button>
              </div>
            </ScrollReveal>

            {/* Social Proof Avatars */}
            <ScrollReveal delayMs={600} durationMs={800} direction="up">
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
                    {profileCount} Athletes
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Already Competing
                  </span>
                </div>
              </div>
            </ScrollReveal>

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
