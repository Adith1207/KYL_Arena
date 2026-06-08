"use client";

import { useState } from "react";
import { Bike, Flame, Footprints, Medal } from "lucide-react";

interface Participant {
  rank: number;
  name: string;
  value: number;
  formattedValue: string;
  percentage: number;
  completed: boolean;
}

interface Challenge {
  id: string;
  title: string;
  goal: string;
  sport: string;
  icon: React.ReactNode;
  participants: Participant[];
}

export default function ChallengePreview() {
  const [activeSport, setActiveSport] = useState("cycling");

  const challenges: Record<string, Challenge> = {
    cycling: {
      id: "cycling",
      title: "June Century Club",
      goal: "Ride 500 km before June 30",
      sport: "Cycling",
      icon: <Bike className="h-5 w-5" />,
      participants: [
        { rank: 1, name: "Adith", value: 512, formattedValue: "512 km", percentage: 100, completed: true },
        { rank: 2, name: "Rahul", value: 498, formattedValue: "498 km", percentage: 99, completed: false },
        { rank: 3, name: "Karthik", value: 451, formattedValue: "451 km", percentage: 90, completed: false },
        { rank: 4, name: "Divya", value: 380, formattedValue: "380 km", percentage: 76, completed: false },
        { rank: 5, name: "Vikram", value: 295, formattedValue: "295 km", percentage: 59, completed: false },
      ],
    },
    running: {
      id: "running",
      title: "June Run Streak",
      goal: "Run 100 km before June 30",
      sport: "Running",
      icon: <Flame className="h-5 w-5" />,
      participants: [
        { rank: 1, name: "Rahul", value: 105, formattedValue: "105 km", percentage: 100, completed: true },
        { rank: 2, name: "Divya", value: 98, formattedValue: "98 km", percentage: 98, completed: false },
        { rank: 3, name: "Adith", value: 82, formattedValue: "82 km", percentage: 82, completed: false },
        { rank: 4, name: "Vikram", value: 65, formattedValue: "65 km", percentage: 65, completed: false },
        { rank: 5, name: "Karthik", value: 42, formattedValue: "42 km", percentage: 42, completed: false },
      ],
    },
    walking: {
      id: "walking",
      title: "June Step Tracker",
      goal: "Walk 150,000 steps before June 30",
      sport: "Walking",
      icon: <Footprints className="h-5 w-5" />,
      participants: [
        { rank: 1, name: "Vikram", value: 162300, formattedValue: "162,300 steps", percentage: 100, completed: true },
        { rank: 2, name: "Karthik", value: 148900, formattedValue: "148,900 steps", percentage: 99, completed: false },
        { rank: 3, name: "Rahul", value: 132100, formattedValue: "132,100 steps", percentage: 88, completed: false },
        { rank: 4, name: "Adith", value: 110400, formattedValue: "110,400 steps", percentage: 73, completed: false },
        { rank: 5, name: "Divya", value: 95200, formattedValue: "95,200 steps", percentage: 63, completed: false },
      ],
    },
  };

  const currentChallenge = challenges[activeSport];

  return (
    <section id="challenge-preview" className="py-20 bg-zinc-950/40 border-t border-white/5 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-lime-400">
            Live Challenge Preview
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            See the Arena in Action
          </p>
          <p className="text-base text-zinc-400">
            Toggle between sports below to view how automated leaderboards look, update, and inspire your community.
          </p>
        </div>

        {/* Interactive Sport Selectors */}
        <div className="flex justify-center gap-2 mb-8">
          {Object.values(challenges).map((chal) => (
            <button
              key={chal.id}
              onClick={() => setActiveSport(chal.id)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                activeSport === chal.id
                  ? "bg-lime-400 text-black shadow-lg shadow-lime-400/25"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              {chal.icon}
              {chal.sport}
            </button>
          ))}
        </div>

        {/* Leaderboard Card Mockup */}
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/5 bg-zinc-900/20 p-5 sm:p-8 backdrop-blur-md shadow-2xl">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5 mb-6 gap-3">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-lime-400 font-bold">
                Active Challenge
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">{currentChallenge.title}</h3>
            </div>
            <div className="rounded-lg bg-zinc-800/50 px-4 py-2 border border-white/5 text-xs sm:text-right">
              <span className="text-zinc-500 block">Goal Target</span>
              <span className="font-semibold text-zinc-200">{currentChallenge.goal}</span>
            </div>
          </div>

          {/* Leaders List */}
          <div className="space-y-4">
            {currentChallenge.participants.map((p) => (
              <div
                key={p.rank}
                className={`flex flex-col gap-2 rounded-xl p-4 transition-all duration-300 ${
                  p.completed
                    ? "bg-gradient-to-r from-lime-500/10 via-zinc-900/10 to-transparent border border-lime-500/10"
                    : "bg-zinc-900/30 border border-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-zinc-900 border border-white/10">
                      {p.rank === 1 ? (
                        <Medal className="h-4 w-4 text-amber-400" />
                      ) : p.rank === 2 ? (
                        <Medal className="h-4 w-4 text-zinc-350" />
                      ) : p.rank === 3 ? (
                        <Medal className="h-4 w-4 text-amber-600" />
                      ) : (
                        <span className="text-xs font-mono font-bold text-zinc-500">{p.rank}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm sm:text-base">
                        {p.name}
                      </span>
                      {p.completed && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-400 font-bold font-mono">
                          GOAL CLEARED!
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm sm:text-base font-bold text-white">
                      {p.formattedValue}
                    </span>
                    <span className="text-xs text-zinc-500 block">
                      {p.percentage}% completion
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-white/5 mt-1">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      p.completed ? "bg-lime-400" : "bg-zinc-700"
                    }`}
                    style={{ width: `${p.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Empty state / footer info */}
          <div className="mt-6 flex items-center justify-between text-xs text-zinc-500 border-t border-white/5 pt-4">
            <span>Last sync: Less than a minute ago</span>
            <span>Strava API Connection v1.0</span>
          </div>

        </div>

      </div>
    </section>
  );
}
