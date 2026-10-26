/**
 * Universal Crash Engine
 * Core game logic that all crash games use
 */

import { db } from "@/db";
import {
  users,
  crashRounds,
  bets,
  transactions,
  userStats,
  gameConfig,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  CrashRound,
  Bet,
  CrashEngineConfig,
  RoundStatus,
  BetStatus,
  UserBetResult,
  GameTheme,
} from "@/lib/types/crash-engine";
import {
  generateCrashPoint,
  calculateMultiplier,
  isValidCashout,
  calculateWin,
  hashSeed,
} from "./multiplier";
import crypto from "crypto";

export class CrashEngine {
  private config: CrashEngineConfig;
  private currentRound: CrashRound | null = null;
  private roundStartTime: number = 0;
  private crashPointMultiplier: number = 0;

  constructor(config: CrashEngineConfig) {
    this.config = config;
  }

  /**
   * Initialize engine with config from database
   */
  static async initialize(gameName: string): Promise<CrashEngine> {
    const gameConfigs = await db
      .select()
      .from(gameConfig)
      .where(eq(gameConfig.gameName, gameName));

    if (gameConfigs.length === 0) {
      throw new Error(`Game config not found: ${gameName}`);
    }

    const cfg = gameConfigs[0];
    return new CrashEngine({
      gameName: cfg.gameName,
      theme: (cfg.theme as GameTheme) || "skyrush",
      minBet: Number(cfg.minBet),
      maxBet: Number(cfg.maxBet),
      maxWin: Number(cfg.maxWin),
      roundDuration: cfg.roundDuration,
      countdownDuration: cfg.countdownDuration,
      autoCashoutEnabled: cfg.autoClashoutEnabled,
      autoBetEnabled: cfg.autoBetEnabled,
      enabled: cfg.enabled,
    });
  }

  /**
   * Start a new crash round
   */
  async startRound(): Promise<CrashRound> {
    if (!this.config.enabled) {
      throw new Error("Game is disabled");
    }

    // Generate fair crash point
    const seed = crypto.randomBytes(16).toString("hex");
    const crashPoint = generateCrashPoint(seed);
    const hash = hashSeed(seed);

    // Get next round number
    const lastRounds = await db
      .select()
      .from(crashRounds)
      .orderBy(desc(crashRounds.roundNumber))
      .limit(1);

    const nextRoundNumber = lastRounds.length > 0 ? lastRounds[0].roundNumber + 1 : 1;

    // Create round in DB
    const newRound = await db
      .insert(crashRounds)
      .values({
        gameId: this.config.gameName,
        roundNumber: nextRoundNumber,
        crashPoint: crashPoint.toString(),
        startedAt: new Date(),
        status: "active" as RoundStatus,
        seed,
        hash,
      })
      .returning();

    this.currentRound = this.mapDbRound(newRound[0]);
    this.roundStartTime = Date.now();
    this.crashPointMultiplier = crashPoint;

    return this.currentRound;
  }

  /**
   * Get current multiplier for a round
   */
  getCurrentMultiplier(roundId: number): number {
    if (!this.currentRound || this.currentRound.id !== roundId) {
      return 1;
    }

    const elapsedMs = Date.now() - this.roundStartTime;
    const multiplier = calculateMultiplier(elapsedMs, this.crashPointMultiplier);

    // If we've reached crash point, return crash point
    if (multiplier >= this.crashPointMultiplier) {
      return this.crashPointMultiplier;
    }

    return parseFloat(multiplier.toFixed(4));
  }

  /**
   * Check if round has crashed
   */
  async hasRoundCrashed(roundId: number): Promise<boolean> {
    const round = await this.getRound(roundId);
    if (!round) return false;

    const elapsedMs = Date.now() - round.startedAt.getTime();
    const multiplier = calculateMultiplier(elapsedMs, this.crashPointMultiplier);

    return multiplier >= this.crashPointMultiplier;
  }

  /**
   * Place a bet
   */
  async placeBet(
    userId: string,
    betAmount: number,
    betPanel: 1 | 2 = 1,
    autoCashout?: number
  ): Promise<Bet> {
    if (!this.currentRound) {
      throw new Error("No active round");
    }

    // Validate bet amount
    if (betAmount < this.config.minBet) {
      throw new Error(`Minimum bet is ${this.config.minBet}`);
    }
    if (betAmount > this.config.maxBet) {
      throw new Error(`Maximum bet is ${this.config.maxBet}`);
    }

    // Check user balance
    const userRecord = await db.select().from(users).where(eq(users.userId, userId));
    if (userRecord.length === 0) {
      throw new Error("User not found");
    }

    const balance = Number(userRecord[0].balance);
    if (balance < betAmount) {
      throw new Error("Insufficient balance");
    }

    // Deduct bet from balance
    await db
      .update(users)
      .set({
        balance: (balance - betAmount).toString(),
        updatedAt: new Date(),
      })
      .where(eq(users.userId, userId));

    // Record transaction
    await db.insert(transactions).values({
      userId,
      amount: (-betAmount).toString(),
      type: "bet",
      roundId: this.currentRound.id,
      description: `Bet placed on round ${this.currentRound.roundNumber}`,
      balanceBefore: balance.toString(),
      balanceAfter: (balance - betAmount).toString(),
    });

    // Create bet
    const newBet = await db
      .insert(bets)
      .values({
        userId,
        roundId: this.currentRound.id,
        betAmount: betAmount.toString(),
        status: "active" as BetStatus,
        betPanel,
        autoBet: false,
        autoCashout: autoCashout ? autoCashout.toString() : null,
      })
      .returning();

    return this.mapDbBet(newBet[0]);
  }

