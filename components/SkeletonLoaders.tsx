"use client";

import React from "react";

export function SkeletonPulse() {
  return (
    <div className="animate-pulse bg-zinc-800/40 rounded-lg h-full w-full" />
  );
}

// 1. Dashboard Statistics Skeletons
export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
          <div className="h-3 w-16 bg-zinc-800/60 rounded animate-pulse" />
          <div className="h-7 w-24 bg-zinc-800/60 rounded animate-pulse my-2" />
          <div className="h-3.5 w-28 bg-zinc-800/60 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// 2. Enrolled Challenges Skeletons
export function SkeletonChallenges() {
  return (
    <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-5 text-left relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="h-4 w-40 bg-zinc-800/60 rounded animate-pulse" />
        <div className="h-3 w-16 bg-zinc-800/60 rounded animate-pulse" />
      </div>
      <div className="space-y-3.5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-zinc-900/20 border border-white/5 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="h-4 w-32 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-4.5 w-24 bg-zinc-800/60 rounded-full animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-white/5 relative">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-zinc-800/80 animate-pulse" />
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <div className="h-3 w-16 bg-zinc-800/60 rounded animate-pulse" />
                <div className="h-3 w-20 bg-zinc-800/60 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Recent Activities Skeletons
export function SkeletonActivities() {
  return (
    <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-5 text-left relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="h-4 w-32 bg-zinc-800/60 rounded animate-pulse" />
        <div className="h-3 w-12 bg-zinc-800/60 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/20 border border-white/5"
          >
            <div className="h-9 w-9 rounded-xl bg-zinc-800/60 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3.5 w-1/2 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-zinc-800/60 rounded animate-pulse" />
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="h-4 w-12 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-3 w-16 bg-zinc-800/60 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Leaderboard Skeletons
export function SkeletonLeaderboard() {
  return (
    <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-5 text-left relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="h-4 w-36 bg-zinc-800/60 rounded animate-pulse" />
        <div className="h-3.5 w-24 bg-zinc-800/60 rounded-full animate-pulse" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/20 border border-white/5"
          >
            <div className="h-5 w-5 bg-zinc-800/60 rounded animate-pulse shrink-0" />
            <div className="h-8 w-8 rounded-full bg-zinc-800/60 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-3.5 w-24 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-3 w-16 bg-zinc-800/60 rounded animate-pulse" />
            </div>
            <div className="h-4 w-14 bg-zinc-800/60 rounded animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Athlete Cards Skeletons
export function SkeletonAthletes() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-3xl p-5 space-y-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-zinc-800/60 animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-3.5 w-2/3 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-zinc-800/60 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="h-3 w-12 bg-zinc-800/60 rounded animate-pulse mx-auto" />
                <div className="h-4 w-16 bg-zinc-800/60 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// 6. Admin Analytics Skeletons
export function SkeletonAdminAnalytics() {
  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 h-24 flex flex-col justify-between">
            <div className="h-3 w-20 bg-zinc-800/60 rounded animate-pulse" />
            <div className="h-6 w-12 bg-zinc-800/60 rounded animate-pulse" />
            <div className="h-3 w-28 bg-zinc-800/60 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-64 bg-zinc-900/20 border border-white/5 rounded-3xl p-6 relative">
        <div className="h-4 w-40 bg-zinc-800/60 rounded animate-pulse mb-6" />
        <div className="absolute bottom-6 left-6 right-6 top-16 flex items-end gap-3 justify-between">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-800/40 rounded-t-lg w-full animate-pulse"
              style={{ height: `${20 + (i % 4) * 20}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 7. Challenge Inspector Skeleton
export function SkeletonChallengeInspector() {
  return (
    <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-6 relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 aspect-[4/3] rounded-2xl bg-zinc-800/60 animate-pulse shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-6 w-48 bg-zinc-800/60 rounded animate-pulse" />
          <div className="h-3.5 w-full bg-zinc-800/60 rounded animate-pulse" />
          <div className="h-3.5 w-5/6 bg-zinc-800/60 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 bg-zinc-900/20 border border-white/5 rounded-xl space-y-1.5">
                <div className="h-3 w-16 bg-zinc-800/60 rounded animate-pulse" />
                <div className="h-4 w-20 bg-zinc-800/60 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
