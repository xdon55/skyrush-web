import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameName = searchParams.get("gameName") || "skyrush";

    const configs = await db
      .select()
      .from(gameConfig)
      .where(eq(gameConfig.gameName, gameName));

    if (configs.length === 0) {
      return NextResponse.json(
        { success: false, error: "Config not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, config: configs[0] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { gameName, ...updates } = await request.json();

    const updated = await db
      .update(gameConfig)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(gameConfig.gameName, gameName))
      .returning();

    return NextResponse.json({ success: true, config: updated[0] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
