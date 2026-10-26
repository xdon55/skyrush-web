"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore } from "@/lib/store/game-store";

const GAME_UPDATE_INTERVAL = 50; // 20fps
const COUNTDOWN_DURATION = 5; // seconds to bet
const CRASH_DISPLAY_DURATION = 3000; // ms showing crashed state
const WAITING_BETWEEN_ROUNDS = 1500;

// Generate provably-fair-ish crash point for demo
function generateCrashPoint(): number {
  const r = Math.random();

  // Realistic distribution matching Aviator
  if (r < 0.05) {
    // 5% instant crash 1.00-1.15
    return 1 + Math.random() * 0.15;
  } else if (r < 0.35) {
    // 30% 1.15-2.00
    return 1.15 + Math.random() * 0.85;
  } else if (r < 0.60) {
    // 25% 2.00-4.00
    return 2 + Math.random() * 2;
  } else if (r < 0.80) {
    // 20% 4.00-10.00
    return 4 + Math.random() * 6;
  } else if (r < 0.93) {
    // 13% 10-30
    return 10 + Math.random() * 20;
  } else if (r < 0.98) {
    // 5% 30-100
    return 30 + Math.random() * 70;
  } else {
    // 2% 100-1000 mega wins
    return 100 + Math.random() * 900;
  }
}

// Calculate multiplier based on elapsed time - exponential growth
function calculateMultiplier(elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  // This formula gives natural feeling acceleration
  // Adjusted so it feels fast and exciting like Aviator
  // Growth rate 0.12 gives: 3s->1.43x, 5s->1.82x, 10s->3.32x, 15s->6.04x, 20s->11x
  const multiplier = Math.pow(1.0718, seconds * 10);
  // Alternative: exp based: Math.exp(0.08 * seconds)
  // Use exponential with tweaking
  const expMultiplier = Math.exp(seconds * 0.14);
  // Blend for better early game
  return parseFloat(expMultiplier.toFixed(2));
}

export function useGameLoop() {
  const {
    setRound,
    setStatus,
    setMultiplier,
    setCrashed,
    addToHistory,
    resetRound,
    setCountdown,
    cashoutBet,
    loseBet,
    bets,
    status,
  } = useGameStore();

  const gameStateRef = useRef({
    roundStartTime: 0,
    crashPoint: 0,
    roundNumber: 0,
    intervalId: null as NodeJS.Timeout | null,
    countdownIntervalId: null as NodeJS.Timeout | null,
    isRunning: false,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  const startNextRound = useCallback(() => {
    const crashPoint = generateCrashPoint();
    const roundNumber = gameStateRef.current.roundNumber + 1;
    const roundId = Date.now();

    gameStateRef.current.roundNumber = roundNumber;
    gameStateRef.current.crashPoint = crashPoint;
    gameStateRef.current.roundStartTime = Date.now() + COUNTDOWN_DURATION * 1000;

    // Start betting phase
    setRound(roundId, roundNumber, crashPoint);
    setCountdown(COUNTDOWN_DURATION);

    // Flush queued bets (manual "bet next round" + auto-bet) into this round.
    useGameStore.getState().processQueuedBets();
    
    // Countdown timer
    let countdownValue = COUNTDOWN_DURATION;
    if (gameStateRef.current.countdownIntervalId) {
      clearInterval(gameStateRef.current.countdownIntervalId);
    }

    gameStateRef.current.countdownIntervalId = setInterval(() => {
      countdownValue -= 1;
      if (countdownValue >= 0) {
        setCountdown(countdownValue);
      }
      
      if (countdownValue <= 0) {
        if (gameStateRef.current.countdownIntervalId) {
          clearInterval(gameStateRef.current.countdownIntervalId);
          gameStateRef.current.countdownIntervalId = null;
        }
        // Start flying
        gameStateRef.current.roundStartTime = Date.now();
        setStatus("active");
        setMultiplier(1.0);
      }
    }, 1000);

  }, [setRound, setCountdown, setStatus, setMultiplier]);

  // Initialize game
  useEffect(() => {
    const init = async () => {
      try {
        // Try to init backend, but don't fail if it doesn't work
        fetch("/api/admin/init-game", { method: "POST" }).catch(() => {});
      } catch {}

      gameStateRef.current.roundNumber = Math.floor(Math.random() * 1000) + 100;
      startNextRound();
      setIsInitialized(true);
    };

    init();

    return () => {
      if (gameStateRef.current.intervalId) clearInterval(gameStateRef.current.intervalId);
      if (gameStateRef.current.countdownIntervalId) clearInterval(gameStateRef.current.countdownIntervalId);
    };
  }, []);

  // Main flying loop - updates multiplier 20 times per second
  useEffect(() => {
    if (!isInitialized) return;

    if (gameStateRef.current.intervalId) {
      clearInterval(gameStateRef.current.intervalId);
    }

    gameStateRef.current.intervalId = setInterval(() => {
      const currentStatus = useGameStore.getState().status;
      
      if (currentStatus === "active") {
        const elapsed = Date.now() - gameStateRef.current.roundStartTime;
        const multiplier = calculateMultiplier(elapsed);

        // Check if reached crash point
        if (multiplier >= gameStateRef.current.crashPoint) {
          // CRASH!
          const crashAt = gameStateRef.current.crashPoint;
          setCrashed(crashAt);
          addToHistory(crashAt);

          // Mark any still-active bets as lost
          const currentBets = useGameStore.getState().bets;
          if (currentBets.panel1.status === "active") {
            loseBet(1);
          }
          if (currentBets.panel2.status === "active") {
            loseBet(2);
          }

          // Schedule next round
          setTimeout(() => {
            resetRound();
            setTimeout(() => {
              startNextRound();
            }, WAITING_BETWEEN_ROUNDS);
          }, CRASH_DISPLAY_DURATION);

        } else {
          setMultiplier(multiplier);

          // Check auto-cashouts
          const state = useGameStore.getState();
          const currentMult = multiplier;

          if (state.bets.panel1.status === "active" && state.bets.panel1.autoCashout) {
            if (currentMult >= state.bets.panel1.autoCashout) {
              cashoutBet(1, currentMult);
            }
          }

          if (state.bets.panel2.status === "active" && state.bets.panel2.autoCashout) {
            if (currentMult >= state.bets.panel2.autoCashout) {
              cashoutBet(2, currentMult);
            }
          }
        }
      }
    }, GAME_UPDATE_INTERVAL);

    return () => {
      if (gameStateRef.current.intervalId) {
        clearInterval(gameStateRef.current.intervalId);
      }
    };
  }, [isInitialized, setMultiplier, setCrashed, addToHistory, resetRound, loseBet, cashoutBet, startNextRound]);

  return { isInitialized };
}
