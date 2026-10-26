"use client";

import { useGameStore } from "@/lib/store/game-store";
import { useEffect, useState } from "react";

export default function MultiplierDisplay() {
  const { multiplier, status, crashPoint } = useGameStore();
  const [isScaling, setIsScaling] = useState(false);
  const [displayMultiplier, setDisplayMultiplier] = useState(multiplier);

  // Detect significant multiplier changes
  useEffect(() => {
    if (Math.floor(multiplier) > Math.floor(displayMultiplier)) {
      setIsScaling(true);
      setTimeout(() => setIsScaling(false), 300);
    }
    setDisplayMultiplier(multiplier);
  }, [multiplier, displayMultiplier]);

  const isCrashed = status === "crashed";
  const isLargeMultiplier = multiplier >= 10;

  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-4">
      {/* Glow background effect */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-amber-500 via-orange-500 to-transparent rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Multiplier value */}
      <div className={`relative z-10 ${isScaling ? "animate-multiplier-scale" : ""}`}>
        <div
          className={`${
            isLargeMultiplier ? "text-large-multiplier" : "text-multiplier"
          } ${isCrashed ? "text-red-400" : "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-orange-500"} font-black`}
        >
          {displayMultiplier.toFixed(2)}
          <span className="text-2xl ml-2">x</span>
        </div>
      </div>

      {/* Status text */}
      <div className="relative z-10 text-center">
        {status === "accepting_bets" && (
          <p className="text-sm text-slate-300 animate-pulse">Place your bet...</p>
        )}
        {status === "active" && (
          <p className="text-sm text-cyan-300 font-semibold">Flying...</p>
        )}
        {status === "crashed" && (
          <p className="text-sm text-red-400 font-bold animate-bounce">
            CRASHED at {crashPoint?.toFixed(2)}x
          </p>
        )}
        {status === "waiting" && (
          <p className="text-sm text-slate-400">Waiting for next round...</p>
        )}
      </div>

      {/* Milestone indicators */}
      {multiplier >= 1 && status === "active" && (
        <div className="relative z-10 flex gap-2 flex-wrap justify-center">
          {[2, 5, 10, 25, 50, 100].map((milestone) => (
            <div
              key={milestone}
              className={`text-xs px-2 py-1 rounded-full transition-all ${
                multiplier >= milestone
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-bold glow-gold"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {milestone}x
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
