"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronLeft, ChevronRight, X, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  title: string;
  description: string;
  elementId: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  mobileTab?: "dashboard" | "challenges" | "leaderboard";
}

interface DashboardTourProps {
  isOpen: boolean;
  onClose: (completed: boolean) => void;
  activeTab: "dashboard" | "challenges" | "leaderboard";
  setActiveTab: (tab: "dashboard" | "challenges" | "leaderboard") => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Athlete Profile",
    description: "This is your credentials card. It tracks your current community rank and active synchronizations.",
    elementId: "tour-profile-section",
    position: "bottom",
    mobileTab: "dashboard",
  },
  {
    title: "Dashboard Hero",
    description: "The primary action hub. Use this to bind your Strava account, sync activities, and monitor your main goals.",
    elementId: "tour-hero-section",
    position: "bottom",
    mobileTab: "dashboard",
  },
  {
    title: "Performance Statistics",
    description: "Visualize details about your active streaks, distance milestones, elevation gains, and workout counts.",
    elementId: "tour-stats-section",
    position: "top",
    mobileTab: "dashboard",
  },
  {
    title: "Recent Activities",
    description: "Review your latest fitness activities synced directly from your connected fitness trackers.",
    elementId: "tour-activities-section",
    position: "top",
    mobileTab: "dashboard",
  },
  {
    title: "Challenge Area",
    description: "Join active community events, achieve targets, and lock in badges to verify your limits.",
    elementId: "tour-challenges-section",
    position: "left",
    mobileTab: "challenges",
  },
  {
    title: "Community Leaderboard",
    description: "Compare standings in real-time with other runners, riders, and walkers in the KYL network.",
    elementId: "tour-leaderboard-section",
    position: "left",
    mobileTab: "leaderboard",
  },
];

