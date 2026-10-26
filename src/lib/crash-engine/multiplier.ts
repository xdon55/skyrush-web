/**
 * Crash Point and Multiplier Calculator
 * Generates provably fair crash points and calculates real-time multipliers
 */

import crypto from "crypto";

/**
 * Generate a crash point using a provably fair mechanism
 * Based on seed and hash combination
 */
export function generateCrashPoint(
  seed: string,
  nonce: number = 0,
  minCrash: number = 1.01
): number {
  // Create a deterministic hash from seed + nonce
  const combinedString = `${seed}-${nonce}`;
  const hash = crypto.createHash("sha256").update(combinedString).digest("hex");

  // Convert first 8 hex chars to integer
  const hexValue = parseInt(hash.substring(0, 8), 16);

  // Map to crash point between minCrash and reasonable upper bound
  // Using exponential distribution for more realistic crash patterns
  const normalized = (hexValue % 10000) / 10000; // 0-1
  const crashPoint = minCrash + Math.exp(normalized * 4) - 1;

  // Clamp to reasonable bounds (1.01 to ~1000)
  return Math.max(minCrash, Math.min(crashPoint, 1000));
}

/**
 * Calculate multiplier at a given timestamp relative to round start
 * Multiplier grows smoothly from 1.00x
 */
export function calculateMultiplier(
  elapsedMs: number,
  crashPointMultiplier: number
): number {
  // Growth rate: reaches crash point at intended time
  // Using exponential growth for smooth, natural feel
  const secondsElapsed = elapsedMs / 1000;

  // Adjust growth based on typical round duration (60s)
  // This gives a natural acceleration feel
  const growthFactor = 0.06; // Adjust for game feel
  const multiplier = 1 + Math.exp(secondsElapsed * growthFactor) - 1;

  // Cap at crash point
  return Math.min(multiplier, crashPointMultiplier);
}

/**
 * Determine if a cashout multiplier is valid (before crash)
 */
export function isValidCashout(cashoutMultiplier: number, crashPoint: number): boolean {
  return cashoutMultiplier > 0 && cashoutMultiplier < crashPoint;
}

/**
 * Calculate win amount for a bet
 */
export function calculateWin(
  betAmount: number,
  cashoutMultiplier: number,
  houseEdge: number = 0.01
): number {
  // Apply house edge
  const profit = betAmount * (cashoutMultiplier - 1) * (1 - houseEdge);
  return betAmount + profit;
}

/**
 * Generate a SHA256 hash for a given seed (for provable fairness)
 */
export function hashSeed(seed: string): string {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

/**
 * Verify a crash point against seed and hash (for player verification)
 */
export function verifyCrashPoint(
  crashPoint: number,
  seed: string,
  hash: string,
  nonce: number = 0
): boolean {
  const generatedPoint = generateCrashPoint(seed, nonce);
  const generatedHash = hashSeed(seed);

  // Allow small floating point differences
  return (
    Math.abs(generatedPoint - crashPoint) < 0.0001 &&
    generatedHash === hash
  );
}

/**
 * Exponential multiplier growth formula
 * Creates tension and natural-feeling acceleration
 */
export function exponentialMultiplierGrowth(
  elapsedSeconds: number,
  baseGrowthRate: number = 0.06
): number {
  return 1 + (Math.exp(elapsedSeconds * baseGrowthRate) - 1);
}

/**
 * Linear multiplier growth (for testing or alternative feel)
 */
export function linearMultiplierGrowth(
  elapsedSeconds: number,
  growthPerSecond: number = 0.05
): number {
  return 1 + elapsedSeconds * growthPerSecond;
}

/**
 * RTP calculation
 * Returns expected return to player as percentage
 */
export function calculateRTP(crashPoints: number[], houseEdge: number = 0.01): number {
  if (crashPoints.length === 0) return 0;

  // For each possible cashout point, calculate expected value
  let totalEV = 0;
  const maxCrash = Math.max(...crashPoints);

  for (let i = 1; i <= maxCrash * 100; i++) {
    const cashoutMultiplier = i / 100;
    const frequency = crashPoints.filter((cp) => cp > cashoutMultiplier).length / crashPoints.length;

    if (frequency > 0) {
      const win = calculateWin(1, cashoutMultiplier, houseEdge);
      const loss = 1;
      const ev = frequency * win + (1 - frequency) * loss;
      totalEV += ev;
    }
  }

  return (totalEV / (maxCrash * 100)) * 100;
}
