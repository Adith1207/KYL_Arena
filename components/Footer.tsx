"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Flame, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 4000);
  };

  return (
    <footer id="footer" className="bg-zinc-950 border-t border-white/5 py-12 md:py-16">
      <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" direction="up">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-12 border-b border-white/5">
          
          {/* Brand & Mission */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-black">
                <Trophy className="h-4.5 w-4.5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                KYL <span className="text-lime-400">ARENA</span>
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Automated challenge manager for fitness communities. We believe organizers should motivate athletes, not manage spreadsheets.
            </p>
          </div>

          {/* Links column */}
          <div className="md:col-span-3 grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="#features" className="hover:text-lime-400 transition-colors">Features</Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-lime-400 transition-colors">How It Works</Link>
                </li>
                <li>
                  <Link href="#challenge-preview" className="hover:text-lime-400 transition-colors">Leaderboards</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Community</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="#about" className="hover:text-lime-400 transition-colors">About KYL</Link>
                </li>
                <li>
                  <span className="text-zinc-600 cursor-not-allowed">Official Strava Club 🔒</span>
                </li>
                <li>
                  <Link href="#contact" className="hover:text-lime-400 transition-colors">Contact Email</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Input */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Stay Updated</h4>
            <p className="text-xs text-zinc-400">Receive launch updates, feature releases, and challenge tips.</p>
            
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-sm">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 px-3 text-xs bg-zinc-900 border border-white/5 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500"
              />
              <Button
                type="submit"
                variant="default"
                size="sm"
                className="bg-lime-400 text-black hover:bg-lime-300 rounded-lg h-9 font-semibold text-xs shrink-0"
              >
                {submitted ? "Subscribed!" : "Subscribe"}
              </Button>
            </form>
          </div>

        </div>

        {/* Bottom copyright info */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex flex-col gap-1">
            <span>&copy; {new Date().getFullYear()} KYL Arena. Built for the Know Your Limits Community.</span>
            <span className="text-[10px] text-zinc-600">Designed & Developed by Adith Narayan G</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-lime-400" /> Version 1.0</span>
          </div>
        </div>

      </ScrollReveal>
    </footer>
  );
}
