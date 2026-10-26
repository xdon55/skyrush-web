import { create } from "zustand";

export type RoundStatus = "waiting" | "accepting_bets" | "active" | "crashed" | "settling";

export interface PanelBet {
  id: number;
  amount: number;
  status: "idle" | "active" | "won" | "lost" | "cashout_pending";
  cashedOut?: number;
  winAmount?: number;
  autoCashout?: number | null;
  autoCashoutEnabled?: boolean;
}

/** A bet scheduled to be placed when the next betting window opens. */
export interface QueuedBet {
  amount: number;
  autoCashout: number | null;
}

export type PanelKey = "panel1" | "panel2";

export interface GameState {
  // Game state
  roundId: number | null;
  roundNumber: number;
  status: RoundStatus;
  multiplier: number;
  crashPoint: number | null;
  countdown: number; // seconds remaining for betting

  // Player state
  userId: string;
  username: string;
  balance: number;
  currency: string;

  // Bets
  bets: {
    panel1: PanelBet;
    panel2: PanelBet;
  };

  /** Bets waiting for the next round (placed while a round was in flight). */
  queuedBets: {
    panel1: QueuedBet | null;
    panel2: QueuedBet | null;
  };

  /** Auto-bet: automatically re-stake every round. */
  autoBet: {
    panel1: boolean;
    panel2: boolean;
  };

  /** Remembers the last stake so auto-bet can repeat it. */
  lastBet: {
    panel1: QueuedBet | null;
    panel2: QueuedBet | null;
  };

  // History
  recentMultipliers: number[];
  playerHistory: any[];

  // UI
  soundEnabled: boolean;
  musicEnabled: boolean;
  fullscreenMode: boolean;
  showSettings: boolean;
  showInfo: boolean;
  showStats: boolean;
  showSecondPanel: boolean;

  // Actions
  setRound: (roundId: number, roundNumber: number, crashPoint: number) => void;
  setCountdown: (countdown: number) => void;
  setMultiplier: (multiplier: number) => void;
  setStatus: (status: RoundStatus) => void;
  setCrashed: (crashPoint: number) => void;
  
  // Betting actions - now with proper logic
  placeBet: (panel: 1 | 2, amount: number, autoCashout?: number | null) => { success: boolean; error?: string; betId?: number };
  /** Places now if betting is open, otherwise queues for the next round. */
  requestBet: (
    panel: 1 | 2,
    amount: number,
    autoCashout?: number | null
  ) => { success: boolean; error?: string; queued?: boolean };
  cancelQueuedBet: (panel: 1 | 2) => void;
  setAutoBet: (panel: 1 | 2, enabled: boolean) => void;
  /** Flushes queued bets into the live round. Called when betting opens. */
  processQueuedBets: () => void;
  cancelBet: (panel: 1 | 2) => void;
  cashoutBet: (panel: 1 | 2, multiplier: number) => { success: boolean; winAmount?: number };
  setBet: (panel: 1 | 2, betId: number, amount: number) => void; // legacy compat
  cashedOutBet: (panel: 1 | 2, multiplier: number) => void;
  loseBet: (panel: 1 | 2) => void;
  updateBalance: (balance: number) => void;
  addToHistory: (multiplier: number) => void;
  resetRound: () => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleFullscreen: () => void;
  toggleSettings: () => void;
  toggleInfo: () => void;
  toggleStats: () => void;
  toggleSecondPanel: () => void;
  setShowSecondPanel: (visible: boolean) => void;
  setPlayer: (userId: string, username: string, balance: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  roundId: null,
  roundNumber: 0,
  status: "waiting",
  multiplier: 1,
  crashPoint: null,
  countdown: 5,
  userId: "",
  username: "",
  balance: 1000,
  currency: "USD",
  bets: {
    panel1: { id: 0, amount: 0, status: "idle", autoCashout: null },
    panel2: { id: 0, amount: 0, status: "idle", autoCashout: null },
  },
  queuedBets: { panel1: null, panel2: null },
  autoBet: { panel1: false, panel2: false },
  lastBet: { panel1: null, panel2: null },
  recentMultipliers: [],
  playerHistory: [],
  soundEnabled: true,
  musicEnabled: true,
  fullscreenMode: false,
  showSettings: false,
  showInfo: false,
  showStats: false,
  showSecondPanel: false,

  // Actions
  setRound: (roundId, roundNumber, crashPoint) =>
    set({
      roundId,
      roundNumber,
      crashPoint,
      status: "accepting_bets",
      multiplier: 1,
      countdown: 5,
    }),

  setCountdown: (countdown) => set({ countdown }),

  setMultiplier: (multiplier) =>
    set({
      multiplier: parseFloat(multiplier.toFixed(2)),
    }),

  setStatus: (status) => set({ status: status as RoundStatus }),

  setCrashed: (crashPoint) => set({ status: "crashed", crashPoint }),

  // NEW: Robust placeBet with balance check
  placeBet: (panel, amount, autoCashout = null) => {
    const state = get();
    
    // Validate game status - can only place during waiting or accepting_bets
    if (state.status !== "accepting_bets" && state.status !== "waiting") {
      return { success: false, error: "Betting is closed - wait for next round" };
    }

    // Validate amount
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, error: "Invalid bet amount" };
    }

