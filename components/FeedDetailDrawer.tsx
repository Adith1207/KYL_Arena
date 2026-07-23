import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Share, Link as LinkIcon, Heart, Star, PartyPopper, Flame, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  feedItem: any | null;
}

export function FeedDetailDrawer({ isOpen, onClose, feedItem }: FeedDetailDrawerProps) {
  if (!feedItem) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-zinc-950 border-l border-white/10 z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-zinc-400">Feed Details</h2>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-6">
                
                {/* Meta */}
                <div className="flex items-center gap-3 mb-4">
                  {feedItem.author_avatar ? (
                    <img src={feedItem.author_avatar} alt="" className="h-10 w-10 rounded-full bg-zinc-800 object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold">
                      {(feedItem.author_name || "A")[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-white">{feedItem.author_name || "KYL Arena"}</div>
                    <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> {new Date(feedItem.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2 leading-tight">{feedItem.title}</h3>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 uppercase tracking-wide mb-4">
                    {feedItem.type}
                  </span>
                  
                  {feedItem.metadata?.bannerUrl && (
                    <img src={feedItem.metadata.bannerUrl} alt="Banner" className="w-full h-48 object-cover rounded-xl mb-4 border border-white/10" />
                  )}

                  <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {feedItem.body}
                  </div>
                </div>
                
                {/* Challenge Badge (if linked) */}
                {feedItem.challenge_title && (
                  <div className="bg-lime-500/10 border border-lime-500/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-lime-500/20 flex items-center justify-center">
                      <Star className="h-5 w-5 text-lime-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-lime-400 uppercase tracking-widest">Related Challenge</div>
                      <div className="text-sm font-medium text-white">{feedItem.challenge_title}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex flex-col gap-4">
              <div className="flex justify-between items-center gap-2">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-white/10 text-white hover:bg-white/10">
                  <Share className="h-4 w-4" /> Share
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-white/10 text-white hover:bg-white/10">
                  <LinkIcon className="h-4 w-4" /> Copy Link
                </Button>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
