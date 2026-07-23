"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CommunityFeedWidget } from "@/components/CommunityFeedWidget";

interface CommunityClientProps {
  userId: string;
}

export default function CommunityClient({ userId }: CommunityClientProps) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans p-6 pb-20 sm:pb-6 overflow-x-hidden">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
          <Link href="/dashboard" className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Community Feed</h1>
            <p className="text-sm text-zinc-500">Live updates from athletes and events across KYL Arena.</p>
          </div>
        </div>

        <CommunityFeedWidget userId={userId} limit={100} fullPage={true} />
      </div>
    </div>
  );
}
