"use client";

import ScrollReveal from "@/components/ScrollReveal";
import { ShieldCheck, Activity, Users, Zap } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="py-24 bg-zinc-950 border-t border-white/5 scroll-mt-16 overflow-hidden relative">
      {/* Background flare */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-lime-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">
            <ScrollReveal direction="left">
              <h2 className="text-xs font-black text-lime-400 uppercase tracking-widest mb-4">
                Our Story
              </h2>
              <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Built for the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Know Your Limits</span> <br />
                Community.
              </h3>
            </ScrollReveal>

            <ScrollReveal direction="left" delayMs={100}>
              <p className="text-base text-zinc-400 leading-relaxed font-medium">
                Managing a fitness community shouldn't involve spreadsheets, manual verification, and constant refreshing. We built KYL Arena to completely automate challenge management so organizers can focus on what matters most: <span className="text-white font-bold">motivating athletes.</span>
              </p>
            </ScrollReveal>

            <ScrollReveal direction="left" delayMs={200}>
              <p className="text-base text-zinc-400 leading-relaxed font-medium">
                Through deep Strava integration, we ensure fair competition, real-time leaderboards, and a premium experience for every runner, cyclist, and walker pushing their limits.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <Zap className="h-5 w-5 text-lime-400" />, title: "Full Automation", desc: "No manual syncs." },
              { icon: <ShieldCheck className="h-5 w-5 text-lime-400" />, title: "Fair Competition", desc: "Validated activities." },
              { icon: <Activity className="h-5 w-5 text-lime-400" />, title: "Strava Sync", desc: "Seamless integration." },
              { icon: <Users className="h-5 w-5 text-lime-400" />, title: "Community First", desc: "Built for teams." },
            ].map((feature, idx) => (
              <ScrollReveal key={idx} direction="up" delayMs={300 + idx * 100} zoom>
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 hover:bg-zinc-900/50 transition-colors">
                  <div className="h-10 w-10 bg-lime-400/10 rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{feature.title}</h4>
                  <p className="text-xs text-zinc-500">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
