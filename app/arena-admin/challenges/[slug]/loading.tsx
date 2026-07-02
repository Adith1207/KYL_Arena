"use client";

import React from "react";
import { SkeletonChallengeInspector, SkeletonLeaderboard } from "@/components/SkeletonLoaders";

export default function AdminChallengeInsightsLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-5 w-24 bg-zinc-800/60 rounded animate-pulse" />
          <span className="text-zinc-700">|</span>
          <div className="h-4 w-16 bg-zinc-800/60 rounded animate-pulse" />
        </div>
        <div className="h-8 w-8 rounded-full bg-zinc-800/60 animate-pulse" />
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-zinc-800/60 animate-pulse" />
          <div className="h-5 w-32 bg-zinc-800/60 rounded animate-pulse" />
        </div>

        <SkeletonChallengeInspector />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 h-80 space-y-4">
              <div className="h-4 w-32 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-full w-full bg-zinc-800/20 rounded-2xl animate-pulse" />
            </div>
          </div>
          <div>
            <SkeletonLeaderboard />
          </div>
        </div>
      </main>
    </div>
  );
}
