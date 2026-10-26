"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/store/game-store";
import soundEngine from "@/lib/audio/sound-engine";

const MILESTONES = [2, 5, 10, 25, 50, 100];

/**
 * Bridges game state to the procedural sound engine.
 * Mount once (in GameContainer) and every audio cue is handled automatically.
 */
export function useGameSound() {
  const status = useGameStore((s) => s.status);
  const multiplier = useGameStore((s) => s.multiplier);
  const countdown = useGameStore((s) => s.countdown);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const musicEnabled = useGameStore((s) => s.musicEnabled);
  const panel1 = useGameStore((s) => s.bets.panel1);
  const panel2 = useGameStore((s) => s.bets.panel2);

  const prevStatus = useRef(status);
  const prevCountdown = useRef<number>(countdown);
  const milestoneIdx = useRef(0);
  const prevPanel1 = useRef(panel1.status);
  const prevPanel2 = useRef(panel2.status);

  // Unlock audio on the first user interaction (browser autoplay policy),
  // then start the ambient soundtrack.
  useEffect(() => {
    const unlock = () => {
      soundEngine.unlock();
      if (useGameStore.getState().musicEnabled && useGameStore.getState().soundEnabled) {
        soundEngine.startMusic();
      }
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];
    events.forEach((e) => window.addEventListener(e, unlock, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, unlock));
  }, []);

  // Keep engine mute state in sync with the header toggle.
  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
    if (soundEnabled && useGameStore.getState().musicEnabled) {
      soundEngine.startMusic();
    }
  }, [soundEnabled]);

  // Dedicated music toggle.
  useEffect(() => {
    if (musicEnabled && soundEnabled) soundEngine.startMusic();
    else soundEngine.stopMusic();
  }, [musicEnabled, soundEnabled]);

  // Round phase transitions.
  useEffect(() => {
    const prev = prevStatus.current;
    if (prev === status) return;

    if (status === "active") {
      milestoneIdx.current = 0;
      soundEngine.takeoff();
      soundEngine.startEngine();
      // Pull the pad back so the engine and multiplier cues stay clear.
      soundEngine.setMusicDuck(true);
    }

    if (status === "crashed") {
      soundEngine.flyAway();
      // Loss cue only if the player actually had money riding on it.
      const s = useGameStore.getState();
      if (s.bets.panel1.status === "lost" || s.bets.panel2.status === "lost") {
        window.setTimeout(() => soundEngine.lose(), 420);
      }
    }

    if (status === "waiting" || status === "accepting_bets") {
      soundEngine.stopEngine(0.2);
      soundEngine.setMusicDuck(false);
    }

    prevStatus.current = status;
  }, [status]);

  // Countdown ticks.
  useEffect(() => {
    if (status !== "accepting_bets") {
      prevCountdown.current = countdown;
      return;
    }
    if (countdown !== prevCountdown.current && countdown > 0 && countdown <= 3) {
      soundEngine.tick(countdown === 1);
    }
    prevCountdown.current = countdown;
  }, [countdown, status]);

  // Engine pitch + milestone pings while flying.
  useEffect(() => {
    if (status !== "active") return;

    soundEngine.updateEngine(multiplier);

    while (
      milestoneIdx.current < MILESTONES.length &&
      multiplier >= MILESTONES[milestoneIdx.current]
    ) {
      soundEngine.milestone(milestoneIdx.current + 1);
      milestoneIdx.current += 1;
    }
  }, [multiplier, status]);

  // Per-panel bet lifecycle sounds.
  useEffect(() => {
    if (panel1.status !== prevPanel1.current) {
      if (panel1.status === "active") soundEngine.betPlaced();
      if (panel1.status === "idle" && prevPanel1.current === "active") soundEngine.betCancelled();
      if (panel1.status === "won") {
        const m = panel1.cashedOut ?? 1;
        soundEngine.cashout(m);
        if (m >= 10) soundEngine.bigWin();
      }
      prevPanel1.current = panel1.status;
    }
  }, [panel1.status, panel1.cashedOut]);

  useEffect(() => {
    if (panel2.status !== prevPanel2.current) {
      if (panel2.status === "active") soundEngine.betPlaced();
      if (panel2.status === "idle" && prevPanel2.current === "active") soundEngine.betCancelled();
      if (panel2.status === "won") {
        const m = panel2.cashedOut ?? 1;
        soundEngine.cashout(m);
        if (m >= 10) soundEngine.bigWin();
      }
      prevPanel2.current = panel2.status;
    }
  }, [panel2.status, panel2.cashedOut]);

  // Clean up the audio graph on unmount.
  useEffect(() => () => soundEngine.stopEngine(0.1), []);
}

export default useGameSound;