export default function DashboardTour({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
}: DashboardTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  
  const tooltipRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeStep = TOUR_STEPS[currentStepIndex];

  // Set client status to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync state settings on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setShowCompletion(false);
    }
  }, [isOpen]);

  // Adjust tabs on mobile dynamically based on current step target
  useEffect(() => {
    if (!isOpen || showCompletion) return;
    
    if (activeStep.mobileTab && activeStep.mobileTab !== activeTab) {
      setActiveTab(activeStep.mobileTab);
    }
  }, [currentStepIndex, isOpen, showCompletion, activeTab, activeStep.mobileTab, setActiveTab]);

  // Handle coordinates calculation & scrolling targeting dynamically in real-time
  useEffect(() => {
    if (!isOpen || showCompletion) return;

    const elementId = activeStep.elementId;
    const element = document.getElementById(elementId);
    
    // Smooth scroll the target element to the center
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const handleUpdate = () => {
      const el = document.getElementById(elementId);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
        }
      } else {
        setTargetRect(null);
      }
    };

    // Calculate instantly
    handleUpdate();

    // Re-verify on resize, scroll, and periodically as scroll settles
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, { passive: true });
    
    const interval = setInterval(handleUpdate, 100);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate);
      clearInterval(interval);
    };
  }, [currentStepIndex, activeTab, isOpen, showCompletion, activeStep.elementId]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCompletion) {
        if (e.key === "Enter" || e.key === "Escape") {
          onClose(true);
        }
        return;
      }

      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        onClose(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex, showCompletion]);

  if (!isClient || !isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setShowCompletion(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose(false);
  };

  const handleComplete = () => {
    onClose(true);
  };

  // Safe padding values around highlighted elements
  const padding = 10;
  
  // Cutout configuration values
  const cutoutX = targetRect ? targetRect.left - padding : 0;
  const cutoutY = targetRect ? targetRect.top - padding : 0;
  const cutoutW = targetRect ? targetRect.width + padding * 2 : 0;
  const cutoutH = targetRect ? targetRect.height + padding * 2 : 0;

  // Determine tooltip bubble position for Desktop view
  const getTooltipStyle = () => {
    if (!targetRect || !tooltipRef.current) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const gap = 16;
    const tooltipWidth = tooltipRef.current.offsetWidth || 340;
    const tooltipHeight = tooltipRef.current.offsetHeight || 180;
    
    let top = 0;
    let left = 0;

    switch (activeStep.position) {
      case "bottom":
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "top":
        top = targetRect.top - tooltipHeight - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - gap;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + gap;
        break;
      default:
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
    }

    // Adjust offsets to keep tooltip fully bounds-contained
    const paddingOffset = 16;
    left = Math.max(paddingOffset, Math.min(left, window.innerWidth - tooltipWidth - paddingOffset));
    top = Math.max(paddingOffset, Math.min(top, window.innerHeight - tooltipHeight - paddingOffset));

    return { top: `${top}px`, left: `${left}px` };
  };

  const currentProgressPercent = ((currentStepIndex + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {!showCompletion ? (
          <div key="tour-body" className="relative w-full h-full">
            {/* SVG Mask Backdrop Spotlight Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <mask id="tour-spotlight-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {targetRect && (
                    <motion.rect
                      initial={{
                        x: cutoutX,
                        y: cutoutY,
                        width: cutoutW,
                        height: cutoutH,
                      }}
                      animate={{
                        x: cutoutX,
                        y: cutoutY,
                        width: cutoutW,
                        height: cutoutH,
                      }}
                      transition={{ type: "spring", stiffness: 140, damping: 20 }}
                      rx="16"
                      ry="16"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(9, 9, 11, 0.82)"
                mask="url(#tour-spotlight-mask)"
                className="backdrop-blur-[2px] pointer-events-auto"
              />
            </svg>

            {/* Morphing Neon highlight border around target */}
            {targetRect && (
              <motion.div
                initial={{
                  x: cutoutX,
                  y: cutoutY,
                  width: cutoutW,
                  height: cutoutH,
                  opacity: 0,
                }}
                animate={{
                  x: cutoutX,
                  y: cutoutY,
                  width: cutoutW,
                  height: cutoutH,
                  opacity: 1,
                }}
                transition={{ type: "spring", stiffness: 140, damping: 20 }}
                className="fixed border-2 border-lime-400/80 rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(163,230,53,0.3),inset_0_0_15px_rgba(163,230,53,0.1)] z-50"
              />
            )}

            {/* Desktop Tooltip Card */}
            <div className="hidden md:block">
              {targetRect && (
                <div
                  ref={tooltipRef}
                  style={getTooltipStyle()}
                  className="fixed w-[350px] bg-zinc-950/90 border border-zinc-800 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.8),0_0_30px_rgba(163,230,53,0.06)] backdrop-blur-xl z-50 text-left space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black tracking-widest text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full uppercase">
                      Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                    </span>
                    <button
                      onClick={handleSkip}
                      className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black uppercase text-white tracking-tight flex items-center gap-1.5 italic">
                      <Sparkles className="h-3.5 w-3.5 text-lime-400 animate-pulse" />
                      {activeStep.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                      {activeStep.description}
                    </p>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="bg-lime-400 h-full transition-all duration-300"
                      style={{ width: `${currentProgressPercent}%` }}
                    />
                  </div>

                  {/* Footer buttons */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={handleSkip}
                      className="text-[10px] uppercase font-black text-zinc-500 hover:text-zinc-350 transition-colors cursor-pointer"
                    >
                      Skip Tour
                    </button>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handlePrev}
                        disabled={currentStepIndex === 0}
                        variant="outline"
                        className="h-8 px-2.5 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                        Back
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="h-8 px-3.5 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {currentStepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                        <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Sheet Card */}
            <div className="block md:hidden fixed bottom-16 left-4 right-4 z-50">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-zinc-950/95 border border-zinc-800 rounded-3xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.9)] backdrop-blur-xl text-left space-y-4"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[8.5px] font-black tracking-widest text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full uppercase">
                    Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                  </span>
                  <button
                    onClick={handleSkip}
                    className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-white tracking-tight flex items-center gap-1.5 italic">
                    <Sparkles className="h-3.5 w-3.5 text-lime-400" />
                    {activeStep.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {activeStep.description}
                  </p>
                </div>

                {/* Mobile Progress Bar */}
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-lime-400 h-full transition-all duration-300"
                    style={{ width: `${currentProgressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-1">
                  <button
                    onClick={handleSkip}
                    className="text-[9px] uppercase font-black text-zinc-500 hover:text-zinc-350 cursor-pointer"
                  >
                    Skip
                  </button>
                  <div className="flex gap-1.5">
                    <Button
                      onClick={handlePrev}
                      disabled={currentStepIndex === 0}
                      variant="outline"
                      className="h-7 px-2 border-zinc-800 text-zinc-400 rounded-md text-[9px] uppercase tracking-wider cursor-pointer"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="h-7 px-3 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-md text-[9px] uppercase tracking-wider cursor-pointer flex items-center gap-0.5"
                    >
                      {currentStepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Completion Splash Screen */
          <motion.div
            key="tour-completion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-md p-4"
          >
            {/* Ambient neon radial glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-lime-400/5 rounded-full blur-[90px] pointer-events-none animate-pulse" />

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="relative max-w-md w-full bg-zinc-900/40 border border-white/5 rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-center space-y-6 overflow-hidden"
            >
              {/* Highlight strip */}
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lime-400/40 to-transparent" />

              <div className="mx-auto h-16 w-16 rounded-full bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shadow-[0_0_24px_rgba(163,230,53,0.15)]">
                <Trophy className="h-8 w-8 animate-bounce" />
              </div>

              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider italic text-white flex items-center justify-center gap-1">
                  🏆 YOU ARE READY
                </h2>
                <div className="space-y-1 text-sm font-black uppercase text-zinc-400 font-mono tracking-widest text-center italic">
                  <p className="hover:text-white transition-colors">Connect.</p>
                  <p className="hover:text-lime-400 transition-colors">Compete.</p>
                  <p className="hover:text-white transition-colors">Push your limits.</p>
                </div>
                <p className="text-sm font-semibold text-lime-400 uppercase tracking-widest pt-2">
                  Welcome to KYL Arena.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleComplete}
                  className="w-full h-12 bg-lime-400 hover:bg-lime-500 text-black font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(163,230,53,0.25)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Enter the Arena
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
