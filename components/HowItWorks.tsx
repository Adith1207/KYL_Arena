"use client";

import { useEffect, useState } from "react";
import { Link2, Flag, Activity, Trophy, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import { createClient } from "@/lib/supabase/client";

interface StepItemProps {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast?: boolean;
}

function StepItem({ number, icon, title, description, isLast = false }: StepItemProps) {
  return (
    <div className="relative flex gap-6 items-start">
      {/* Vertical connector line */}
      {!isLast && (
        <span className="absolute left-6 top-12 bottom-0 w-0.5 bg-zinc-800" />
      )}
      
      {/* Number circle */}
      <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lime-400 text-black font-extrabold text-base">
        {number}
      </div>

      {/* Icon and Text info */}
      <div className="flex gap-4 items-start pt-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-white/5 text-zinc-400">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-white leading-snug">{title}</h3>
          <p className="text-sm text-zinc-400 mt-0.5 leading-normal max-w-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface HowItWorksProps {
  activeChallenge: any | null;
}

export default function HowItWorks({ activeChallenge }: HowItWorksProps) {
  const [challenge, setChallenge] = useState(activeChallenge);
  const [participantCount, setParticipantCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    // If no initial challenge, maybe fetch it? Or rely on props. We'll rely on props and listen for changes.
    const fetchChallengeData = async () => {
      if (!challenge) return;
      const { count } = await supabase
        .from("challenge_participants")
        .select("*", { count: "exact", head: true })
        .eq("challenge_id", challenge.id);
      
      setParticipantCount(count || 0);
    };

    fetchChallengeData();

    // Listen for new challenge or new participants
    const channel = supabase
      .channel("public:how_it_works")
      .on("postgres_changes", { event: "*", schema: "public", table: "challenges" }, async () => {
        const { data } = await supabase.from("challenges").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(1);
        setChallenge(data?.[0] || null);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_participants" }, fetchChallengeData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challenge, supabase]);

  const steps = [
    {
      number: "1",
      icon: <Link2 className="h-4.5 w-4.5" />,
      title: "Connect Strava",
      description: "Link your Strava account in seconds.",
    },
    {
      number: "2",
      icon: <Flag className="h-4.5 w-4.5" />,
      title: "Join a Challenge",
      description: "Pick a challenge that motivates you.",
    },
    {
      number: "3",
      icon: <Activity className="h-4.5 w-4.5" />,
      title: "Track Your Activities",
      description: "We automatically track your progress.",
    },
    {
      number: "4",
      icon: <Trophy className="h-4.5 w-4.5" />,
      title: "Climb the Leaderboard",
      description: "Compete, improve and be on top!",
    },
  ];

  // Calculate remaining days
  const getRemainingDays = () => {
    if (!challenge?.end_date) return 0;
    const end = new Date(challenge.end_date);
    const today = new Date();
    const diff = end.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <section id="how-it-works" className="py-20 bg-zinc-950 border-t border-white/5 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <ScrollReveal className="mb-12" direction="up">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            How It Works
          </h2>
        </ScrollReveal>

        {/* Horizontal Splitting: Steps Left, Challenge Card Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Side: 4 Steps */}
          <div className="lg:col-span-6 space-y-8 py-2">
            {steps.map((step, idx) => (
              <ScrollReveal
                key={step.number}
                direction="left"
                delayMs={idx * 150}
                durationMs={700}
              >
                <StepItem
                  number={step.number}
                  icon={step.icon}
                  title={step.title}
                  description={step.description}
                  isLast={idx === steps.length - 1}
                />
              </ScrollReveal>
            ))}
          </div>

          {/* Right Side: Current Challenge Card */}
          <div className="lg:col-span-6 w-full max-w-xl mx-auto lg:mx-0">
            <ScrollReveal direction="right" delayMs={200} zoom={true} durationMs={800}>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-lime-400 uppercase tracking-widest">
                  Current Challenge
                </h3>

                {challenge ? (
                  <div className="rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/10 shadow-xl flex flex-col h-full">
                    
                    {/* Top Half: Image background */}
                    <div 
                      className="relative h-56 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url('${challenge.banner_url || '/hero_backdrop.png'}')` }}
                    >
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent" />

                      {/* Ongoing Badge */}
                      <div className="absolute top-4 right-4 bg-lime-400 text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                        Ongoing
                      </div>
                      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                        {challenge.sport_type}
                      </div>

                      {/* Title & Dates */}
                      <div className="absolute bottom-4 left-6 space-y-1 pr-6">
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight truncate">
                          {challenge.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-lime-400" />
                          <span>{formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Half: Details & CTA */}
                    <div className="p-6 bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-6 flex-1">
                      {/* Dynamic stats list */}
                      <div className="grid grid-cols-3 gap-6 w-full sm:w-auto">
                        <div className="text-left">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                            Participants
                          </span>
                          <span className="text-lg font-black text-white">{participantCount}</span>
                        </div>
                        <div className="text-left border-l border-white/5 pl-4">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                            Target
                          </span>
                          <span className="text-lg font-black text-white">
                            {challenge.goal_target} {challenge.goal_metric === "Distance" ? "km" : "m"}
                          </span>
                        </div>
                        <div className="text-left border-l border-white/5 pl-4">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                            Remaining
                          </span>
                          <span className="text-lg font-black text-white">{getRemainingDays()} days</span>
                        </div>
                      </div>

                      {/* CTA button */}
                      <Button
                        variant="default"
                        className="w-full sm:w-auto bg-lime-400 hover:bg-lime-300 text-black font-extrabold px-6 py-5 rounded-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
                        asChild
                      >
                        <Link href="/login">
                          Join Now
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/5 bg-zinc-900/10 p-12 text-center flex flex-col items-center justify-center shadow-xl">
                    <Flag className="h-12 w-12 text-zinc-600 mb-4" />
                    <p className="text-zinc-400 font-semibold">No active challenge right now.</p>
                  </div>
                )}

                {/* View all link */}
                <div className="text-left">
                  <Link
                    href="#challenge-preview"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-lime-400 hover:text-lime-300 transition-colors uppercase tracking-wider"
                  >
                    View Leaderboard
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

              </div>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
}
