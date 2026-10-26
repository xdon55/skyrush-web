import { NextRequest, NextResponse } from "next/server";
import CrashEngine from "@/lib/crash-engine/engine";
import { db } from "@/db";
import { crashRounds } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const engine = await CrashEngine.initialize("skyrush");

    if (action === "history") {
      const history = await engine.getRoundHistory(limit);
      return NextResponse.json({ success: true, history });
    }

    if (action === "player_stats" && userId) {
      const stats = await engine.getPlayerStats(userId);
      return NextResponse.json({ success: true, stats });
    }

    if (action === "player_balance" && userId) {
      const balance = await engine.getPlayerBalance(userId);
      return NextResponse.json({ success: true, balance });
    }

    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
