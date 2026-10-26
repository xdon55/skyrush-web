"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store/game-store";
import { Minus, Plus, X, Clock } from "lucide-react";
import soundEngine from "@/lib/audio/sound-engine";

interface SingleBetControlProps {
  panelNumber: 1 | 2;
  /** Renders the collapse button on the optional second panel. */
  removable?: boolean;
  onRemove?: () => void;
  /** Renders the "add second panel" icon in this panel's header. */
  canAddPanel?: boolean;
  onAddPanel?: () => void;
}

function SingleBetControl({
  panelNumber,
  removable,
  onRemove,
  canAddPanel,
  onAddPanel,
}: SingleBetControlProps) {
  const status = useGameStore((s) => s.status);
  const balance = useGameStore((s) => s.balance);
  const multiplier = useGameStore((s) => s.multiplier);
  const bets = useGameStore((s) => s.bets);
  const queuedBets = useGameStore((s) => s.queuedBets);
  const autoBetMap = useGameStore((s) => s.autoBet);

  const requestBet = useGameStore((s) => s.requestBet);
  const cancelBet = useGameStore((s) => s.cancelBet);
  const cancelQueuedBet = useGameStore((s) => s.cancelQueuedBet);
  const cashoutBet = useGameStore((s) => s.cashoutBet);
  const setAutoBet = useGameStore((s) => s.setAutoBet);

  const key = panelNumber === 1 ? "panel1" : "panel2";

  const [activeTab, setActiveTab] = useState<"bet" | "auto">("bet");
  const [betAmount, setBetAmount] = useState<string>("10.00");
  const [autoCashoutValue, setAutoCashoutValue] = useState<string>("2.00");
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentBet = bets[key];
  const queued = queuedBets[key];
  const autoBetOn = autoBetMap[key];

  const isBetActive = currentBet.status === "active";
  const isBetWon = currentBet.status === "won";
  const isBetLost = currentBet.status === "lost";

  const bettingOpen = status === "accepting_bets" || status === "waiting";
  const canCancel = isBetActive && bettingOpen;
  const canCashout = isBetActive && status === "active";

  const quickPresets = [1, 2, 5, 10];

  const flash = (msg: string) => {
    setErrorMsg(msg);
    window.setTimeout(() => setErrorMsg(null), 2600);
  };

  const handleAmountChange = (val: string) => {
    if (/^\d*\.?\d{0,2}$/.test(val) || val === "") {
      setBetAmount(val);
      setErrorMsg(null);
    }
  };

  const handleStep = (delta: number) => {
    soundEngine.unlock();
    soundEngine.click();
    const current = parseFloat(betAmount) || 0;
    const next = Math.max(0.1, parseFloat((current + delta).toFixed(2)));
    setBetAmount(next.toFixed(2));
  };

  const handlePlaceBet = () => {
    soundEngine.unlock();
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      flash("Invalid amount");
      return;
    }
    const result = requestBet(
      panelNumber,
      amount,
      autoCashoutEnabled ? parseFloat(autoCashoutValue) : null
    );
    if (!result.success) {
      flash(result.error || "Failed to place bet");
    } else {
      setErrorMsg(null);
      if (result.queued) soundEngine.click();
    }
  };

  const handleCancel = () => {
    soundEngine.unlock();
    soundEngine.click();
    cancelBet(panelNumber);
  };

  const handleCancelQueued = () => {
    soundEngine.unlock();
    soundEngine.click();
    cancelQueuedBet(panelNumber);
  };

  const handleCashout = () => {
    soundEngine.unlock();
    const result = cashoutBet(panelNumber, multiplier);
    if (!result.success) flash("Cashout failed");
  };

  const toggleAutoBet = () => {
    soundEngine.unlock();
    soundEngine.click();
    const next = !autoBetOn;
    setAutoBet(panelNumber, next);
    // Turning auto-bet on mid-round immediately schedules the next stake.
    if (next && !queued && !isBetActive) {
      const amount = parseFloat(betAmount);
      if (!isNaN(amount) && amount > 0) {
        requestBet(panelNumber, amount, autoCashoutEnabled ? parseFloat(autoCashoutValue) : null);
      }
    }
  };

  const potentialPayout =
    currentBet.status === "active" ? (currentBet.amount * multiplier).toFixed(2) : "0.00";

  const inputsLocked = isBetActive || !!queued;

  return (
    <div className="bg-[#1a1d26] border border-[#2a2d3a] rounded-lg p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 text-xs select-none shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
      {/* Tabs + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex bg-[#0f1117] p-0.5 rounded-full gap-0.5">
          <button
            onClick={() => setActiveTab("bet")}
            className={`px-3.5 sm:px-5 py-1 rounded-full font-bold text-[14px] sm:text-[16px] transition-all ${
              activeTab === "bet"
                ? "bg-[#2a2d3a] text-white shadow-sm"
                : "text-[#6b7280] hover:text-[#9ca3af]"
            }`}
          >
            Bet
          </button>
          <button
            onClick={() => setActiveTab("auto")}
            className={`px-3.5 sm:px-5 py-1 rounded-full font-bold text-[14px] sm:text-[16px] transition-all ${
              activeTab === "auto"
                ? "bg-[#2a2d3a] text-white shadow-sm"
                : "text-[#6b7280] hover:text-[#9ca3af]"
            }`}
          >
            Auto
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {autoBetOn && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-black border border-cyan-500/30">
              AUTO
            </span>
          )}
          {queued && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-black border border-amber-500/30">
              QUEUED
            </span>
          )}
          {isBetActive && !queued && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-black border border-emerald-500/30">
              PLACED
            </span>
          )}
          {isBetWon && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black">
              WON {currentBet.cashedOut?.toFixed(2)}x
            </span>
          )}
          {isBetLost && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-black">
              LOST
            </span>
          )}

          {/* Add the optional second panel — icon lives in panel 1's header */}
          {canAddPanel && (
            <button
              onClick={() => {
                soundEngine.unlock();
                soundEngine.click();
                onAddPanel?.();
              }}
              title="Add a second bet panel"
              aria-label="Add a second bet panel"
              className="w-6 h-6 rounded-full bg-[#0f1117] hover:bg-emerald-500/15 border border-[#2a2d3a] hover:border-emerald-500/50 text-[#64748b] hover:text-emerald-400 flex items-center justify-center transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}

          {removable && (
            <button
              onClick={() => {
                soundEngine.unlock();
                soundEngine.click();
                onRemove?.();
              }}
              disabled={canCashout}
              title={canCashout ? "Cannot close during flight" : "Remove this bet panel"}
              className="w-6 h-6 rounded-full bg-[#0f1117] hover:bg-red-500/15 border border-[#2a2d3a] hover:border-red-500/40 text-[#64748b] hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="text-[12px] text-red-400 bg-red-950/30 border border-red-800/50 px-2 py-1 rounded text-center font-bold">
          {errorMsg}
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-12 gap-2 items-stretch">
        {/* Left: amount + presets */}
        <div className="col-span-5 flex flex-col gap-1.5">
          <div className="flex items-center bg-[#0f1117] border border-[#2a2d3a] rounded-full p-0.5 h-[32px] sm:h-[36px]">
            <button
              onClick={() => handleStep(-1)}
              disabled={inputsLocked}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#1e212e] hover:bg-[#2a2d3a] disabled:opacity-40 text-[#9ca3af] hover:text-white flex items-center justify-center transition-colors ml-0.5 shrink-0"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="text"
              inputMode="decimal"
              value={betAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              disabled={inputsLocked}
              className="w-full min-w-0 bg-transparent text-center font-bold text-[16px] sm:text-[18px] text-white focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => handleStep(1)}
              disabled={inputsLocked}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#1e212e] hover:bg-[#2a2d3a] disabled:opacity-40 text-[#9ca3af] hover:text-white flex items-center justify-center transition-colors mr-0.5 shrink-0"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {quickPresets.map((val) => (
              <button
                key={val}
                onClick={() => {
                  if (inputsLocked) return;
                  soundEngine.unlock();
                  soundEngine.click();
                  setBetAmount(val.toFixed(2));
                }}
                disabled={inputsLocked}
                className="bg-[#0f1117] hover:bg-[#1e212e] disabled:opacity-30 text-[#9ca3af] hover:text-white py-1 rounded-full font-bold text-[12px] sm:text-[13px] border border-[#1e212e] transition-all"
              >
                {val}
              </button>
            ))}
          </div>

          {activeTab === "auto" && (
            <label className="flex items-center gap-1.5 cursor-pointer text-[12px] sm:text-[13px] text-[#9ca3af] font-bold bg-[#0f1117] px-2 py-1 rounded-full border border-[#1e212e] justify-between">
              <span className="flex items-center gap-1 truncate">
                <input
                  type="checkbox"
                  checked={autoCashoutEnabled}
                  onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
                  disabled={inputsLocked}
                  className="rounded w-3 h-3 bg-[#1e212e] border-[#2a2d3a] text-emerald-500 focus:ring-0 disabled:opacity-50 shrink-0"
                />
                <span className="truncate">Auto Cash Out</span>
              </span>
              {autoCashoutEnabled && (
                <span className="flex items-center gap-0.5 shrink-0">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={autoCashoutValue}
                    onChange={(e) => {
                      if (/^\d*\.?\d{0,2}$/.test(e.target.value) || e.target.value === "") {
                        setAutoCashoutValue(e.target.value);
                      }
                    }}
                    disabled={inputsLocked}
                    className="w-9 bg-[#1a1d26] text-center font-bold text-[12px] text-amber-300 border border-[#2a2d3a] rounded-full py-0.5 disabled:opacity-50"
                  />
                  <span className="text-[#6b7280] font-bold text-[11px]">x</span>
                </span>
              )}
            </label>
          )}

          <div className="text-[11px] sm:text-[12px] text-[#6b7280] px-1 truncate">
            Balance:{" "}
            <span className="text-[#9ca3af] font-mono font-bold">{balance.toFixed(2)}$</span>
          </div>
        </div>

        {/* Right: main action */}
        <div className="col-span-7 flex flex-col gap-1">
          {canCashout ? (
            <button
              onClick={handleCashout}
              className="animate-cashout-pulse w-full flex-1 min-h-[56px] sm:min-h-[68px] bg-gradient-to-b from-[#f59e0b] to-[#d97706] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white font-black rounded-xl flex flex-col items-center justify-center transition-colors active:scale-[0.98] border border-amber-400/50 relative overflow-hidden px-2"
            >
              <span className="text-[13px] sm:text-[16px] uppercase tracking-wider opacity-90 leading-none">
                Cash Out
              </span>
              <span className="text-[19px] sm:text-[23px] font-mono font-black leading-tight mt-0.5 truncate max-w-full">
                {potentialPayout}$
              </span>
            </button>
          ) : isBetWon ? (
            <div className="animate-win-glow w-full flex-1 min-h-[56px] sm:min-h-[68px] bg-gradient-to-b from-emerald-900/40 to-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-bold rounded-xl flex flex-col items-center justify-center text-center p-1.5">
              <span className="text-[12px] uppercase tracking-wider text-emerald-400/80">
                You Won!
              </span>
              <span className="animate-value-pop text-[18px] sm:text-[20px] font-mono font-black text-emerald-200">
                +{currentBet.winAmount?.toFixed(2)}$
              </span>
              <span className="text-[12px] font-bold text-emerald-400">
                @ {currentBet.cashedOut?.toFixed(2)}x
              </span>
            </div>
          ) : isBetLost ? (
            <div className="animate-lose-shake w-full flex-1 min-h-[56px] sm:min-h-[68px] bg-[#0f1117] border border-red-900/30 text-red-400/80 font-bold rounded-xl flex flex-col items-center justify-center text-center p-1.5">
              <span className="text-[12px] uppercase tracking-wider">Flew Away</span>
              <span className="text-[14px] font-mono text-red-300/80">
                -{currentBet.amount.toFixed(2)}$
              </span>
            </div>
          ) : queued ? (
            <button
              onClick={handleCancelQueued}
              className="w-full flex-1 min-h-[56px] sm:min-h-[68px] bg-[#0f1117] hover:bg-[#1e212e] border border-amber-500/40 hover:border-amber-500/70 text-amber-400 font-bold rounded-xl flex flex-col items-center justify-center transition-all active:scale-[0.98] px-2 gap-0.5"
            >
              <span className="flex items-center gap-1 text-[12px] sm:text-[13px] uppercase tracking-wider">
                <Clock className="w-3 h-3" /> Next Round
              </span>
              <span className="text-[17px] sm:text-[19px] font-mono font-black">
                {queued.amount.toFixed(2)}$
              </span>
              <span className="text-[11px] opacity-70">Tap to cancel</span>
            </button>
          ) : canCancel ? (
            <button
              onClick={handleCancel}
              className="w-full flex-1 min-h-[56px] sm:min-h-[68px] bg-[#0f1117] hover:bg-[#1e212e] border border-red-500/30 hover:border-red-500/60 text-red-400 font-bold rounded-xl flex flex-col items-center justify-center transition-all active:scale-[0.98] px-2 gap-0.5"
            >
              <span className="text-[12px] sm:text-[13px] uppercase tracking-wider">Cancel</span>
              <span className="text-[17px] sm:text-[19px] font-mono font-black">
                {currentBet.amount.toFixed(2)}$
              </span>
            </button>
          ) : (
            /* Always enabled: places now, or queues for the next round */
            <button
              onClick={handlePlaceBet}
              className="w-full flex-1 min-h-[56px] sm:min-h-[68px] rounded-xl font-black tracking-wider flex flex-col items-center justify-center transition-all active:scale-[0.98] border relative overflow-hidden px-2 bg-gradient-to-b from-[#22c55e] to-[#16a34a] hover:from-[#4ade80] hover:to-[#22c55e] text-white border-emerald-400/30 shadow-[0_4px_0_rgba(0,0,0,0.3),0_0_20px_rgba(34,197,94,0.3)]"
            >
              <span className="relative z-10 drop-shadow leading-none text-[23px] sm:text-[26px]">
                BET
              </span>
              <span className="text-[12px] sm:text-[13px] font-bold opacity-85 relative z-10 font-mono mt-0.5">
                {bettingOpen
                  ? `${(parseFloat(betAmount) || 0).toFixed(2)}$`
                  : "NEXT ROUND"}
              </span>
            </button>
          )}

          {activeTab === "auto" && (
            <button
              onClick={toggleAutoBet}
              className="flex items-center justify-between text-[11px] sm:text-[12px] px-2 py-1 rounded-full bg-[#0f1117] border border-[#1e212e] text-[#6b7280] hover:text-[#9ca3af] transition-colors"
            >
              <span className="font-bold uppercase tracking-wider">Auto Bet</span>
              <span
                className={`relative w-7 h-4 rounded-full transition-colors ${
                  autoBetOn ? "bg-emerald-500" : "bg-[#2a2d3a]"
                }`}
              >
                <span
                  className={`absolute top-[2px] w-3 h-3 rounded-full bg-white transition-transform ${
                    autoBetOn ? "translate-x-[14px]" : "translate-x-[2px]"
                  }`}
                />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DualBetControls() {
  const showSecondPanel = useGameStore((s) => s.showSecondPanel);
  const toggleSecondPanel = useGameStore((s) => s.toggleSecondPanel);

  return (
    <div
      className={`grid gap-2 w-full ${
        showSecondPanel ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
      }`}
    >
      <SingleBetControl
        panelNumber={1}
        canAddPanel={!showSecondPanel}
        onAddPanel={toggleSecondPanel}
      />

      {showSecondPanel && (
        <SingleBetControl panelNumber={2} removable onRemove={toggleSecondPanel} />
      )}
    </div>
  );
}