  /**
   * Cashout a bet
   */
  async cashoutBet(betId: number): Promise<UserBetResult> {
    // Get bet
    const betRecords = await db.select().from(bets).where(eq(bets.id, betId));
    if (betRecords.length === 0) {
      throw new Error("Bet not found");
    }

    const betRecord = betRecords[0];
    if (betRecord.status !== "active") {
      throw new Error("Bet is not active");
    }

    // Get round
    const round = await this.getRound(Number(betRecord.roundId));
    if (!round) {
      throw new Error("Round not found");
    }

    // Get current multiplier
    const cashoutMultiplier = this.getCurrentMultiplier(round.id);
    const crashPoint = Number(round.crashPoint);

    // Validate cashout
    if (!isValidCashout(cashoutMultiplier, crashPoint)) {
      throw new Error("Cannot cashout at or after crash point");
    }

    // Calculate win
    const betAmount = Number(betRecord.betAmount);
    const winAmount = calculateWin(betAmount, cashoutMultiplier);
    const profit = winAmount - betAmount;

    // Update user balance
    const userRecord = await db.select().from(users).where(eq(users.userId, betRecord.userId));
    const currentBalance = Number(userRecord[0].balance);
    const newBalance = currentBalance + winAmount;

    await db
      .update(users)
      .set({
        balance: newBalance.toString(),
        updatedAt: new Date(),
      })
      .where(eq(users.userId, betRecord.userId));

    // Record transaction
    await db.insert(transactions).values({
      userId: betRecord.userId,
      amount: profit.toString(),
      type: "win",
      betId,
      roundId: Number(betRecord.roundId),
      description: `Cashout at ${cashoutMultiplier.toFixed(2)}x on round ${round.roundNumber}`,
      balanceBefore: currentBalance.toString(),
      balanceAfter: newBalance.toString(),
    });

    // Update bet
    await db
      .update(bets)
      .set({
        status: "won" as BetStatus,
        cashedOutAt: cashoutMultiplier.toString(),
        winAmount: winAmount.toString(),
        updatedAt: new Date(),
      })
      .where(eq(bets.id, betId));

    return {
      betId,
      userId: betRecord.userId,
      roundId: Number(betRecord.roundId),
      betAmount,
      crashPoint,
      cashedOutAt: cashoutMultiplier,
      status: "won" as BetStatus,
      winAmount,
      profitLoss: profit,
    };
  }

  /**
   * End round after crash
   */
  async endRound(roundId: number) {
    const round = await this.getRound(roundId);
    if (!round) {
      throw new Error("Round not found");
    }

    const crashPoint = Number(round.crashPoint);

    // Get all active bets for this round
    const activeBets = await db
      .select()
      .from(bets)
      .where(and(eq(bets.roundId, roundId), eq(bets.status, "active")));

    // Mark all non-cashed-out bets as lost
    for (const bet of activeBets) {
      await db
        .update(bets)
        .set({
          status: "lost" as BetStatus,
          updatedAt: new Date(),
        })
        .where(eq(bets.id, bet.id));
    }

    // Update round status
    await db
      .update(crashRounds)
      .set({
        status: "crashed" as RoundStatus,
        endedAt: new Date(),
      })
      .where(eq(crashRounds.id, roundId));

    // Update stats for all players who played this round
    const roundBets = await db.select().from(bets).where(eq(bets.roundId, roundId));
    const uniquePlayers = new Set(roundBets.map((b) => b.userId));

    for (const userId of uniquePlayers) {
      const playerBets = roundBets.filter((b) => b.userId === userId);
      const playerWins = playerBets.filter((b) => b.status === "won").length;
      const playerLosses = playerBets.filter((b) => b.status === "lost").length;

      const existingStats = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, userId));

