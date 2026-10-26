"use client";

import { useGameStore } from "@/lib/store/game-store";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ResponsiveBetPanelProps {
  panelNumber: 1 | 2;
}

export default function ResponsiveBetPanel({
  panelNumber,
}: ResponsiveBetPanelProps) {
  const { status, balance, bets, multiplier } = useGameStore();
  const [betAmount, setBetAmount] = useState<string>("10");
  const [autoCashout, setAutoCashout] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

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
          userId: "demo-user",
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

      console.log("Bet placed:", data.bet);
    } catch (err) {
      setError("Failed to place bet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashout = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/crash/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cashout",
          betId: currentBet.id,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        setError(data.error);
      }

      console.log("Cashed out:", data.result);
    } catch (err) {
      setError("Failed to cashout");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickBet = (amount: number) => {
    setBetAmount(amount.toString());
  };

  const potentialWin =
    currentBet.amount > 0 && isBetPlaced
      ? currentBet.amount * multiplier
      : 0;

  return (
    <div
      className={`glass-strong rounded-lg p-4 transition-all ${
        isBetPlaced ? "border-2 border-cyan-500" : ""
      }`}
    >
      {/* Panel header with status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-300">
            BET {panelNumber}
          </span>
          {isBetPlaced && (
            <span className="text-xs px-2 py-1 bg-cyan-500 bg-opacity-20 text-cyan-300 rounded-full font-semibold">
              LIVE
            </span>
          )}
          {isBetWon && (
            <span className="text-xs px-2 py-1 bg-green-500 bg-opacity-20 text-green-300 rounded-full font-semibold">
              WIN
            </span>
          )}
          {isBetLost && (
            <span className="text-xs px-2 py-1 bg-red-500 bg-opacity-20 text-red-300 rounded-full font-semibold">
              LOSS
            </span>
          )}
        </div>
      </div>

      {/* Bet placed view */}
      {isBetPlaced && (
        <div className="space-y-3 mb-4">
          <div className="bg-slate-800 bg-opacity-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Stake</span>
              <span className="font-bold text-amber-300">
                ${currentBet.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Current Value</span>
              <span className="font-bold text-cyan-300">
                ${potentialWin.toFixed(2)}
              </span>
            </div>
            {isBetWon && currentBet.cashedOut && (
              <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                <span className="text-slate-400">Cashed at</span>
                <span className="font-bold text-green-400">
                  {currentBet.cashedOut.toFixed(2)}x
                </span>
              </div>
            )}
          </div>

          {!isBetWon && !isBetLost && status === "active" && (
            <button
              onClick={handleCashout}
              disabled={isLoading}
              className="btn btn-primary w-full font-bold text-lg py-3 h-auto"
            >
              {isLoading ? "PROCESSING..." : "CASHOUT NOW"}
            </button>
          )}
        </div>
      )}

      {/* Betting form - only show when accepting bets and no bet placed */}
      {!isBetPlaced && status === "accepting_bets" && (
        <div className="space-y-3">
          {/* Amount input group */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold">
              BET AMOUNT
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  max={balance}
                  className="input w-full pl-7 text-right font-bold text-base"
                />
              </div>
            </div>

            {/* Balance info */}
            <div className="text-xs text-slate-400 text-right">
              Balance: ${balance.toFixed(2)}
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="grid grid-cols-5 gap-2">
            {quickBets.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickBet(amount)}
                className="btn btn-secondary btn-small text-xs font-bold py-2"
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Advanced options toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-300 transition-colors py-2"
          >
            <span className="font-semibold">ADVANCED</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
          </button>

          {/* Advanced options */}
          {showAdvanced && (
            <div className="space-y-2 pt-2 border-t border-slate-700">
              <label className="text-xs text-slate-400 font-semibold">
                AUTO CASHOUT AT (Optional)
              </label>
              <input
                type="number"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                placeholder="e.g. 2.50"
                step="0.01"
                min="1.01"
                className="input w-full text-sm"
              />
              <p className="text-xs text-slate-500">
                Leave empty to manually cash out
              </p>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500 bg-opacity-10 rounded p-2">
              {error}
            </div>
          )}

          {/* Place bet button */}
          <button
            onClick={handlePlaceBet}
            disabled={isLoading}
            className="btn btn-primary w-full btn-large font-bold text-base"
          >
            {isLoading ? "PLACING BET..." : "PLACE BET"}
          </button>
        </div>
      )}

      {/* Result display */}
      {(isBetWon || isBetLost) && (
        <div
          className={`text-center py-3 rounded-lg font-bold text-lg ${
            isBetWon
              ? "bg-green-500 bg-opacity-10 text-green-400"
              : "bg-red-500 bg-opacity-10 text-red-400"
          }`}
        >
          {isBetWon ? "✓ WIN" : "✗ LOSS"}
        </div>
      )}

      {/* Idle state */}
      {!isBetPlaced && status !== "accepting_bets" && !isBetWon && !isBetLost && (
        <div className="text-center py-4 text-sm text-slate-500">
          {status === "waiting" && "Waiting for next round..."}
          {status === "active" && "Round in progress"}
          {status === "crashed" && "Round ended"}
        </div>
      )}
    </div>
  );
}
