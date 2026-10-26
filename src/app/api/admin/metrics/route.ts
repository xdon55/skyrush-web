import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crashRounds, bets, users } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get("gameId") || "skyrush";
    const hours = parseInt(searchParams.get("hours") || "24");

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get rounds
    const rounds = await db
      .select()
      .from(crashRounds)
      .where(
        and(
          eq(crashRounds.gameId, gameId),
          gte(crashRounds.createdAt, since)
        )
      );

    // Get bets
    const allBets = await db
      .select()
      .from(bets)
      .innerJoin(crashRounds, eq(bets.roundId, crashRounds.id))
      .where(
        and(
          eq(crashRounds.gameId, gameId),
          gte(crashRounds.createdAt, since)
        )
      );

    // Get user count
    const userCount = await db
      .select({ count: sql`count(*)` })
      .from(users);

    // Calculate metrics
    const totalWagered = allBets.reduce(
      (sum, b) => sum + Number(b.bets.betAmount),
      0
    );
    const wins = allBets.filter((b) => b.bets.status === "won").length;
    const losses = allBets.filter((b) => b.bets.status === "lost").length;
    const totalPayout = allBets.reduce(
      (sum, b) => sum + Number(b.bets.winAmount || 0),
      0
    );
    const revenue = totalWagered - totalPayout;

    const avgCrash =
      rounds.length > 0
        ? rounds.reduce((sum, r) => sum + Number(r.crashPoint), 0) /
          rounds.length
        : 0;

    return NextResponse.json({
      success: true,
      metrics: {
        totalRounds: rounds.length,
        totalBets: allBets.length,
        totalWagered,
        totalPayout,
        revenue,
        wins,
        losses,
        winRate: allBets.length > 0 ? (wins / allBets.length) * 100 : 0,
        avgCrash: parseFloat(avgCrash.toFixed(2)),
        activeUsers: userCount[0]?.count || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
