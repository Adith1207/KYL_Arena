import { Link2, Trophy, Users, TrendingUp, Award, Flag, Activity, Navigation, Mountain } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-zinc-900/10 border border-white/5 hover:border-lime-500/20 transition-all duration-300">
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
  value: string;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 border-r last:border-r-0 border-white/5">
      <div className="text-lime-400 mb-2">{icon}</div>
      <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
      <div className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
        {label}
      </div>
    </div>
  );
}

export default function Features() {
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

  const stats = [
    { icon: <Users className="h-5 w-5" />, value: "500+", label: "Athletes" },
    { icon: <Flag className="h-5 w-5" />, value: "25+", label: "Challenges" },
    { icon: <Activity className="h-5 w-5" />, value: "1.2M+", label: "Activities" },
    { icon: <Navigation className="h-5 w-5" />, value: "15M+", label: "Kilometers" },
    { icon: <Mountain className="h-5 w-5" />, value: "250K+", label: "Elevation (m)" },
  ];

  return (
    <section id="features" className="py-20 bg-zinc-950 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Why <span className="text-lime-400">KYL Arena</span>?
          </h2>
        </div>

        {/* Feature Grid - center aligned */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        {/* Stats Row Container */}
        <div className="max-w-5xl mx-auto rounded-2xl border border-white/5 bg-zinc-900/10 grid grid-cols-2 md:grid-cols-5 overflow-hidden">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
