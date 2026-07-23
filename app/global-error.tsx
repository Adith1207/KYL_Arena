"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught by Boundary:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 max-w-md w-full text-center shadow-lg">
            <h2 className="text-xl font-bold text-red-500 mb-2">Global Render Crash</h2>
            <p className="text-white font-mono text-xs mb-2 break-words text-left bg-zinc-950 p-2 rounded">
              {error.name}: {error.message}
            </p>
            <p className="text-zinc-500 font-mono text-[10px] mb-4 text-left bg-zinc-950 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
              {error.stack}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => reset()} className="bg-zinc-800 hover:bg-zinc-700 text-white">
                Try again
              </Button>
              <Button onClick={() => window.location.href = '/login'} className="bg-lime-500 hover:bg-lime-400 text-black">
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
