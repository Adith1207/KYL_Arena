import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import ChallengePreview from "@/components/ChallengePreview";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-orange-500 selection:text-white antialiased">
      <Navbar />
      <main className="flex flex-col">
        <Hero />
        <Features />
        <HowItWorks />
        <ChallengePreview />
      </main>
      <Footer />
    </div>
  );
}

