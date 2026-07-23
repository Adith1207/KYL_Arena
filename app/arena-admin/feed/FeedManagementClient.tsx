"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Trash2, Pin, Calendar, Eye, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";

interface FeedManagementClientProps {
  feedItems: any[];
  userId: string;
}

export default function FeedManagementClient({ feedItems: initialFeedItems, userId }: FeedManagementClientProps) {
  const [feedItems, setFeedItems] = useState(initialFeedItems);
  const [searchQuery, setSearchQuery] = useState("");
  const { addToast } = useToast();
  const supabase = createClient();

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    const { error } = await supabase.from("community_feed").update({ is_pinned: !currentPin }).eq("id", id);
    if (!error) {
      setFeedItems(prev => prev.map(item => item.id === id ? { ...item, is_pinned: !currentPin } : item));
      addToast("Updated", "success", currentPin ? "Unpinned announcement" : "Pinned announcement");
    } else {
      addToast("Error", "error", "Failed to update pin status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    const { error } = await supabase.from("community_feed").update({ is_deleted: true }).eq("id", id);
    if (!error) {
      setFeedItems(prev => prev.filter(item => item.id !== id));
      addToast("Deleted", "success", "Post removed from feed");
    } else {
      addToast("Error", "error", "Failed to delete post");
    }
  };

  const filteredItems = feedItems.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-300 font-sans">
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0C0C0E]">
        <div className="flex items-center gap-4">
          <Link href="/arena-admin" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-white">Community Feed Management</h1>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">No posts found.</div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className={`bg-zinc-900 border ${item.is_pinned ? 'border-lime-500/30' : 'border-white/5'} rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center`}>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-white truncate">{item.title}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 uppercase tracking-wide">
                      {item.type}
                    </span>
                    {item.is_pinned && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-lime-500/10 text-lime-400 uppercase tracking-wide flex items-center gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2">{item.body}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(item.created_at).toLocaleDateString()}</span>
                    {item.expires_at && (
                      <span className="flex items-center gap-1.5 text-orange-400"><Clock className="h-3.5 w-3.5" /> Expires: {new Date(item.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleTogglePin(item.id, item.is_pinned)}
                    className={item.is_pinned ? "text-lime-400 hover:text-lime-300" : "text-zinc-400 hover:text-white"}
                  >
                    <Pin className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
