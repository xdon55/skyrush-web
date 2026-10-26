"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface FeedEvent {
  id: string;
  type: "bet" | "cashout" | "loss" | "bigwin";
  username: string;
  amount: number;
  multiplier?: number;
  timestamp: Date;
}

export default function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);

  // Simulate live feed events
  useEffect(() => {
    const names = [
      "Player_" + Math.floor(Math.random() * 9999),
      "Trader_X",
      "High_Roller",
      "Lucky_One",
      "Sky_Rider",
    ];

    const timer = setInterval(() => {
      const randomType = ["bet", "cashout", "loss", "bigwin"][
        Math.floor(Math.random() * 4)
      ] as FeedEvent["type"];
      const multiplier = Math.floor(Math.random() * 50) / 10;

      const newEvent: FeedEvent = {
        id: Date.now().toString(),
        type: randomType,
        username: names[Math.floor(Math.random() * names.length)],
        amount: Math.floor(Math.random() * 900) + 100,
        multiplier: multiplier > 1 ? multiplier : undefined,
        timestamp: new Date(),
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 10));
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "bet":
        return "🎯";
      case "cashout":
        return "💰";
      case "loss":
        return "⚠️";
      case "bigwin":
        return "🎉";
      default:
        return "📊";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "bet":
        return "text-cyan-400";
      case "cashout":
        return "text-green-400";
      case "loss":
        return "text-red-400";
      case "bigwin":
        return "text-yellow-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="glass rounded-lg p-4 space-y-3">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Zap size={14} />
        Live Activity
      </h3>

      {events.length === 0 ? (
        <div className="text-center py-4 text-slate-500 text-xs">
          Waiting for players...
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className="text-xs flex items-center gap-2 p-2 rounded bg-slate-800 bg-opacity-30 hover:bg-opacity-50 transition-colors"
              style={{ animation: "fadeIn 0.3s ease-out" }}
            >
              <span className="text-base">{getEventIcon(event.type)}</span>
              <div className="flex-1 min-w-0">
                <span className="text-slate-300 truncate">{event.username}</span>
                <span className="text-slate-500 ml-1">
                  {event.type === "bet" && `bet $${event.amount}`}
                  {event.type === "cashout" &&
                    `cashed out ${event.multiplier?.toFixed(2)}x`}
                  {event.type === "loss" && `lost $${event.amount}`}
                  {event.type === "bigwin" && `won $${event.amount}!`}
                </span>
              </div>
              {event.multiplier && (
                <span className={`font-semibold ${getEventColor(event.type)}`}>
                  {event.multiplier.toFixed(2)}x
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
