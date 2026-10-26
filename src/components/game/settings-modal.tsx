"use client";

import { useGameStore } from "@/lib/store/game-store";
import { X } from "lucide-react";

export default function SettingsModal() {
  const {
    showSettings,
    toggleSettings,
    soundEnabled,
    toggleSound,
    musicEnabled,
    toggleMusic,
  } = useGameStore();

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="glass-strong rounded-lg max-w-sm w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-300">SETTINGS</h2>
          <button
            onClick={toggleSettings}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sound setting */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Audio
          </h3>
          <div className="flex items-center justify-between p-3 bg-slate-700 bg-opacity-30 rounded">
            <span className="text-sm text-slate-300">Sound Effects</span>
            <button
              onClick={toggleSound}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                soundEnabled ? "bg-green-600" : "bg-slate-600"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  soundEnabled ? "translate-x-6" : "translate-x-0.5"
                }`}
              ></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-700 bg-opacity-30 rounded">
            <div className="flex flex-col">
              <span className="text-sm text-slate-300">Background Music</span>
              <span className="text-[13px] text-slate-500">Ambient cinematic pad</span>
            </div>
            <button
              onClick={toggleMusic}
              disabled={!soundEnabled}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-40 ${
                musicEnabled && soundEnabled ? "bg-violet-600" : "bg-slate-600"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  musicEnabled ? "translate-x-6" : "translate-x-0.5"
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* Game settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Preferences
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-2 hover:bg-slate-700 hover:bg-opacity-20 rounded cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-slate-300">Auto-refresh balance</span>
            </label>
            <label className="flex items-center gap-3 p-2 hover:bg-slate-700 hover:bg-opacity-20 rounded cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-slate-300">Vibration feedback</span>
            </label>
            <label className="flex items-center gap-3 p-2 hover:bg-slate-700 hover:bg-opacity-20 rounded cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-slate-300">Animations</span>
            </label>
          </div>
        </div>

        {/* Responsible gaming */}
        <div className="space-y-3 pt-3 border-t border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Responsible Gaming
          </h3>
          <button className="w-full btn btn-secondary py-2 text-sm">
            Set Loss Limit
          </button>
          <button className="w-full btn btn-secondary py-2 text-sm">
            Self-Exclusion
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={toggleSettings}
          className="w-full btn btn-primary py-2"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
