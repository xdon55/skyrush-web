"use client";

import dynamic from "next/dynamic";

// Dynamically import game container to avoid hydration issues
const GameContainer = dynamic(() => import("@/components/game/game-container"), {
  ssr: false,
});

export default function Home() {
  return <GameContainer />;
}
