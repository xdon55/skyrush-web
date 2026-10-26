import { NextResponse } from "next/server";
import { db } from "@/db";
import { gameConfig, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Check if game config exists
    const configs = await db
      .select()
      .from(gameConfig)
      .where(eq(gameConfig.gameName, "skyrush"));

    if (configs.length === 0) {
      // Create default config
      await db.insert(gameConfig).values({
        gameName: "skyrush",
        theme: "skyrush",
        minBet: "1",
        maxBet: "10000",
        maxWin: "1000000",
        roundDuration: 60,
        countdownDuration: 5,
        autoClashoutEnabled: true,
        autoBetEnabled: true,
        enabled: true,
      });
    }

    // Create demo user if doesn't exist
    const demoUsers = await db
      .select()
      .from(users)
      .where(eq(users.userId, "demo-user"));

    if (demoUsers.length === 0) {
      await db.insert(users).values({
        userId: "demo-user",
        username: "Player",
        balance: "10000",
        currency: "USD",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Game initialized successfully",
    });
  } catch (error) {
    console.error("Init error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
