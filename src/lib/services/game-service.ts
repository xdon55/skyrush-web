/**
 * Game Service
 * Client-side service for interacting with the crash game API
 */

import { CrashRound, Bet, UserBetResult } from "@/lib/types/crash-engine";

export class GameService {
  private baseUrl = "/api/crash";

  /**
   * Start a new round
   */
  async startRound(): Promise<CrashRound | null> {
    try {
      const response = await fetch(`${this.baseUrl}/round`, { method: "GET" });
      const data = await response.json();
      return data.success ? data.round : null;
    } catch (error) {
      console.error("Failed to start round:", error);
      return null;
    }
  }

  /**
   * Get round status
   */
  async getRoundStatus(roundId: number): Promise<{
    round: CrashRound;
    hasCrashed: boolean;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_status", roundId }),
      });
      const data = await response.json();
      return data.success ? { round: data.round, hasCrashed: data.hasCrashed } : null;
    } catch (error) {
      console.error("Failed to get round status:", error);
      return null;
    }
  }

  /**
   * Place a bet
   */
  async placeBet(
    userId: string,
    betAmount: number,
    roundId: number,
    betPanel: 1 | 2 = 1,
    autoCashout?: number
  ): Promise<Bet | null> {
    try {
      const response = await fetch(`${this.baseUrl}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "place_bet",
          userId,
          betAmount,
          betPanel,
          autoCashout,
        }),
      });
      const data = await response.json();
      return data.success ? data.bet : null;
    } catch (error) {
      console.error("Failed to place bet:", error);
      return null;
    }
  }

  /**
   * Cashout a bet
   */
  async cashoutBet(betId: number): Promise<UserBetResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cashout", betId }),
      });
      const data = await response.json();
      return data.success ? data.result : null;
    } catch (error) {
      console.error("Failed to cashout bet:", error);
      return null;
    }
  }

  /**
   * Get game history
   */
  async getHistory(limit: number = 50): Promise<CrashRound[] | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/stats?action=history&limit=${limit}`
      );
      const data = await response.json();
      return data.success ? data.history : null;
    } catch (error) {
      console.error("Failed to get history:", error);
      return null;
    }
  }

  /**
   * Get player stats
   */
  async getPlayerStats(userId: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/stats?action=player_stats&userId=${userId}`
      );
      const data = await response.json();
      return data.success ? data.stats : null;
    } catch (error) {
      console.error("Failed to get player stats:", error);
      return null;
    }
  }

  /**
   * Get player balance
   */
  async getPlayerBalance(userId: string): Promise<number | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/stats?action=player_balance&userId=${userId}`
      );
      const data = await response.json();
      return data.success ? data.balance : null;
    } catch (error) {
      console.error("Failed to get player balance:", error);
      return null;
    }
  }
}

export const gameService = new GameService();
