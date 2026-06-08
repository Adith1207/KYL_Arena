"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            {/* Multi-color sports logo */}
            <svg className="h-8 w-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Blue element (runner arm/body) */}
              <path d="M40 20 C 50 15, 60 25, 50 35 C 45 40, 35 30, 40 20 Z" fill="#3b82f6" />
              {/* Green element (running leg) */}
              <path d="M25 45 C 35 35, 50 45, 45 60 C 40 70, 30 65, 25 45 Z" fill="#22c55e" />
              {/* Red element (torso/arm) */}
              <path d="M55 40 C 65 30, 75 40, 70 55 C 65 65, 55 55, 55 40 Z" fill="#ef4444" />
              {/* Yellow/Orange element (head/burst) */}
              <circle cx="50" cy="22" r="7" fill="#eab308" />
              {/* Dynamic athletic line */}
              <path d="M15 75 Q 50 45, 85 75" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider text-white leading-none">
                KYL <span className="text-lime-400">ARENA</span>
              </span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                Know Your Limits
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#"
              className="text-sm font-semibold text-white border-b-2 border-lime-400 pb-1 px-1 transition-all"
            >
              Home
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Challenges
            </Link>
            <Link
              href="#challenge-preview"
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="#features"
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              About Us
            </Link>
            <Link
              href="#footer"
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="default"
              size="lg"
              className="bg-lime-400 hover:bg-lime-300 text-black font-bold px-6 py-5 rounded-lg shadow-lg shadow-lime-400/25 transition-all text-xs uppercase tracking-wider"
              onClick={() => alert("Redirecting to active challenges!")}
            >
              Join Challenge
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-zinc-800 text-white hover:bg-zinc-900 rounded-lg px-6 py-5 text-xs uppercase tracking-wider font-bold"
              onClick={() => alert("Opening Login Dialog!")}
            >
              Login
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-white/5 bg-zinc-950 shadow-2xl animate-in slide-in-from-top-5 duration-200">
          <div className="space-y-1 px-4 py-4 pb-6">
            <Link
              href="#"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-semibold text-lime-400 bg-zinc-900"
            >
              Home
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              Challenges
            </Link>
            <Link
              href="#challenge-preview"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="#features"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              About Us
            </Link>
            <Link
              href="#footer"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              Contact
            </Link>
            <div className="mt-4 border-t border-white/5 pt-4 flex flex-col gap-3">
              <Button
                variant="default"
                size="lg"
                className="w-full bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-lg py-5 text-xs uppercase tracking-wider justify-center"
                onClick={() => {
                  setIsOpen(false);
                  alert("Redirecting to active challenges!");
                }}
              >
                Join Challenge
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full border-zinc-800 text-white hover:bg-zinc-900 rounded-lg py-5 text-xs uppercase tracking-wider font-bold justify-center"
                onClick={() => {
                  setIsOpen(false);
                  alert("Opening Login Dialog!");
                }}
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
