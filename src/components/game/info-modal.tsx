"use client";

import { useGameStore } from "@/lib/store/game-store";
import { X, Info, Shield, Zap, Trophy, Target } from "lucide-react";

export default function InfoModal() {
  const { showInfo, toggleInfo } = useGameStore();

  if (!showInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#12151e] border border-[#1e293b] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 bg-[#12151e] border-b border-[#1e293b]/60 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Info className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">How to Play SkyRush</h2>
              <p className="text-[13px] text-[#64748b] font-bold uppercase tracking-wider">Beginner Guide</p>
            </div>
          </div>
          <button
            onClick={toggleInfo}
            className="w-8 h-8 rounded-full bg-[#1e293b] hover:bg-[#2a3954] text-[#64748b] hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
          {/* Objective */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white mb-1.5">Objective</h3>
              <p className="text-[16px] text-[#94a3b8] leading-relaxed">
                Place a bet and watch the aircraft climb. Cash out before it flies away to multiply your bet!
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-white mb-2">Game Flow</h3>
              <div className="space-y-2.5">
                {[
                  { step: "1", title: "Place Bet", desc: "Set amount before countdown ends (5s). You can place 2 bets at once." },
                  { step: "2", title: "Watch Climb", desc: "Multiplier starts at 1.00x and rises exponentially as jet flies." },
                  { step: "3", title: "Cash Out", desc: "Click CASH OUT anytime to lock profit. Don't wait too long!" },
                  { step: "4", title: "Fly Away", desc: "If jet flies away before cashout, you lose the bet." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#1e293b] border border-[#2a3954] text-[13px] font-black text-white flex items-center justify-center shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <span className="text-[14px] font-bold text-white">{item.title}: </span>
                      <span className="text-[14px] text-[#94a3b8]">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Winning calc */}
          <div className="bg-[#0e121c] border border-[#1e293b]/50 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">Winning Formula</h3>
            </div>
            <div className="flex items-center justify-between bg-[#12151e] border border-[#1e293b]/30 rounded-lg px-3 py-2.5 font-mono">
              <span className="text-[14px] text-[#64748b]">Payout = </span>
              <span className="text-sm font-black text-white">Bet × Multiplier</span>
            </div>
            <p className="text-[13px] text-[#64748b] mt-2 text-center">
              Example: $10 × 5.47x = <span className="text-emerald-400 font-bold">$54.70</span> (profit $44.70)
            </p>
          </div>

          {/* Auto features */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0e121c] border border-[#1e293b]/30 rounded-xl p-3">
              <h4 className="text-[13px] font-black text-white uppercase tracking-wider mb-1">Auto Cashout</h4>
              <p className="text-[13px] text-[#94a3b8] leading-relaxed">Set target multiplier to auto cashout safely.</p>
            </div>
            <div className="bg-[#0e121c] border border-[#1e293b]/30 rounded-xl p-3">
              <h4 className="text-[13px] font-black text-white uppercase tracking-wider mb-1">Double Bet</h4>
              <p className="text-[13px] text-[#94a3b8] leading-relaxed">Use 2 panels to hedge: one safe, one risky.</p>
            </div>
          </div>

          {/* Fair */}
          <div className="flex gap-2.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-emerald-300">Provably Fair</h4>
              <p className="text-[13px] text-emerald-200/70 leading-relaxed mt-0.5">
                Crash point generated with SHA-256. Verifiable, cannot be manipulated.
              </p>
            </div>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 text-center">
            <p className="text-[13px] text-amber-200/80 leading-relaxed">
              <strong className="text-amber-300">Responsible Gaming:</strong> Only bet what you can afford to lose. Crash games are high risk, high reward.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[#1e293b]/40 bg-[#0e121c]">
          <button
            onClick={toggleInfo}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-sm tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            LET'S FLY • UNDERSTOOD
          </button>
        </div>
      </div>
    </div>
  );
}
