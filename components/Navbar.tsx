"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

const navLinks = [
  { href: "#home", label: "Home", id: "home" },
  { href: "#how-it-works", label: "Challenges", id: "how-it-works" },
  { href: "#challenge-preview", label: "Leaderboard", id: "challenge-preview" },
  { href: "#about", label: "About Us", id: "about" },
  { href: "#contact", label: "Contact", id: "contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Scroll Spy logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map((link) => document.getElementById(link.id));
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      let currentActive = "home";
      for (const section of sections) {
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentActive = section.id;
          }
        }
      }
      setActiveSection(currentActive);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo & Subtitle */}
          <Link href="#home" className="flex items-center gap-3">
            {/* Multi-color sports logo */}
            <svg className="h-10 w-10 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g fill="#22c55e">
                <circle cx="48" cy="20" r="7" />
                <path d="M 28 69 C 14 78, 12 79, 10 80 C 15 78, 25 65, 32 50 C 37 40, 48 30, 60 22 C 60 23, 56 28, 48 35 C 42 42, 34 50, 28 69 Z" />
                <path d="M 33 48 C 30 35, 27 25, 24 20 C 24 23, 27 34, 33 48 Z" />
                <path d="M 48 35 C 54 30, 58 29, 61 28 C 58 31, 52 35, 48 35 Z" />
              </g>
              <g fill="#ef4444">
                <circle cx="78" cy="32" r="7" />
                <path d="M 46 48 C 58 40, 68 35, 75 42 C 68 49, 58 55, 50 58 C 55 52, 65 48, 72 45 C 65 42, 58 44, 46 48 Z" />
                <path d="M 70 58 C 76 50, 85 52, 92 48 C 92 60, 82 72, 70 72 C 62 72, 65 60, 70 58 Z" stroke="#ef4444" strokeWidth="3" fill="none" />
              </g>
              <g fill="#3b82f6">
                <circle cx="53" cy="68" r="7" />
                <path d="M 6 81 C 12 83, 25 75, 35 68 C 45 61, 58 58, 68 62 C 60 62, 52 64, 42 70 C 32 76, 18 83, 6 81 Z" />
                <path d="M 35 68 C 45 61, 58 58, 68 62 C 63 65, 55 70, 53 72 C 45 78, 30 83, 10 83 C 25 81, 32 74, 35 68 Z" />
              </g>
            </svg>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider text-white leading-none">
                KYL <span className="text-lime-400">ARENA</span>
              </span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                Know Your Limits
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="relative text-sm font-semibold transition-colors py-1"
                onClick={() => setActiveSection(link.id)}
              >
                <span className={activeSection === link.id ? "text-white" : "text-zinc-400 hover:text-white"}>
                  {link.label}
                </span>
                {activeSection === link.id && (
                  <motion.div
                    layoutId="active-nav-underline"
                    className="absolute left-0 right-0 -bottom-1 h-[2px] bg-lime-400"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="default"
              size="lg"
              className="bg-lime-400 hover:bg-lime-300 text-black font-bold px-6 py-5 rounded-lg shadow-lg shadow-lime-400/25 transition-all text-xs uppercase tracking-wider cursor-pointer"
              asChild
            >
              <Link href="/login">Join Challenge</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-zinc-800 text-white hover:bg-zinc-900 rounded-lg px-6 py-5 text-xs uppercase tracking-wider font-bold cursor-pointer"
              asChild
            >
              <Link href="/login">Login</Link>
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
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                onClick={() => {
                  setIsOpen(false);
                  setActiveSection(link.id);
                }}
                className={`block rounded-md px-3 py-2 text-base font-semibold transition-colors ${
                  activeSection === link.id
                    ? "text-lime-400 bg-zinc-900"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 border-t border-white/5 pt-4 flex flex-col gap-3">
              <Button
                variant="default"
                size="lg"
                className="w-full bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-lg py-5 text-xs uppercase tracking-wider justify-center cursor-pointer"
                asChild
              >
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  Join Challenge
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full border-zinc-800 text-white hover:bg-zinc-900 rounded-lg py-5 text-xs uppercase tracking-wider font-bold justify-center cursor-pointer"
                asChild
              >
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