      const totalWagered = playerBets.reduce((sum, b) => sum + Number(b.betAmount), 0);
      const totalWon = playerBets.reduce((sum, b) => sum + Number(b.winAmount || 0), 0);
      const cashouts = playerBets
        .filter((b) => b.cashedOutAt)
        .map((b) => Number(b.cashedOutAt));
      const avgCashout = cashouts.length > 0 ? cashouts.reduce((a, b) => a + b) / cashouts.length : 1;
      const bestCashout = cashouts.length > 0 ? Math.max(...cashouts) : 1;

      if (existingStats.length > 0) {
        await db
          .update(userStats)
          .set({
            totalRounds: existingStats[0].totalRounds + playerBets.length,
            totalWins: existingStats[0].totalWins + playerWins,
            totalLosses: existingStats[0].totalLosses + playerLosses,
            totalWagered: (Number(existingStats[0].totalWagered) + totalWagered).toString(),
            totalWon: (Number(existingStats[0].totalWon) + totalWon).toString(),
            averageCashout: avgCashout.toString(),
            bestCashout: bestCashout.toString(),
            updatedAt: new Date(),
          })
          .where(eq(userStats.userId, userId));
      } else {
        await db.insert(userStats).values({
          userId,
          totalRounds: playerBets.length,
          totalWins: playerWins,
          totalLosses: playerLosses,
          totalWagered: totalWagered.toString(),
          totalWon: totalWon.toString(),
          averageCashout: avgCashout.toString(),
          bestCashout: bestCashout.toString(),
        });
      }
    }

    this.currentRound = null;
  }

  /**
   * Get round by ID
   */
  async getRound(roundId: number): Promise<CrashRound | null> {
    const rounds = await db.select().from(crashRounds).where(eq(crashRounds.id, roundId));
    if (rounds.length === 0) return null;
    return this.mapDbRound(rounds[0]);
  }

  /**
   * Get recent round history
   */
  async getRoundHistory(limit: number = 50): Promise<CrashRound[]> {
    const rounds = await db
      .select()
      .from(crashRounds)
      .where(eq(crashRounds.gameId, this.config.gameName))
      .orderBy(desc(crashRounds.id))
      .limit(limit);

    return rounds.map((r) => this.mapDbRound(r));
  }

  /**
   * Get player stats
   */
  async getPlayerStats(userId: string) {
    const stats = await db.select().from(userStats).where(eq(userStats.userId, userId));
    if (stats.length === 0) {
      return {
        totalRounds: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        totalWagered: 0,
        totalWon: 0,
        averageCashout: 1,
        bestCashout: 1,
        largestWin: 0,
      };
    }

    const stat = stats[0];
    return {
      totalRounds: stat.totalRounds,
      totalWins: stat.totalWins,
      totalLosses: stat.totalLosses,
      winRate: stat.totalRounds > 0 ? (stat.totalWins / stat.totalRounds) * 100 : 0,
      totalWagered: Number(stat.totalWagered),
      totalWon: Number(stat.totalWon),
      averageCashout: Number(stat.averageCashout),
      bestCashout: Number(stat.bestCashout),
      largestWin: Number(stat.largestWin),
    };
  }

  /**
   * Get player balance
   */
  async getPlayerBalance(userId: string): Promise<number> {
    const userRecords = await db.select().from(users).where(eq(users.userId, userId));
    if (userRecords.length === 0) return 0;
    return Number(userRecords[0].balance);
  }

  /**
   * Map database round to domain model
   */
  private mapDbRound(dbRound: any): CrashRound {
    return {
      id: dbRound.id,
      gameId: dbRound.gameId,
      roundNumber: dbRound.roundNumber,
      crashPoint: Number(dbRound.crashPoint),
      currentMultiplier: this.getCurrentMultiplier(dbRound.id),
      startedAt: dbRound.startedAt,
      endedAt: dbRound.endedAt,
      status: dbRound.status as RoundStatus,
      activeBets: 0,
      totalWagered: 0,
      seed: dbRound.seed,
      hash: dbRound.hash,
    };
  }

  /**
   * Map database bet to domain model
   */
  private mapDbBet(dbBet: any): Bet {
    return {
      id: dbBet.id,
      userId: dbBet.userId,
      roundId: dbBet.roundId,
      betAmount: Number(dbBet.betAmount),
      multiplier: dbBet.multiplier ? Number(dbBet.multiplier) : undefined,
      status: dbBet.status as BetStatus,
      cashedOutAt: dbBet.cashedOutAt ? Number(dbBet.cashedOutAt) : undefined,
      winAmount: dbBet.winAmount ? Number(dbBet.winAmount) : undefined,
      betPanel: dbBet.betPanel as 1 | 2,
      autoBet: dbBet.autoBet,
      autoCashout: dbBet.autoCashout ? Number(dbBet.autoCashout) : undefined,
      createdAt: dbBet.createdAt,
      updatedAt: dbBet.updatedAt,
    };
  }
}

export default CrashEngine;
