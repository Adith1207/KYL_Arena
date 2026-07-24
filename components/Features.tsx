"use client";

import { useEffect, useState } from "react";
import { Link2, Trophy, Users, TrendingUp, Award, Flag, Activity, Navigation, Mountain } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { createClient } from "@/lib/supabase/client";
import { motion, useInView, useAnimation, animate } from "framer-motion";
import { useRef } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-zinc-900/10 border border-white/5 hover:-translate-y-1 hover:border-lime-500/20 hover:shadow-xl hover:shadow-lime-500/5 transition-all duration-500 h-full">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/10 text-lime-400">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-bold text-white tracking-tight">{title}</h3>
      <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-[240px]">{description}</p>
    </div>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  formatFn?: (val: number) => string;
}

function StatItem({ icon, value, label, formatFn }: StatItemProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 2,
        ease: "easeOut",
        onUpdate: (val) => {
          setDisplayValue(formatFn ? formatFn(val) : Math.round(val).toString());
        },
      });
      return () => controls.stop();
    }
  }, [value, isInView, formatFn]);

  return (
    <div className="flex flex-col items-center justify-center p-6 border-r last:border-r-0 border-white/5">
      <div className="text-lime-400 mb-2">{icon}</div>
      <div ref={nodeRef} className="text-2xl sm:text-3xl font-black text-white">
        {displayValue}
      </div>
      <div className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
        {label}
      </div>
    </div>
  );
}

interface FeaturesProps {
  initialStats: {
    profiles: number;
    challenges: number;
    activities: number;
    distance: number;
    elevation: number;
  };
}

export default function Features({ initialStats }: FeaturesProps) {
  const [stats, setStats] = useState(initialStats);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.rpc("get_community_stats");
      if (data) {
        setStats(data as any);
      }
    };

    // Listen for any changes on profiles, challenges, activities
    const channel = supabase
      .channel("public:stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "challenges" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const features = [
    {
      icon: <Link2 className="h-5 w-5" />,
      title: "Automatic Tracking",
      description: "Connect Strava and let us track your activities automatically.",
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      title: "Fair Competition",
      description: "Transparent leaderboards and fair ranking system for everyone.",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Community Driven",
      description: "Built for communities, by communities. Stronger together.",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Real-time Updates",
      description: "Live leaderboards and real-time challenge progress.",
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Celebrate Every Win",
      description: "Certificates, badges and recognition for every achievement.",
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M+";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K+";
    return Math.round(num).toString();
  };

  const statItems = [
    { icon: <Users className="h-5 w-5" />, value: stats.profiles, label: "Athletes", formatFn: (v: number) => Math.round(v).toString() },
    { icon: <Flag className="h-5 w-5" />, value: stats.challenges, label: "Challenges", formatFn: (v: number) => Math.round(v).toString() },
    { icon: <Activity className="h-5 w-5" />, value: stats.activities, label: "Activities", formatFn: formatNumber },
    { icon: <Navigation className="h-5 w-5" />, value: stats.distance, label: "Kilometers", formatFn: formatNumber },
    { icon: <Mountain className="h-5 w-5" />, value: stats.elevation, label: "Elevation (m)", formatFn: formatNumber },
  ];

  return (
    <section id="features" className="py-20 bg-zinc-950 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title */}
        <ScrollReveal className="text-center" direction="up">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Why <span className="text-lime-400">KYL Arena</span>?
          </h2>
        </ScrollReveal>

        {/* Feature Grid - center aligned with staggered entrance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delayMs={index * 100} durationMs={800} direction="up" className="h-full">
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </ScrollReveal>
          ))}
        </div>

        {/* Stats Row Container */}
        <ScrollReveal delayMs={200} direction="up">
          <div className="max-w-5xl mx-auto rounded-2xl border border-white/5 bg-zinc-900/10 grid grid-cols-2 md:grid-cols-5 overflow-hidden">
            {statItems.map((stat, index) => (
              <StatItem
                key={index}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
                formatFn={stat.formatFn}
              />
            ))}
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
