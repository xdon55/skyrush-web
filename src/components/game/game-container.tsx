"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store/game-store";
import { useGameLoop } from "@/lib/hooks/use-game-loop";
import { useGameSound } from "@/lib/hooks/use-game-sound";

import GameHeader from "./game-header";
import HistoryStrip from "./history-strip";
import AircraftStage from "./aircraft-stage";
import DualBetControls from "./dual-bet-controls";
import SidePanel, { type SideTab } from "./side-panel";
import SettingsModal from "./settings-modal";
import InfoModal from "./info-modal";

const PANEL_PREF_KEY = "skyrush_second_panel";

export default function GameContainer() {
  const { setPlayer } = useGameStore();
  const { isInitialized } = useGameLoop();

  const [sideTab, setSideTab] = useState<SideTab>("bets");

  const showSecondPanel = useGameStore((s) => s.showSecondPanel);
  const setShowSecondPanel = useGameStore((s) => s.setShowSecondPanel);

  // Procedural audio: engine hum, takeoff, milestones, cashout, fly-away.
  useGameSound();

  // Initialize demo user with localStorage persistence
  useEffect(() => {
    let savedUser: { userId?: string; username?: string; balance?: number } | null = null;
    try {
      const stored = localStorage.getItem("skyrush_user");
      if (stored) savedUser = JSON.parse(stored);
    } catch {}

    if (savedUser?.balance && savedUser.userId && savedUser.username) {
      setPlayer(savedUser.userId, savedUser.username, savedUser.balance);
    } else {
      const randomId = `user_${Math.random().toString(36).slice(2, 11)}`;
      const randomName = `Pilot_${Math.floor(Math.random() * 9000) + 1000}`;
      const startingBalance = 3000;
      setPlayer(randomId, randomName, startingBalance);
      try {
        localStorage.setItem(
          "skyrush_user",
          JSON.stringify({ userId: randomId, username: randomName, balance: startingBalance })
        );
      } catch {}
    }

    try {
      const pref = localStorage.getItem(PANEL_PREF_KEY);
      if (pref === "1") setShowSecondPanel(true);
    } catch {}
  }, [setPlayer, setShowSecondPanel]);

  useEffect(() => {
    try {
      localStorage.setItem(PANEL_PREF_KEY, showSecondPanel ? "1" : "0");
    } catch {}
  }, [showSecondPanel]);

  // Persist balance changes
  const balance = useGameStore((s) => s.balance);
  const userId = useGameStore((s) => s.userId);
  const username = useGameStore((s) => s.username);
  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem("skyrush_user", JSON.stringify({ userId, username, balance }));
    } catch {}
  }, [balance, userId, username]);

  if (!isInitialized) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-[#0a0b0d] text-slate-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(225,29,72,0.5)] border border-white/10">
            <span className="text-3xl font-black text-white">✈</span>
          </div>
          <div>
            <p className="text-white font-black tracking-wider text-[18px]">SkyRush</p>
            <p className="text-amber-400 font-bold tracking-wider text-xs animate-pulse">
              LOADING ENGINE...
            </p>
          </div>
          <div className="w-32 h-1 bg-[#1a1d26] rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-amber-500"
              style={{ width: "60%" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-[#08090d] text-slate-100 overflow-hidden font-sans selection:bg-red-500/30">
      <div className="shrink-0">
        <GameHeader />
      </div>

      {/*
        TWO DIVISIONS from tablet upwards (md:):
          LEFT  — bets + chat sidebar (smaller)
          RIGHT — the game itself (largest)
        Below md the layout stacks and scrolls vertically.
      */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT DIVISION — All Bets + Chat (tablet & desktop) */}
        <aside className="hidden md:flex md:w-[280px] lg:w-[320px] xl:w-[350px] 2xl:w-[390px] shrink-0 flex-col p-2 pr-1 min-h-0 border-r border-[#12161f]">
          <SidePanel tab={sideTab} onTabChange={setSideTab} />
        </aside>

        {/* RIGHT DIVISION — the game (largest) */}
        <section className="flex-1 min-w-0 flex flex-col gap-2 p-2 min-h-0 overflow-y-auto md:overflow-hidden">
          <div className="shrink-0">
            <HistoryStrip />
          </div>

          {/* Stage: proportional on mobile, flexible from tablet up */}
          <div className="shrink-0 h-[34dvh] min-h-[190px] max-h-[300px] md:h-auto md:max-h-none md:flex-1 md:min-h-0 relative">
            <AircraftStage />
          </div>

          {/* Bet controls — pinned from tablet up, inline on mobile */}
          <div className="shrink-0">
            <DualBetControls />
          </div>

          {/* MOBILE ONLY: bets + chat appended below the bet panel */}
          <div className="md:hidden shrink-0 h-[440px] pb-1">
            <SidePanel tab={sideTab} onTabChange={setSideTab} />
          </div>
        </section>
      </main>

      <SettingsModal />
      <InfoModal />

      <style jsx global>{`
        body {
          font-family: "Inter", system-ui, -apple-system, sans-serif;
          overscroll-behavior: none;
        }
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        ::-webkit-scrollbar-track {
          background: #0f1117;
        }
        ::-webkit-scrollbar-thumb {
          background: #2a2d3a;
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3a3e52;
        }
      `}</style>
    </div>
  );
}
