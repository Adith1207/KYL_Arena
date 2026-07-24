import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import ChallengePreview from "@/components/ChallengePreview";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default async function Home() {
  const supabase = await createClient();

  // Fetch all initial data in parallel
  const [statsRes, activeChallengesRes, initialProfilesRes, avatarsRes] = await Promise.all([
    supabase.rpc("get_community_stats"),
    supabase.from("challenges").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(1),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("avatar").limit(5)
  ]);

  const initialStats = statsRes.data || { profiles: 0, challenges: 0, activities: 0, distance: 0, elevation: 0 };
  const initialActiveChallenge = activeChallengesRes.data?.[0] || null;
  const initialProfileCount = initialProfilesRes.count || initialStats.profiles || 0;
  const initialAvatars = (avatarsRes.data || []).map(p => p.avatar).filter(Boolean);

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-lime-500 selection:text-white antialiased">
      <Navbar />
      <main className="flex flex-col">
        <Hero initialProfileCount={initialProfileCount} activeChallenge={initialActiveChallenge} initialAvatars={initialAvatars} />
        <Features initialStats={initialStats} />
        <HowItWorks activeChallenge={initialActiveChallenge} />
        <ChallengePreview />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
