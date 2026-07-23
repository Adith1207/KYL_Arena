"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Megaphone, Star, Clock, PartyPopper, Zap, Pin, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { FeedDetailDrawer } from "./FeedDetailDrawer";

interface CommunityFeedWidgetProps {
  userId: string;
  limit?: number;
  className?: string;
  fullPage?: boolean;
}

export function CommunityFeedWidget({ userId, limit = 20, className = "", fullPage = false }: CommunityFeedWidgetProps) {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  const { addToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchFeed();

    const channelId = Math.random().toString(36).substring(7);
    
    const feedChannel = supabase
      .channel(`public:community_feed_${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_feed' }, (payload) => {
        setFeedItems(current => [payload.new, ...current]);
        if (payload.new.author_id !== userId) {
          addToast("New Feed Update", "info", payload.new.title);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_feed' }, (payload) => {
        setFeedItems(current => current.map(item => item.id === payload.new.id ? payload.new : item));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_feed' }, (payload) => {
        setFeedItems(current => current.filter(item => item.id !== payload.old.id));
      })
      .subscribe();

    const reactionsChannel = supabase
      .channel(`public:community_feed_reactions_${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_feed_reactions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setReactions(current => [...current, payload.new]);
        } else if (payload.eventType === 'DELETE') {
          setReactions(current => current.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(feedChannel);
      supabase.removeChannel(reactionsChannel);
    };
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    const { data: items } = await supabase
      .from('community_feed')
      .select('*')
      .eq('is_deleted', false)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (items) {
      setFeedItems(items);
      const ids = items.map(i => i.id);
      if (ids.length > 0) {
        const { data: rxData } = await supabase
          .from('community_feed_reactions')
          .select('*')
          .in('feed_id', ids);
        if (rxData) setReactions(rxData);
      }
    }
    setLoading(false);
  };

  const handleReact = async (feedId: string, emoji: string) => {
    // Optimistic check
    const existing = reactions.find(r => r.feed_id === feedId && r.user_id === userId && r.reaction === emoji);
    if (existing) {
      // Remove reaction
      setReactions(curr => curr.filter(r => r.id !== existing.id));
      await supabase.from('community_feed_reactions').delete().eq('id', existing.id);
    } else {
      // Add reaction
      const tempId = Math.random().toString();
      const newReaction = { id: tempId, feed_id: feedId, user_id: userId, reaction: emoji, created_at: new Date().toISOString() };
      setReactions(curr => [...curr, newReaction]);
      const { data } = await supabase.from('community_feed_reactions').insert([{ feed_id: feedId, user_id: userId, reaction: emoji }]).select().single();
      if (data) {
        setReactions(curr => curr.map(r => r.id === tempId ? data : r));
      }
    }
  };

  const typeConfig: Record<string, any> = {
    announcement: { icon: <Megaphone className="h-4 w-4" />, accent: "border-lime-400/20 bg-lime-400/5", badge: "bg-lime-400/10 text-lime-400", dot: "bg-lime-400" },
    achievement: { icon: <Star className="h-4 w-4" />, accent: "border-amber-400/20 bg-amber-400/5", badge: "bg-amber-400/10 text-amber-400", dot: "bg-amber-400" },
    deadline: { icon: <Clock className="h-4 w-4" />, accent: "border-red-400/20 bg-red-400/5", badge: "bg-red-400/10 text-red-400", dot: "bg-red-400" },
    milestone: { icon: <PartyPopper className="h-4 w-4" />, accent: "border-purple-400/20 bg-purple-400/5", badge: "bg-purple-400/10 text-purple-400", dot: "bg-purple-400" },
    event: { icon: <Zap className="h-4 w-4" />, accent: "border-sky-400/20 bg-sky-400/5", badge: "bg-sky-400/10 text-sky-400", dot: "bg-sky-400" },
    system: { icon: <Pin className="h-4 w-4" />, accent: "border-zinc-600/30 bg-zinc-800/20", badge: "bg-zinc-700/30 text-zinc-400", dot: "bg-zinc-500" },
    sync: { icon: <Zap className="h-4 w-4" />, accent: "border-blue-400/20 bg-blue-400/5", badge: "bg-blue-400/10 text-blue-400", dot: "bg-blue-400" },
  };

  const ReactionBar = ({ feedId }: { feedId: string }) => {
    const emojis = ["👍", "🔥", "💪", "🎉", "❤️"];
    const itemReactions = reactions.filter(r => r.feed_id === feedId);
    
    return (
      <div className="flex flex-wrap gap-2 mt-3" onClick={e => e.stopPropagation()}>
        {emojis.map(emoji => {
          const count = itemReactions.filter(r => r.reaction === emoji).length;
          const hasReacted = itemReactions.some(r => r.reaction === emoji && r.user_id === userId);
          if (count === 0 && !hasReacted && !fullPage) return null; // Hide zero counts unless full page or interacted

          return (
            <button 
              key={emoji} 
              onClick={() => handleReact(feedId, emoji)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-transform active:scale-90 ${hasReacted ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30' : 'bg-zinc-800/50 text-zinc-400 border border-white/5 hover:bg-zinc-700'}`}
            >
              <span>{emoji}</span> {count > 0 && <span className="font-medium">{count}</span>}
            </button>
          );
        })}
        {/* Quick react trigger for widget mode */}
        {!fullPage && (
           <div className="group relative">
             <button className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-zinc-800/50 text-zinc-400 border border-white/5 hover:bg-zinc-700 transition-colors">
               +
             </button>
             <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-zinc-900 border border-white/10 rounded-full shadow-lg p-1 gap-1 z-10">
               {emojis.map(emoji => (
                  <button key={`quick-${emoji}`} onClick={() => handleReact(feedId, emoji)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 rounded-full transition-transform hover:scale-110">
                    {emoji}
                  </button>
               ))}
             </div>
           </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className={`flex justify-center py-10 ${className}`}><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {feedItems.length === 0 ? (
        <div className="text-center py-10 text-zinc-500 text-sm border border-dashed border-white/10 rounded-xl">No activities yet. Check back later!</div>
      ) : (
        feedItems.map((item, idx) => {
          const cfg = typeConfig[item.type] || typeConfig.system;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.5) }}
              onClick={() => setSelectedItem(item)}
              className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer hover:shadow-lg ${cfg.accent}`}
            >
              {item.is_pinned && (
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-lime-500/20 border-l-[40px] border-l-transparent">
                   <Pin className="absolute -top-[30px] -left-[16px] h-3 w-3 text-lime-400 rotate-45" />
                </div>
              )}
              
              <div className="flex gap-4">
                <div className={`shrink-0 h-10 w-10 flex items-center justify-center rounded-xl ${cfg.badge}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-white truncate pr-4">{item.title}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                      {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-sm text-zinc-400 ${fullPage ? '' : 'line-clamp-2'}`}>
                    {item.body}
                  </p>
                  
                  {item.metadata?.bannerUrl && fullPage && (
                    <img src={item.metadata.bannerUrl} alt="Banner" className="mt-3 w-full h-40 object-cover rounded-lg border border-white/5" />
                  )}

                  <ReactionBar feedId={item.id} />
                </div>
              </div>
            </motion.div>
          );
        })
      )}

      <FeedDetailDrawer isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} feedItem={selectedItem} />
    </div>
  );
}
