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
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-lime-400 transition-colors flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                    GitHub
                  </a>
                </li>
                <li>
                  <span className="text-zinc-600 cursor-not-allowed">Strava Club 🔒</span>
                </li>
                <li>
                  <span className="text-zinc-600 cursor-not-allowed">Discord 🔒</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Input */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Stay Updated</h4>
            <p className="text-xs text-zinc-400">Receive launch updates, Sprints releases, and challenge tips.</p>
            
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
          <div>
            &copy; {new Date().getFullYear()} KYL Arena. Built by the Know Your Limits Community.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-lime-400" /> Version 1.0</span>
            <span className="flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5" /> Strava Developer Sandbox</span>
          </div>
        </div>

      </ScrollReveal>
    </footer>
  );
}
