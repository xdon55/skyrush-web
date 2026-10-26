import { NextRequest, NextResponse } from "next/server";
import CrashEngine from "@/lib/crash-engine/engine";

export async function POST(request: NextRequest) {
  try {
    const { action, userId, betAmount, roundId, betPanel, autoCashout, betId } =
      await request.json();

    const engine = await CrashEngine.initialize("skyrush");

    if (action === "place_bet") {
      const bet = await engine.placeBet(
        userId,
        betAmount,
        betPanel || 1,
        autoCashout
      );
      return NextResponse.json({ success: true, bet });
    }

    if (action === "cashout") {
      const result = await engine.cashoutBet(betId);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
