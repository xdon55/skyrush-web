"use client";

import { useGameStore } from "@/lib/store/game-store";
import { useState } from "react";

interface BetPanelProps {
  panelNumber: 1 | 2;
}

export default function BetPanel({ panelNumber }: BetPanelProps) {
  const { status, balance, bets, multiplier } = useGameStore();
  const [betAmount, setBetAmount] = useState<string>("10");
  const [autoCashout, setAutoCashout] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const currentBet = panelNumber === 1 ? bets.panel1 : bets.panel2;
  const isBetPlaced = currentBet.status === "active";
  const isBetWon = currentBet.status === "won";
  const isBetLost = currentBet.status === "lost";

  const quickBets = [10, 25, 50, 100, 250];

  const handlePlaceBet = async () => {
    try {
      setError("");
      setIsLoading(true);

      const amount = parseFloat(betAmount);
      if (isNaN(amount) || amount <= 0) {
        setError("Enter a valid amount");
        return;
      }

      if (amount > balance) {
        setError("Insufficient balance");
        return;
      }

      // Call API to place bet
      const response = await fetch("/api/crash/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "place_bet",
          userId: "demo-user", // In real app, use actual user ID
          betAmount: amount,
          betPanel: panelNumber,
          autoCashout: autoCashout ? parseFloat(autoCashout) : undefined,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      // Update game state
      const { useGameStore: store } = await import("@/lib/store/game-store");
      // Note: In real app, would update store with actual bet data
      console.log("Bet placed:", data.bet);
    } catch (err) {
      setError("Failed to place bet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickBet = (amount: number) => {
    setBetAmount(amount.toString());
  };

  return (
    <div className="glass-strong rounded-lg p-4 flex flex-col gap-4">
      {/* Panel header */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-300">BET {panelNumber}</h3>
        {isBetPlaced && (
          <span className="text-xs px-2 py-1 bg-cyan-500 bg-opacity-20 text-cyan-300 rounded">
            ACTIVE
          </span>
        )}
        {isBetWon && (
          <span className="text-xs px-2 py-1 bg-green-500 bg-opacity-20 text-green-300 rounded">
            WON
          </span>
        )}
        {isBetLost && (
          <span className="text-xs px-2 py-1 bg-red-500 bg-opacity-20 text-red-300 rounded">
            LOST
          </span>
        )}
      </div>

      {/* Bet amount display if placed */}
      {isBetPlaced && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Stake:</span>
            <span className="text-amber-300 font-semibold">
              ${currentBet.amount.toFixed(2)}
            </span>
          </div>
          {isBetWon && currentBet.cashedOut && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Cashed out:</span>
              <span className="text-green-400 font-semibold">
                {currentBet.cashedOut.toFixed(2)}x
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bet input section */}
      {!isBetPlaced && status === "accepting_bets" && (
        <>
          {/* Amount input */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold">AMOUNT</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                $
              </span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="0.00"
                className="input w-full pl-7 text-right"
              />
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="grid grid-cols-5 gap-1">
            {quickBets.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickBet(amount)}
                className="btn btn-secondary btn-small text-xs"
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Auto-cashout input */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold">
              AUTO CASHOUT (Optional)
            </label>
            <input
              type="number"
              value={autoCashout}
              onChange={(e) => setAutoCashout(e.target.value)}
              placeholder="e.g. 2.50"
              step="0.01"
              className="input w-full"
            />
          </div>

          {/* Error message */}
          {error && <div className="text-xs text-red-400">{error}</div>}

          {/* Place bet button */}
          <button
            onClick={handlePlaceBet}
            disabled={isLoading}
            className="btn btn-primary w-full btn-large"
          >
            {isLoading ? "PLACING..." : "PLACE BET"}
          </button>
        </>
      )}

      {/* Active bet display */}
      {isBetPlaced && status === "active" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Current Value:</span>
            <span className="text-lg font-bold text-amber-300">
              ${(currentBet.amount * multiplier).toFixed(2)}
            </span>
          </div>
          <button
            onClick={handlePlaceBet}
            className="btn btn-primary w-full btn-large"
          >
            CASHOUT NOW
          </button>
          {autoCashout && (
            <p className="text-xs text-slate-400 text-center">
              Auto-cashout at {autoCashout}x
            </p>
          )}
        </div>
      )}

      {/* Result display */}
      {(isBetWon || isBetLost) && (
        <div className={`text-center py-2 rounded ${isBetWon ? "bg-green-500 bg-opacity-10" : "bg-red-500 bg-opacity-10"}`}>
          <p className={`text-sm font-bold ${isBetWon ? "text-green-400" : "text-red-400"}`}>
            {isBetWon ? "WIN!" : "LOSS"}
          </p>
        </div>
      )}
    </div>
  );
}
