"use client";

import { useGameStore } from "@/lib/store/game-store";
import { Volume2, VolumeX, Menu, HelpCircle, Plane, Zap, Music, Music2 } from "lucide-react";
import { useState } from "react";
import soundEngine from "@/lib/audio/sound-engine";

export default function GameHeader() {
  const {
    balance,
    soundEnabled,
    toggleSound,
    musicEnabled,
    toggleMusic,
    toggleInfo,
    toggleSettings,
    roundNumber,
  } = useGameStore();
  const [showBalanceDropdown, setShowBalanceDropdown] = useState(false);

  return (
    <header className="bg-[#0f1117] border-b border-[#1e232f] px-3 sm:px-4 py-2.5 flex items-center justify-between select-none relative z-20">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#ef4444] via-[#e11d48] to-[#f59e0b] flex items-center justify-center shadow-[0_0_18px_rgba(239,68,68,0.45)] border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10" />
          <Plane className="w-5 h-5 text-white -rotate-45 drop-shadow relative z-10" fill="white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[20px] font-black italic tracking-[-0.02em] text-white flex items-center gap-1">
            SkyRush
            <span className="text-[11px] font-bold not-italic bg-gradient-to-r from-amber-400 to-orange-500 text-black px-1.5 py-0.5 rounded-full ml-1 tracking-wider">
              PRO
            </span>
          </span>
          <span className="text-[12px] text-[#64748b] font-bold tracking-widest uppercase flex items-center gap-1 mt-0.5">
            <Zap className="w-2.5 h-2.5 text-amber-500" />
            CRASH • ROUND #{roundNumber}
          </span>
        </div>
      </div>

      {/* Center - Status Indicator (Desktop) */}
      <div className="hidden md:flex items-center gap-2 text-[13px] font-bold">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141822] border border-[#1e293b]/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-[#94a3b8]">Live</span>
          <span className="text-white ml-1">1,248 online</span>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
          RTP 97%
        </div>
      </div>

      {/* Right Controls: Balance, Sound, Help, Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Balance badge */}
        <div className="relative">
          <button
            onClick={() => setShowBalanceDropdown(!showBalanceDropdown)}
            className="bg-[#141822] hover:bg-[#1a2030] border border-[#1e293b] hover:border-[#2a3954] px-3 sm:px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs transition-all group"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <span className="text-[13px] font-black text-emerald-400">$</span>
            </div>
            <span className="font-mono font-black text-white text-[16px] tracking-tight group-hover:text-emerald-300 transition-colors">
              {balance.toFixed(2)}
            </span>
            <span className="text-[#64748b] font-bold text-[12px] hidden sm:inline">USD</span>
          </button>
          
          {showBalanceDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#141822] border border-[#1e293b] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[13px] text-[#64748b] font-bold uppercase tracking-wider mb-2">Demo Wallet</div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-white font-bold">Balance</span>
                <span className="font-mono font-black text-emerald-400">{balance.toFixed(2)} $</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => {
                    useGameStore.getState().updateBalance(balance + 1000);
                    setShowBalanceDropdown(false);
                  }}
                  className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                >
                  +1K Demo
                </button>
                <button 
                  onClick={() => {
                    useGameStore.getState().setPlayer(useGameStore.getState().userId, useGameStore.getState().username, 1000);
                    setShowBalanceDropdown(false);
                  }}
                  className="py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#2a3954] text-[#94a3b8] text-xs font-bold transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => {
            soundEngine.unlock();
            if (!soundEnabled) soundEngine.click();
            toggleSound();
          }}
          className={`w-8 h-8 bg-[#141822] hover:bg-[#1a2030] rounded-full border flex items-center justify-center transition-all ${
            soundEnabled
              ? "text-emerald-400 border-emerald-500/30"
              : "text-[#64748b] border-[#1e293b] hover:text-white"
          }`}
          title={soundEnabled ? "Mute sound" : "Unmute sound"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Background music toggle */}
        <button
          onClick={() => {
            soundEngine.unlock();
            soundEngine.click();
            toggleMusic();
          }}
          className={`w-8 h-8 bg-[#141822] hover:bg-[#1a2030] rounded-full border flex items-center justify-center transition-all ${
            musicEnabled && soundEnabled
              ? "text-violet-400 border-violet-500/30"
              : "text-[#64748b] border-[#1e293b] hover:text-white"
          }`}
          title={musicEnabled ? "Turn music off" : "Turn music on"}
        >
          {musicEnabled ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
        </button>

        {/* How to play / Help */}
        <button
          onClick={toggleInfo}
          className="w-8 h-8 bg-[#141822] hover:bg-[#1a2030] text-[#64748b] hover:text-amber-400 rounded-full border border-[#1e293b] flex items-center justify-center transition-all"
          title="How to Play"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Menu button */}
        <button
          onClick={toggleSettings}
          className="w-8 h-8 bg-[#141822] hover:bg-[#1a2030] text-[#64748b] hover:text-white rounded-full border border-[#1e293b] flex items-center justify-center transition-all"
          title="Settings & Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
