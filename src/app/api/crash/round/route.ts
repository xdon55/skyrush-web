import { NextRequest, NextResponse } from "next/server";
import CrashEngine from "@/lib/crash-engine/engine";
import { db } from "@/db";
import { gameConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const engine = await CrashEngine.initialize("skyrush");
    const round = await engine.startRound();

    return NextResponse.json({ success: true, round });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, roundId } = await request.json();

    const engine = await CrashEngine.initialize("skyrush");

    if (action === "get_status") {
      const round = await engine.getRound(roundId);
      if (!round) {
        return NextResponse.json({ success: false, error: "Round not found" }, { status: 404 });
      }

      const currentMultiplier = engine.getCurrentMultiplier(roundId);
      const hasCrashed = await engine.hasRoundCrashed(roundId);

      return NextResponse.json({
        success: true,
        round: { ...round, currentMultiplier },
        hasCrashed,
      });
    }

    if (action === "end_round") {
      await engine.endRound(roundId);
      return NextResponse.json({ success: true, message: "Round ended" });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
