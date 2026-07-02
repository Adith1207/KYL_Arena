"use client";

import React from "react";
import { SkeletonStats, SkeletonChallenges, SkeletonActivities, SkeletonLeaderboard } from "@/components/SkeletonLoaders";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* Header bar mock */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between w-full">
        <div className="h-5 w-24 bg-zinc-800/60 rounded animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-zinc-800/60 animate-pulse" />
        </div>
      </header>

      {/* Main dashboard content loader */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 relative">
        {/* Welcome Section skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-zinc-800/60 rounded animate-pulse" />
            <div className="h-3.5 w-64 bg-zinc-800/60 rounded animate-pulse" />
          </div>
          <div className="h-8.5 w-32 bg-zinc-800/60 rounded-xl animate-pulse" />
        </div>

        {/* 1. Statistics Cards */}
        <SkeletonStats />

        {/* 2. Responsive Content grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <SkeletonChallenges />
            <SkeletonActivities />
          </div>
          <div className="space-y-8">
            <SkeletonLeaderboard />
          </div>
        </div>
      </main>
    </div>
  );
}
