"use client";

import { useGameStore } from "@/lib/store/game-store";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FALLBACK = [
  1.14, 2.33, 1.67, 5.81, 1.42, 9.3, 1.31, 6.48, 1.01, 12.5, 2.24, 1.9, 5.72,
  3.37, 7.74, 3.09, 2.17, 1.89, 15.32, 1.05, 4.21, 2.68, 1.33, 8.04, 1.76,
  3.92, 1.18, 22.4, 1.55, 2.05,
];

export default function HistoryStrip() {
  const recentMultipliers = useGameStore((s) => s.recentMultipliers);
  const [expanded, setExpanded] = useState(false);

  const getPillStyle = (val: number) => {
    if (val >= 50) {
      return "bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white border-violet-400/30 shadow-[0_0_12px_rgba(168,85,247,0.4)]";
    } else if (val >= 10) {
      return "bg-gradient-to-r from-[#db2777] to-[#f43f5e] text-white border-pink-400/30 shadow-[0_0_10px_rgba(244,63,94,0.35)]";
    } else if (val >= 5) {
      return "bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white border-orange-400/30";
    } else if (val >= 2) {
      return "bg-gradient-to-r from-[#7c3aed] to-[#8b5cf6] text-white border-violet-400/20";
    } else {
      return "bg-[#1e293b] text-[#94a3b8] border-[#2a3954]/50";
    }
  };

  const history = recentMultipliers.length > 0 ? recentMultipliers : FALLBACK;

  return (
    <div className="relative bg-[#0f1219] border border-[#1e293b]/50 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-start gap-2">
        {/*
          Collapsed: a single clipped row (no scrollbar, overflow simply hidden).
          Expanded:  the same pills wrap onto multiple rows inside a capped,
                     vertically scrollable area.
        */}
        <div
          className={
            expanded
              ? "flex flex-wrap items-center gap-1.5 flex-1 max-h-[132px] overflow-y-auto pr-1 py-0.5"
              : "flex items-center gap-1.5 flex-1 overflow-hidden py-0.5 h-[30px]"
          }
        >
          {history.map((mult, i) => (
            <span
              key={`${mult}-${i}`}
              className={`px-2.5 py-1 rounded-full font-mono font-black text-[13px] border shadow-sm transition-transform hover:scale-105 cursor-default whitespace-nowrap shrink-0 ${getPillStyle(
                mult
              )}`}
              title={`Round #${history.length - i}: ${mult.toFixed(2)}x`}
            >
              {mult.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Fade mask hides the hard clip edge when collapsed */}
        {!expanded && (
          <div className="pointer-events-none absolute right-[46px] top-0 bottom-0 w-10 bg-gradient-to-l from-[#0f1219] to-transparent" />
        )}

        {/* Expand / collapse */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
            expanded
              ? "bg-[#1e293b] border-[#2a3954] text-white"
              : "bg-[#141822] border-[#1e293b]/50 text-[#64748b] hover:text-white hover:bg-[#1e293b]"
          }`}
          title={expanded ? "Show less" : "Show all results"}
          aria-expanded={expanded}
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}
