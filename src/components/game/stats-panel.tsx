"use client";

import { useGameStore } from "@/lib/store/game-store";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

export default function StatsPanel() {
  const { balance, recentMultipliers } = useGameStore();
  const [stats, setStats] = useState({
    avgMultiplier: 0,
    highestMultiplier: 0,
    totalRounds: 0,
  });

  useEffect(() => {
    if (recentMultipliers.length > 0) {
      const avg =
        recentMultipliers.reduce((a, b) => a + b) / recentMultipliers.length;
      const highest = Math.max(...recentMultipliers);

      setStats({
        avgMultiplier: parseFloat(avg.toFixed(2)),
        highestMultiplier: highest,
        totalRounds: recentMultipliers.length,
      });
    }
  }, [recentMultipliers]);

  return (
    <div className="glass rounded-lg p-4 space-y-4">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <TrendingUp size={14} />
        Session Stats
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Balance */}
        <div className="bg-slate-700 bg-opacity-20 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Balance</p>
          <p className="text-lg font-bold text-amber-300">
            ${balance.toFixed(2)}
          </p>
        </div>

        {/* Total Rounds */}
        <div className="bg-slate-700 bg-opacity-20 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Rounds</p>
          <p className="text-lg font-bold text-cyan-300">{stats.totalRounds}</p>
        </div>

        {/* Average Multiplier */}
        <div className="bg-slate-700 bg-opacity-20 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Avg</p>
          <p className="text-lg font-bold text-orange-300">
            {stats.avgMultiplier.toFixed(2)}x
          </p>
        </div>

        {/* Highest Multiplier */}
        <div className="bg-slate-700 bg-opacity-20 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">High</p>
          <p className="text-lg font-bold text-green-300">
            {stats.highestMultiplier.toFixed(2)}x
          </p>
        </div>
      </div>

      {/* Win rate chart simulation */}
      <div className="pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-2">Recent Performance</p>
        <div className="flex items-end justify-between h-12 gap-1">
          {recentMultipliers.slice(0, 10).map((mult, idx) => (
            <div
              key={idx}
              className={`flex-1 rounded-t ${
                mult > 2
                  ? "bg-green-600 opacity-75"
                  : mult > 1.5
                    ? "bg-yellow-600 opacity-75"
                    : "bg-red-600 opacity-75"
              }`}
              style={{ height: `${(mult / 10) * 100}%` }}
              title={mult.toFixed(2) + "x"}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
