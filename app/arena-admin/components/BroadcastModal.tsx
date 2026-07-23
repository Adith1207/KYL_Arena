import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Megaphone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function BroadcastModal({ isOpen, onClose, userId }: BroadcastModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("announcement");
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [targetAudience, setTargetAudience] = useState("everyone");
  const [schedule, setSchedule] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      addToast("Validation Error", "error", "Title and Message are required.");
      return;
    }
    
    setLoading(true);
    const supabase = createClient();
    
    const { error } = await supabase.from("community_feed").insert([{
      type: type,
      title: title,
      body: message,
      priority: priority,
      author_id: userId,
      visibility: "public",
      target_type: "audience",
      target_value: targetAudience,
      metadata: { bannerUrl },
      expires_at: expiryDate || null,
      is_pinned: priority === "urgent",
    }]);

    setLoading(false);

    if (error) {
      addToast("Error", "error", error.message);
    } else {
      addToast("Announcement Sent Successfully", "success", "Your message is now live.");
      // Reset state
      setTitle("");
      setMessage("");
      setBannerUrl("");
      setExpiryDate("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-lime-500/10 flex items-center justify-center border border-lime-500/20">
                  <Megaphone className="h-4 w-4 text-lime-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white leading-tight">Broadcast Composer</h3>
                  <p className="text-xs text-zinc-400">Send announcements to the community feed.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewMode(!previewMode)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors">
                  {previewMode ? "Edit Mode" : "Preview"}
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {previewMode ? (
                <div className="max-w-md mx-auto">
                  <p className="text-xs text-zinc-500 mb-4 text-center">This is exactly how athletes will see your announcement in their feed.</p>
                  <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 overflow-hidden relative">
                    {priority === "urgent" && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/20 blur-xl rounded-full -mr-8 -mt-8" />}
                    {bannerUrl && <img src={bannerUrl} alt="Banner" className="w-full h-32 object-cover rounded-lg mb-3" />}
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-lime-500/20 flex items-center justify-center shrink-0">
                        <Megaphone className="h-5 w-5 text-lime-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white">{title || "Untitled Announcement"}</h4>
                          <span className="text-[10px] text-zinc-500">Just now</span>
                        </div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 mb-2 ${priority === 'urgent' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                          {type} • {targetAudience}
                        </span>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{message || "Your message will appear here..."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form id="broadcast-form" onSubmit={handleBroadcast} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Announcement Title</label>
                    <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Server Maintenance Tonight" className="w-full bg-zinc-900 border border-white/5 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-zinc-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Type</label>
                      <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-lg p-3 text-sm text-white focus:outline-none">
                        <option value="announcement">General</option>
                        <option value="challenge_event">Challenge</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="community">Community</option>
                        <option value="reminder">Reminder</option>
                        <option value="achievement">Achievement</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Priority</label>
                      <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-lg p-3 text-sm text-white focus:outline-none">
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Message</label>
                    <textarea required value={message} onChange={e => setMessage(e.target.value)} placeholder="What do you want to tell the community?" className="w-full bg-zinc-900 border border-white/5 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-zinc-500 min-h-[120px]" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Optional Banner URL</label>
                    <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..." className="w-full bg-zinc-900 border border-white/5 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-zinc-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Target Audience</label>
                      <select value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-lg p-3 text-sm text-white focus:outline-none">
                        <option value="everyone">Everyone</option>
                        <option value="cyclists">Cyclists</option>
                        <option value="runners">Runners</option>
                        <option value="walkers">Walkers</option>
                        <option value="admins">Admins Only</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Expiry Date (Optional)</label>
                      <input type="datetime-local" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-zinc-500" />
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="p-5 border-t border-white/5 bg-zinc-900/50 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">Cancel</Button>
              {!previewMode ? (
                <Button type="button" onClick={() => setPreviewMode(true)} className="bg-zinc-800 hover:bg-zinc-700 text-white">Preview</Button>
              ) : (
                <Button type="button" onClick={() => setPreviewMode(false)} className="bg-zinc-800 hover:bg-zinc-700 text-white">Back to Edit</Button>
              )}
              <Button type="submit" form="broadcast-form" disabled={loading} className="bg-lime-500 hover:bg-lime-400 text-black font-semibold shadow-[0_0_15px_rgba(132,204,22,0.3)]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {loading ? "Sending..." : "Send Broadcast"}
              </Button>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
