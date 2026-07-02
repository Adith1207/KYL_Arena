"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (title: string, type?: ToastType, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((title: string, type: ToastType = "success", message?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="pointer-events-auto w-full"
            >
              <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const { title, message, type } = toast;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-lime-400 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-zinc-400 shrink-0" />,
  };

  const borderColors = {
    success: "border-lime-500/20 bg-zinc-950/80 shadow-[0_4px_24px_rgba(132,204,22,0.1)]",
    error: "border-red-500/20 bg-zinc-950/80 shadow-[0_4px_24px_rgba(239,68,68,0.1)]",
    warning: "border-amber-500/20 bg-zinc-950/80 shadow-[0_4px_24px_rgba(245,158,11,0.1)]",
    info: "border-zinc-500/20 bg-zinc-950/80 shadow-[0_4px_24px_rgba(113,113,122,0.1)]",
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 relative overflow-hidden group ${borderColors[type]}`}>
      {/* Decorative background grid line */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {icons[type]}

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <h4 className="text-xs font-black uppercase tracking-wider text-white truncate">
          {title}
        </h4>
        {message && (
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            {message}
          </p>
        )}
      </div>

      <button
        onClick={onClose}
        className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded-lg hover:bg-white/5"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