    if (amount > state.balance) {
      return { success: false, error: "Insufficient balance" };
    }

    if (amount < 0.1) {
      return { success: false, error: "Minimum bet is $0.10" };
    }

    if (amount > 1000) {
      return { success: false, error: "Maximum bet is $1000" };
    }

    // Check if panel already has active bet
    const currentPanel = panel === 1 ? state.bets.panel1 : state.bets.panel2;
    if (currentPanel.status === "active") {
      return { success: false, error: "Bet already placed - cancel first" };
    }

    const betId = Date.now() + Math.floor(Math.random() * 1000) + panel;
    const key: PanelKey = panel === 1 ? "panel1" : "panel2";

    // Deduct balance immediately
    set({
      balance: parseFloat((state.balance - amount).toFixed(2)),
      bets: {
        ...state.bets,
        [key]: {
          id: betId,
          amount,
          status: "active" as const,
          autoCashout: autoCashout,
          cashedOut: undefined,
          winAmount: undefined,
        },
      },
      // Remember the stake so auto-bet can repeat it next round.
      lastBet: { ...state.lastBet, [key]: { amount, autoCashout: autoCashout ?? null } },
    });

    return { success: true, betId };
  },

  // Place immediately when betting is open, otherwise schedule for next round.
  requestBet: (panel, amount, autoCashout = null) => {
    const state = get();
    const key: PanelKey = panel === 1 ? "panel1" : "panel2";

    if (state.status === "accepting_bets" || state.status === "waiting") {
      return state.placeBet(panel, amount, autoCashout);
    }

    // Round in flight -> validate then queue.
    if (amount <= 0 || isNaN(amount)) return { success: false, error: "Invalid bet amount" };
    if (amount < 0.1) return { success: false, error: "Minimum bet is $0.10" };
    if (amount > 1000) return { success: false, error: "Maximum bet is $1000" };
    if (amount > state.balance) return { success: false, error: "Insufficient balance" };
    if (state.bets[key].status === "active") {
      return { success: false, error: "Bet already active" };
    }

    set({
      queuedBets: { ...state.queuedBets, [key]: { amount, autoCashout: autoCashout ?? null } },
      lastBet: { ...state.lastBet, [key]: { amount, autoCashout: autoCashout ?? null } },
    });

    return { success: true, queued: true };
  },

  cancelQueuedBet: (panel) => {
    const state = get();
    const key: PanelKey = panel === 1 ? "panel1" : "panel2";
    set({
      queuedBets: { ...state.queuedBets, [key]: null },
      // Cancelling a queued bet also stops the auto-bet loop for that panel.
      autoBet: { ...state.autoBet, [key]: false },
    });
  },

  setAutoBet: (panel, enabled) => {
    const state = get();
    const key: PanelKey = panel === 1 ? "panel1" : "panel2";
    set({ autoBet: { ...state.autoBet, [key]: enabled } });
  },

  processQueuedBets: () => {
    const state = get();
    (["panel1", "panel2"] as PanelKey[]).forEach((key) => {
      const queued = state.queuedBets[key];
      if (!queued) return;

      const panelNum: 1 | 2 = key === "panel1" ? 1 : 2;
      const result = get().placeBet(panelNum, queued.amount, queued.autoCashout);

      // Clear the slot either way; on failure also stop auto-bet so we
      // do not spam a failing stake every round.
      set((s) => ({
        queuedBets: { ...s.queuedBets, [key]: null },
        autoBet: result.success ? s.autoBet : { ...s.autoBet, [key]: false },
      }));
    });
  },

  cancelBet: (panel) => {
    const state = get();
    const currentPanel = panel === 1 ? state.bets.panel1 : state.bets.panel2;

    if (currentPanel.status !== "active") return;
    if (state.status === "active") return; // cannot cancel after takeoff

    // Refund
    set({
      balance: parseFloat((state.balance + currentPanel.amount).toFixed(2)),
      bets: {
        ...state.bets,
        [panel === 1 ? "panel1" : "panel2"]: {
          id: 0,
          amount: 0,
          status: "idle" as const,
          autoCashout: null,
        },
      },
    });
  },

  cashoutBet: (panel, multiplier) => {
    const state = get();
    const currentPanel = panel === 1 ? state.bets.panel1 : state.bets.panel2;

    if (currentPanel.status !== "active") {
      return { success: false };
    }

    if (state.status !== "active") {
      return { success: false };
    }

    if (state.crashPoint && multiplier >= state.crashPoint) {
      return { success: false };
    }

    const winAmount = parseFloat((currentPanel.amount * multiplier).toFixed(2));

    set({
      balance: parseFloat((state.balance + winAmount).toFixed(2)),
      bets: {
        ...state.bets,
        [panel === 1 ? "panel1" : "panel2"]: {
          ...currentPanel,
          status: "won" as const,
          cashedOut: multiplier,
          winAmount,
        },
      },
      playerHistory: [
        {
          roundNumber: state.roundNumber,
          amount: currentPanel.amount,
          multiplier,
          win: winAmount,
          profit: winAmount - currentPanel.amount,
          timestamp: new Date(),
        },
        ...state.playerHistory,
      ].slice(0, 100),
    });

    return { success: true, winAmount };
  },

  // Legacy compat methods
  setBet: (panel, betId, amount) => {
    // Use placeBet logic instead but keep for API compat
    const state = get();
    set({
      bets: {
        ...state.bets,
        [panel === 1 ? "panel1" : "panel2"]: {
          id: betId,
          amount,
          status: "active" as const,
          autoCashout: null,
        },
      },
    });
  },

  cashedOutBet: (panel, multiplier) => {
    const state = get();
    const currentPanel = panel === 1 ? state.bets.panel1 : state.bets.panel2;
    const winAmount = parseFloat((currentPanel.amount * multiplier).toFixed(2));
    
    set({
      balance: parseFloat((state.balance + winAmount).toFixed(2)),
      bets: {
        ...state.bets,
        [panel === 1 ? "panel1" : "panel2"]: {
          ...currentPanel,
          status: "won",
          cashedOut: multiplier,
          winAmount,
        },
      },
    });
  },

  loseBet: (panel) => {
    const state = get();
    const bets = state.bets;
    if (panel === 1) {
      if (bets.panel1.status === "active") {
        set({
          bets: {
            ...bets,
            panel1: { ...bets.panel1, status: "lost" as const },
          },
        });
      }
    } else {
      if (bets.panel2.status === "active") {
        set({
          bets: {
            ...bets,
            panel2: { ...bets.panel2, status: "lost" as const },
          },
        });
      }
    }
  },

  updateBalance: (balance) => set({ balance }),

  addToHistory: (multiplier) => {
    const history = get().recentMultipliers;
    set({
      recentMultipliers: [multiplier, ...history].slice(0, 50),
    });
  },

  resetRound: () => {
    const state = get();

    // Auto-bet: re-queue the previous stake for any panel with auto-bet on
    // and nothing already queued manually.
    const nextQueued = { ...state.queuedBets };
    (["panel1", "panel2"] as PanelKey[]).forEach((key) => {
      if (state.autoBet[key] && !nextQueued[key] && state.lastBet[key]) {
        nextQueued[key] = state.lastBet[key];
      }
    });

    set({
      roundId: null,
      status: "waiting",
      multiplier: 1,
      crashPoint: null,
      countdown: 5,
      queuedBets: nextQueued,
      bets: {
        panel1: { id: 0, amount: 0, status: "idle", autoCashout: null },
        panel2: { id: 0, amount: 0, status: "idle", autoCashout: null },
      },
    });
  },

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),

  toggleFullscreen: () => set((state) => ({ fullscreenMode: !state.fullscreenMode })),

  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),

  toggleInfo: () => set((state) => ({ showInfo: !state.showInfo })),

  toggleStats: () => set((state) => ({ showStats: !state.showStats })),

  // Show / hide the second bet panel. Hiding refunds a pending bet so the
  // player can never lose money by collapsing a panel.
  toggleSecondPanel: () => {
    const state = get();
    const willHide = state.showSecondPanel;

    if (willHide && state.bets.panel2.status === "active") {
      // Refund only while betting is still open; during flight we keep it open.
      if (state.status === "active") return;
      set({
        balance: parseFloat((state.balance + state.bets.panel2.amount).toFixed(2)),
        bets: {
          ...state.bets,
          panel2: { id: 0, amount: 0, status: "idle", autoCashout: null },
        },
      });
    }

    if (willHide) {
      // Hiding the panel must also cancel its queued bet and auto-bet loop.
      set((s) => ({
        queuedBets: { ...s.queuedBets, panel2: null },
        autoBet: { ...s.autoBet, panel2: false },
      }));
    }

    set({ showSecondPanel: !willHide });
  },

  setShowSecondPanel: (visible) => set({ showSecondPanel: visible }),

  setPlayer: (userId, username, balance) => set({ userId, username, balance }),
}));
