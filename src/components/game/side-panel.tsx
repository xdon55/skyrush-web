"use client";

import { useState } from "react";
import LiveBetsTable from "./live-bets-table";
import LiveChat from "./live-chat";
import soundEngine from "@/lib/audio/sound-engine";
import { Users, MessageSquare } from "lucide-react";

export type SideTab = "bets" | "chat";

interface SidePanelProps {
  /** Controlled tab (optional). */
  tab?: SideTab;
  onTabChange?: (t: SideTab) => void;
  className?: string;
}

/**
 * Unified left-hand sidebar containing the live bets table and the
 * community chat behind a single tab switcher.
 */
export default function SidePanel({ tab, onTabChange, className = "" }: SidePanelProps) {
  const [internal, setInternal] = useState<SideTab>("bets");
  const active = tab ?? internal;

  const select = (t: SideTab) => {
    soundEngine.unlock();
    soundEngine.click();
    if (onTabChange) onTabChange(t);
    else setInternal(t);
  };

  return (
    <div className={`flex flex-col h-full min-h-0 gap-2 ${className}`}>
      {/* Tab switcher */}
      <div className="shrink-0 flex bg-[#0b0f19] p-1 gap-1 rounded-full border border-[#1e293b]/60">
        <button
          onClick={() => select("bets")}
          className={`flex-1 py-2 rounded-full text-center font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            active === "bets"
              ? "bg-[#1e293b] text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] border border-[#2a3954]/60"
              : "text-[#64748b] hover:text-[#94a3b8]"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          All Bets
        </button>
        <button
          onClick={() => select("chat")}
          className={`flex-1 py-2 rounded-full text-center font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            active === "chat"
              ? "bg-[#1e293b] text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] border border-[#2a3954]/60"
              : "text-[#64748b] hover:text-[#94a3b8]"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>

      {/* Panel body — only the active tab is mounted so lists stay light */}
      <div className="flex-1 min-h-0">
        {active === "bets" ? <LiveBetsTable /> : <LiveChat />}
      </div>
    </div>
  );
}
