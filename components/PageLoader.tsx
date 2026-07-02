"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Activity } from "lucide-react";

interface PageLoaderContextType {
  showLoader: (text?: string) => void;
  hideLoader: () => void;
}

const PageLoaderContext = createContext<PageLoaderContextType | undefined>(undefined);

export function usePageLoader() {
  const context = useContext(PageLoaderContext);
  if (!context) {
    throw new Error("usePageLoader must be used within a PageLoaderProvider");
  }
  return context;
}

export function PageLoaderProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Syncing Arena...");
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const showLoader = (text = "Syncing Arena...") => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
  };

  // Hide loader whenever route change completes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Intercept normal anchor link clicks for page navigation transitions
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      // Find the closest anchor tag
      const link = (e.target as HTMLElement).closest("a");
      
      if (
        link &&
        link.href &&
        link.target !== "_blank" &&
        !link.hasAttribute("download") &&
        !link.href.startsWith("mailto:") &&
        !link.href.startsWith("tel:") &&
        !link.href.startsWith("#") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        try {
          const targetUrl = new URL(link.href);
          const currentUrl = new URL(window.location.href);

          // Only intercept same-origin, different-pathway navigations
          if (
            targetUrl.origin === currentUrl.origin &&
            (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
          ) {
            let text = "Syncing Arena...";
            if (targetUrl.pathname.includes("/arena-admin/athletes")) {
              text = "Loading Athletes Directory...";
            } else if (targetUrl.pathname.includes("/arena-admin/challenges")) {
              text = "Loading Challenges Management...";
            } else if (targetUrl.pathname.includes("/arena-admin")) {
              text = "Opening Admin Terminal...";
            } else if (targetUrl.pathname.includes("/challenge/")) {
              text = "Loading Challenge Insights...";
            } else if (targetUrl.pathname === "/dashboard") {
              text = "Preparing Dashboard...";
            } else if (targetUrl.pathname === "/login") {
              text = "Opening Login Portal...";
            }

            setLoadingText(text);
            setIsLoading(true);
          }
        } catch (err) {
          // ignore invalid URLs
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => document.removeEventListener("click", handleAnchorClick, { capture: true });
  }, []);

  return (
    <PageLoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-xl text-center select-none"
          >
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            
            {/* Scanning radar indicator line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-lime-500/30 to-transparent shadow-[0_0_8px_#84cc16] animate-bounce w-full" />

            <div className="relative flex flex-col items-center gap-6 max-w-sm px-6">
              {/* Glowing Custom Logo Container */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  className="h-16 w-16 rounded-2xl border border-lime-500/20 bg-lime-500/5 flex items-center justify-center shadow-[0_0_32px_rgba(132,204,22,0.15)] relative overflow-hidden"
                >
                  <Activity className="h-8 w-8 text-lime-400" />
                </motion.div>
                
                {/* Secondary rotating accent border */}
                <div className="absolute -inset-1 border border-lime-500/10 rounded-[18px] animate-[spin_10s_linear_infinite]" />
              </div>

              <div className="space-y-2">
                <motion.h3 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm font-black uppercase tracking-[0.2em] text-white font-mono"
                >
                  {loadingText}
                </motion.h3>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 0.5 }}
                  transition={{ delay: 0.2 }}
                  className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono"
                >
                  Establishing Secure Data Sync
                </motion.p>
              </div>

              {/* Pulsing Loading Bar */}
              <div className="w-40 bg-zinc-900 h-1 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-lime-500 rounded-full shadow-[0_0_8px_#84cc16] w-1/3"
                  animate={{ 
                    left: ["-30%", "110%"],
                    width: ["20%", "40%", "20%"]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5, 
                    ease: "easeInOut" 
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLoaderContext.Provider>
  );
}
