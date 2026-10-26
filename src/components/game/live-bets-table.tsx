"use client";

import { useState, useEffect, useMemo } from "react";
import { useGameStore } from "@/lib/store/game-store";

interface BetItem {
  id: string;
  user: string;
  avatar: string;
  amount: number;
  multiplier?: number;
  win?: number;
  cashedOut: boolean;
  isCurrentUser?: boolean;
  panel?: 1 | 2;
}

const BOT_NAMES = [
  "i***5", "j***o", "n***i", "m***o", "q***7", "s***5", "s***o", "r***1",
  "c***7", "z***i", "i***e", "d***a", "a***a", "d***3", "m***e", "u***5",
  "s***r", "s***7", "a***3", "s***i", "e***e", "s***0", "v***2", "d***e",
  "u***5", "s***8", "k***9", "p***1", "x***0", "l***4", "t***8", "f***2"
];

const AVATARS = ["👨‍✈️", "🧑‍🚀", "🦅", "⚡", "🔥", "🚀", "👑", "💎", "🦁", "🐉", "🐺", "🎯"];

export default function LiveBetsTable() {
  const [activeTab, setActiveTab] = useState<"all" | "my" | "top">("all");
  const { multiplier, status, bets, username, balance, roundNumber } = useGameStore();
  const [betsList, setBetsList] = useState<BetItem[]>([]);
  const [stats, setStats] = useState({ total: 0, totalWagered: 0 });

  // Generate initial bets for each round when betting starts
  useEffect(() => {
    if (status === "accepting_bets") {
      const count = 18 + Math.floor(Math.random() * 12);
      const initial: BetItem[] = Array.from({ length: count }).map((_, i) => {
        const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        const amount = [0.5, 1, 2, 5, 10, 20, 50, 100, 250][Math.floor(Math.random() * 9)];
        return {
          id: `bot-${i}-${Date.now()}-${Math.random()}`,
          user: name,
          avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
          amount,
          cashedOut: false,
        };
      });

      setBetsList(initial);
      setStats({
        total: initial.length,
        totalWagered: initial.reduce((sum, b) => sum + b.amount, 0),
      });
    }
  }, [status, roundNumber]);

  // Sync user bets into list
  useEffect(() => {
    setBetsList((prev) => {
      let updated = [...prev];
      // Remove old user bets
      updated = updated.filter(b => !b.isCurrentUser);

      // Add current user bets if active/won/lost
      if (bets.panel1.status !== "idle") {
        updated.unshift({
          id: `user-1-${bets.panel1.id}`,
          user: username || "You",
          avatar: "👤",
          amount: bets.panel1.amount,
          cashedOut: bets.panel1.status === "won",
          multiplier: bets.panel1.cashedOut,
          win: bets.panel1.winAmount,
          isCurrentUser: true,
          panel: 1,
        });
      }
      if (bets.panel2.status !== "idle") {
        updated.unshift({
          id: `user-2-${bets.panel2.id}`,
          user: `${username || "You"} #2`,
          avatar: "👤",
          amount: bets.panel2.amount,
          cashedOut: bets.panel2.status === "won",
          multiplier: bets.panel2.cashedOut,
          win: bets.panel2.winAmount,
          isCurrentUser: true,
          panel: 2,
        });
      }

      return updated;
    });
  }, [bets.panel1, bets.panel2, username]);

  // Simulate bot cashouts as multiplier rises during active round
  useEffect(() => {
    if (status !== "active") return;

    const interval = setInterval(() => {
      const currentMult = useGameStore.getState().multiplier;
      setBetsList((prev) =>
        prev.map((bet) => {
          if (bet.cashedOut || bet.isCurrentUser) return bet;

          // Each bot has a hidden target cashout point based on their personality
          const seed = bet.amount * 1.37 + bet.user.length;
          const targetMultiplier = 1.05 + Math.abs(Math.sin(seed)) * 8 + Math.random() * 2;
          
          if (currentMult >= targetMultiplier && Math.random() > 0.3) {
            const win = parseFloat((bet.amount * targetMultiplier).toFixed(2));
            return {
              ...bet,
              multiplier: parseFloat(targetMultiplier.toFixed(2)),
              win,
              cashedOut: true,
            };
          }
          return bet;
        })
      );
    }, 300);

    return () => clearInterval(interval);
  }, [status, multiplier]);

  // Filter list by tab
  const filteredBets = useMemo(() => {
    return betsList.filter((b) => {
      if (activeTab === "my") return b.isCurrentUser;
      if (activeTab === "top") return b.cashedOut && (b.win || 0) >= 20;
      return true;
    });
  }, [betsList, activeTab]);

  const totalWon = filteredBets.filter(b => b.cashedOut && b.win).reduce((sum, b) => sum + (b.win || 0), 0);

  return (
    <div className="bg-[#12151e] text-slate-200 border border-[#1e293b]/60 rounded-xl flex flex-col h-full overflow-hidden text-xs select-none shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      {/* Tab Switcher - Aviator style pill */}
      <div className="flex bg-[#0b0f19] p-1 gap-1 m-1 rounded-full border border-[#1e293b]/40">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-2 rounded-full text-center font-bold text-xs transition-all ${
            activeTab === "all"
              ? "bg-[#1e293b] text-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-[#2a3954]/50"
              : "text-[#64748b] hover:text-[#94a3b8]"
          }`}
        >
          All Bets
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`flex-1 py-2 rounded-full text-center font-bold text-xs transition-all ${
            activeTab === "my"
              ? "bg-[#1e293b] text-white shadow border border-[#2a3954]/50"
              : "text-[#64748b] hover:text-[#94a3b8]"
          }`}
        >
          My Bets
        </button>
        <button
          onClick={() => setActiveTab("top")}
          className={`flex-1 py-2 rounded-full text-center font-bold text-xs transition-all ${
            activeTab === "top"
              ? "bg-[#1e293b] text-white shadow border border-[#2a3954]/50"
              : "text-[#64748b] hover:text-[#94a3b8]"
          }`}
        >
          Top
        </button>
      </div>

      {/* Bets summary row - stats */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e121c] text-[13px] text-[#64748b] border-y border-[#1e293b]/30">
        <div className="font-bold tracking-wide flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          TOTAL BETS: <span className="text-white font-mono font-black">{betsList.length}</span>
          <span className="text-[#475569]">•</span>
          <span className="font-mono">{stats.totalWagered.toFixed(0)}$</span>
        </div>
        <div className="text-emerald-400 font-mono font-bold text-[12px]">
          +{totalWon.toFixed(0)}$ won
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 px-3 py-2 text-[12px] text-[#475569] font-bold uppercase tracking-wider border-b border-[#1e293b]/20 bg-[#0e121c]">
        <div className="col-span-5">Player</div>
        <div className="col-span-2 text-right">Bet</div>
        <div className="col-span-2 text-center">X</div>
        <div className="col-span-3 text-right">Win</div>
      </div>

      {/* Table Rows List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]/20 font-mono bg-[#0f1219]/50">
        {filteredBets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#1e293b]/50 flex items-center justify-center mb-3">
              <span className="text-xl">🎲</span>
            </div>
            <p className="text-[#64748b] font-sans text-xs font-medium">
              {activeTab === "my" ? "You have no bets this round" : "Waiting for bets..."}
            </p>
            {activeTab === "my" && (
              <p className="text-[13px] text-[#475569] mt-1">Place a bet to see it here</p>
            )}
          </div>
        ) : (
          filteredBets.map((bet) => {
            const isWinner = bet.cashedOut && bet.win;
            return (
              <div
                key={bet.id}
                className={`grid grid-cols-12 px-3 py-2 items-center text-[13px] transition-all hover:brightness-110 ${
                  isWinner
                    ? "bg-emerald-500/[0.06] hover:bg-emerald-500/[0.10] border-l-2 border-emerald-500/60"
                    : bet.isCurrentUser
                    ? "bg-amber-500/[0.07] hover:bg-amber-500/[0.11] border-l-2 border-amber-500/60"
                    : "hover:bg-[#1a2030]/50"
                }`}
              >
                {/* User */}
                <div className="col-span-5 flex items-center gap-1.5 truncate font-sans min-w-0">
                  <span className="text-[16px] leading-none shrink-0">{bet.avatar}</span>
                  <span className={`truncate font-bold text-[13px] ${bet.isCurrentUser ? "text-amber-300" : "text-[#cbd5e1]"}`}>
                    {bet.user}
                  </span>
                  {bet.isCurrentUser && (
                    <span className="text-[10px] px-1 py-0 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/30 ml-0.5">YOU</span>
                  )}
                </div>

                {/* Bet amount */}
                <div className="col-span-2 text-right text-[#e2e8f0] font-bold font-mono">
                  {bet.amount.toFixed(2)}
                </div>

                {/* Multiplier Coeff pill */}
                <div className="col-span-2 text-center">
                  {bet.multiplier ? (
                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[12px] font-black font-mono border tracking-tight ${
                      bet.multiplier >= 10
                        ? "bg-[#be185d]/20 text-pink-300 border-pink-500/30"
                        : bet.multiplier >= 2
                        ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    }`}>
                      {bet.multiplier.toFixed(2)}x
                    </span>
                  ) : (
                    <span className="text-[#334155] font-mono text-[13px]">—</span>
                  )}
                </div>

                {/* Win amount */}
                <div className="col-span-3 text-right font-bold font-mono">
                  {bet.win ? (
                    <span className="text-emerald-400">{bet.win.toFixed(2)}</span>
                  ) : (
                    <span className="text-[#334155]">—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-[#0b0f19] border-t border-[#1e293b]/30 flex items-center justify-between text-[12px]">
        <span className="text-[#475569] font-bold uppercase tracking-wider">Provably Fair</span>
        <span className="text-[#334155] font-mono">Round #{roundNumber}</span>
      </div>
    </div>
  );
}
