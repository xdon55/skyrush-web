"use client";

import { useGameStore } from "@/lib/store/game-store";
import { useEffect, useState } from "react";

export default function RoundCountdown() {
  const { status } = useGameStore();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (status !== "waiting") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 5; // Reset for next round
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  if (status !== "waiting" && status !== "accepting_bets") {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="relative">
        {/* Outer ring */}
        <div className="relative w-32 h-32 rounded-full border-4 border-amber-500 border-opacity-30 flex items-center justify-center">
          {/* Animated glow */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-400 animate-spin"></div>

          {/* Center circle */}
          <div className="w-24 h-24 rounded-full glass-strong flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-black text-amber-300 font-mono">
                {countdown}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {status === "accepting_bets" ? "PLACE BETS" : "NEXT ROUND"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
