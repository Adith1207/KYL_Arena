"use client";

import React from "react";
import { SkeletonAthletes } from "@/components/SkeletonLoaders";

export default function AdminAthletesLoading() {
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1.5">
            <div className="h-6 w-40 bg-zinc-800/60 rounded animate-pulse" />
            <div className="h-3 w-48 bg-zinc-800/60 rounded animate-pulse" />
          </div>
        </div>

        {/* Filter / Search mock placeholder */}
        <div className="flex flex-col md:flex-row gap-3 w-full bg-zinc-900/10 border border-white/5 rounded-2xl p-4">
          <div className="h-9 w-full md:w-64 bg-zinc-800/40 rounded-xl animate-pulse" />
          <div className="h-9 w-full md:w-32 bg-zinc-800/40 rounded-xl animate-pulse" />
          <div className="h-9 w-full md:w-32 bg-zinc-800/40 rounded-xl animate-pulse" />
        </div>

        <SkeletonAthletes />
      </main>
    </div>
  );
}
