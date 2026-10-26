"use client";

import { useEffect, useState } from "react";
import { Settings, TrendingUp, Users, BarChart3, ToggleRight } from "lucide-react";

interface GameMetrics {
  totalRounds: number;
  totalBets: number;
  totalWagered: number;
  totalPayout: number;
  revenue: number;
  wins: number;
  losses: number;
  winRate: number;
  avgCrash: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<GameMetrics | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [minBet, setMinBet] = useState<string>("1");
  const [maxBet, setMaxBet] = useState<string>("10000");
  const [gameEnabled, setGameEnabled] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load metrics
        const metricsRes = await fetch("/api/admin/metrics?gameId=skyrush");
        const metricsData = await metricsRes.json();
        if (metricsData.success) {
          setMetrics(metricsData.metrics);
        }

        // Load config
        const configRes = await fetch("/api/admin/config?gameName=skyrush");
        const configData = await configRes.json();
        if (configData.success) {
          setConfig(configData.config);
          setMinBet(configData.config.minBet);
          setMaxBet(configData.config.maxBet);
          setGameEnabled(configData.config.enabled);
        }
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleConfigUpdate = async () => {
    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameName: "skyrush",
          minBet,
          maxBet,
          enabled: gameEnabled,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Configuration updated successfully!");
      }
    } catch (error) {
      alert("Failed to update configuration");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-amber-300">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <Settings className="w-6 h-6 text-slate-900" />
            </div>
            <h1 className="text-3xl font-bold text-amber-300">
              SkyRush Admin Dashboard
            </h1>
          </div>
          <p className="text-slate-400">Game configuration and metrics</p>
        </div>

        {/* Metrics grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Rounds */}
            <div className="glass-strong rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">Total Rounds</span>
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-3xl font-bold text-amber-300">
                {metrics.totalRounds}
              </div>
            </div>

            {/* Total Wagered */}
            <div className="glass-strong rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">Total Wagered</span>
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold text-cyan-300">
                ${metrics.totalWagered.toFixed(2)}
              </div>
            </div>

            {/* Revenue */}
            <div className="glass-strong rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">Revenue</span>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-300">
                ${metrics.revenue.toFixed(2)}
              </div>
            </div>

            {/* Win Rate */}
            <div className="glass-strong rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">Win Rate</span>
                <BarChart3 className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-yellow-300">
                {metrics.winRate.toFixed(1)}%
              </div>
            </div>

            {/* Active Users */}
            <div className="glass-strong rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">Active Users</span>
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-purple-300">
                {metrics.activeUsers}
              </div>
            </div>

            {/* Average Crash */}
            <div className="glass-strong rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">Avg Crash Point</span>
                <TrendingUp className="w-5 h-5 text-pink-400" />
              </div>
              <div className="text-3xl font-bold text-pink-300">
                {metrics.avgCrash.toFixed(2)}x
              </div>
            </div>
          </div>
        )}

        {/* Configuration */}
        {config && (
          <div className="glass-strong rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Game Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Min Bet */}
              <div className="space-y-2">
                <label className="text-sm text-slate-400 font-semibold">
                  Minimum Bet
                </label>
                <input
                  type="number"
                  value={minBet}
                  onChange={(e) => setMinBet(e.target.value)}
                  className="input w-full"
                />
              </div>

              {/* Max Bet */}
              <div className="space-y-2">
                <label className="text-sm text-slate-400 font-semibold">
                  Maximum Bet
                </label>
                <input
                  type="number"
                  value={maxBet}
                  onChange={(e) => setMaxBet(e.target.value)}
                  className="input w-full"
                />
              </div>

              {/* Game Enabled */}
              <div className="space-y-2">
                <label className="text-sm text-slate-400 font-semibold flex items-center gap-2">
                  <ToggleRight className="w-4 h-4" />
                  Game Enabled
                </label>
                <button
                  onClick={() => setGameEnabled(!gameEnabled)}
                  className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
                    gameEnabled
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {gameEnabled ? "ENABLED" : "DISABLED"}
                </button>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleConfigUpdate}
              className="btn btn-primary w-full py-3"
            >
              SAVE CONFIGURATION
            </button>
          </div>
        )}

        {/* Additional metrics */}
        {metrics && (
          <div className="glass-strong rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-amber-300">
              Detailed Metrics
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800 bg-opacity-30 rounded">
                <p className="text-xs text-slate-400">Total Bets</p>
                <p className="text-2xl font-bold text-slate-200">
                  {metrics.totalBets}
                </p>
              </div>
              <div className="p-4 bg-slate-800 bg-opacity-30 rounded">
                <p className="text-xs text-slate-400">Winning Bets</p>
                <p className="text-2xl font-bold text-green-400">{metrics.wins}</p>
              </div>
              <div className="p-4 bg-slate-800 bg-opacity-30 rounded">
                <p className="text-xs text-slate-400">Losing Bets</p>
                <p className="text-2xl font-bold text-red-400">{metrics.losses}</p>
              </div>
              <div className="p-4 bg-slate-800 bg-opacity-30 rounded">
                <p className="text-xs text-slate-400">Total Payout</p>
                <p className="text-2xl font-bold text-cyan-400">
                  ${metrics.totalPayout.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 pt-6">
          <p>SkyRush Admin Panel • Powered by Universal Crash Engine</p>
        </div>
      </div>
    </div>
  );
}
