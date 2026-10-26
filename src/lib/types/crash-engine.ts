/**
 * Universal Crash Engine Types
 * This is the foundation for all crash-themed games
 */

export type GameTheme = "skyrush" | "turbox" | "marketx" | "deepdive" | "goldrush";

export type RoundStatus = "pending" | "accepting_bets" | "active" | "crashed" | "settled";
export type BetStatus = "pending" | "active" | "won" | "lost" | "cancelled";

export interface CrashEngineConfig {
  gameName: string;
  theme: GameTheme;
  minBet: number;
  maxBet: number;
  maxWin: number;
  roundDuration: number; // in seconds
  countdownDuration: number; // in seconds
  autoCashoutEnabled: boolean;
  autoBetEnabled: boolean;
  enabled: boolean;
}

export interface CrashRound {
  id: number;
  gameId: string;
  roundNumber: number;
  crashPoint: number;
  currentMultiplier?: number;
  startedAt: Date;
  endedAt?: Date;
  status: RoundStatus;
  activeBets: number;
  totalWagered: number;
  seed?: string;
  hash?: string;
}

export interface Bet {
  id: number;
  userId: string;
  roundId: number;
  betAmount: number;
  multiplier?: number;
  status: BetStatus;
  cashedOutAt?: number;
  winAmount?: number;
  betPanel: 1 | 2;
  autoBet: boolean;
  autoCashout?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  username: string;
  balance: number;
  currency: string;
  isBot?: boolean;
}

export interface GameState {
  round: CrashRound;
  players: Record<string, Player>;
  bets: Bet[];
  roundStartTime: number; // timestamp
  crashPointTime: number; // calculated crash time
}

export interface CrashResult {
  roundId: number;
  crashPoint: number;
  timestamp: Date;
  totalBets: number;
  totalWagered: number;
  totalPaid: number;
}

export interface UserBetResult {
  betId: number;
  userId: string;
  roundId: number;
  betAmount: number;
  crashPoint: number;
  cashedOutAt?: number;
  status: BetStatus;
  winAmount?: number;
  profitLoss: number;
}

export interface LiveFeedEvent {
  type: "bet" | "cashout" | "loss" | "win" | "round_end";
  timestamp: Date;
  userId: string;
  username: string;
  amount?: number;
  multiplier?: number;
  roundId: number;
  isAnonymous?: boolean;
}

export interface CrashEngineServer {
  // Round management
  startRound(): Promise<CrashRound>;
  getRound(roundId: number): Promise<CrashRound>;
  getCrashPoint(): number;
  endRound(roundId: number): Promise<CrashResult>;

  // Betting
  placeBet(userId: string, betAmount: number, betPanel: 1 | 2, autoCashout?: number): Promise<Bet>;
  cashoutBet(betId: number): Promise<UserBetResult>;
  cancelBet(betId: number): Promise<void>;

  // Player state
  getPlayerBalance(userId: string): Promise<number>;
  updateBalance(userId: string, amount: number, type: "deposit" | "withdraw" | "win" | "loss"): Promise<number>;

  // Multiplier stream
  getCurrentMultiplier(roundId: number): Promise<number>;

  // History & stats
  getRoundHistory(limit: number): Promise<CrashRound[]>;
  getPlayerStats(userId: string): Promise<any>;
}
