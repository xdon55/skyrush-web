"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/lib/store/game-store";
import { Send, CloudRain, ShieldCheck } from "lucide-react";

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  badge?: string;
  color?: string;
  time: string;
  isMe?: boolean;
}

const BOT_MESSAGES = [
  "Free bets for everyone! 🎉",
  "Let's fly high today! 🚀",
  "Just cashed out at 5.40x, nice!",
  "Going for 10x this round 💎",
  "Good luck team! 🍀",
  "Rain incoming? 🌧️",
  "GG everyone! 🔥",
  "Smooth flight! ✈️",
  "Who's holding past 20x?",
  "100x incoming trust me!",
  "Cashed 50$ at 3.21x 😎",
  "This round feels lucky",
  "Let's gooo! 🚀🚀",
];

export default function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      user: "captain_blue",
      avatar: "👨‍✈️",
      text: "Free bets for everyone!",
      badge: "VIP",
      color: "text-cyan-400",
      time: "12:00",
    },
    {
      id: "2",
      user: "sky_rider99",
      avatar: "🦅",
      text: "Holding past 10x this flight! 🎯",
      color: "text-amber-400",
      time: "12:01",
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const { username } = useGameStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate periodic incoming chat messages from players
  useEffect(() => {
    const interval = setInterval(() => {
      const randomText = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
      const names = ["captain_blue", "skyrider", "crypto_king", "pro_gambler", "lucky_luke", "jet_pilot", "aviator_pro"];
      const name = names[Math.floor(Math.random() * names.length)];
      const avatars = ["👨‍✈️", "🚀", "👑", "🦁", "💎", "🎯", "⚡"];
      const avatar = avatars[Math.floor(Math.random() * avatars.length)];

      const newMsg: ChatMessage = {
        id: Date.now().toString() + Math.random(),
        user: name,
        avatar,
        text: randomText,
        color: "text-[#cbd5e1]",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev.slice(-50), newMsg]);
    }, 3500 + Math.random() * 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      user: username || "You",
      avatar: "👤",
      text: inputMsg.trim(),
      color: "text-emerald-400",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMsg("");
  };

  return (
    <div className="bg-[#12151e] text-slate-200 border border-[#1e293b]/60 rounded-xl flex flex-col h-full overflow-hidden text-xs select-none shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      {/* Chat Top Bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#0b0f19] border-b border-[#1e293b]/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          <span className="text-[13px] text-[#64748b] font-bold uppercase tracking-wider">Online: <strong className="text-white font-mono">342</strong></span>
        </div>
        <div className="font-black text-white uppercase tracking-widest text-[13px] flex items-center gap-1.5">
          <span className="w-1 h-3 bg-amber-500 rounded-full inline-block" />
          CHAT
        </div>
        <button className="w-6 h-6 rounded-full bg-[#1e293b]/50 hover:bg-[#1e293b] flex items-center justify-center text-[#475569] hover:text-white transition-colors">
          ✕
        </button>
      </div>

      {/* Rain Announcement Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 to-emerald-900/30 border-b border-emerald-800/30 px-3 py-2 flex items-center justify-between text-[13px]">
        <div className="flex items-center gap-2 font-medium text-emerald-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <CloudRain className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          </div>
          <span>Rain • Total <strong className="text-emerald-200 font-mono">15.00$</strong></span>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-3 py-1 rounded-full font-black text-[12px] shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95">
          CLAIM
        </button>
      </div>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-[#0f1219]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-2 group ${msg.isMe ? "bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 -m-0.5" : ""}`}>
            <span className="text-[17px] leading-none mt-0.5 shrink-0">{msg.avatar}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-black text-[13px] tracking-tight ${msg.color || "text-[#e2e8f0]"}`}>
                  {msg.user}
                </span>
                {msg.badge && (
                  <span className="bg-cyan-500/15 text-cyan-300 text-[10px] px-1 py-0 rounded-full font-black border border-cyan-500/20 tracking-wider">
                    {msg.badge}
                  </span>
                )}
                {msg.isMe && (
                  <span className="bg-amber-500/15 text-amber-300 text-[10px] px-1 py-0 rounded-full font-black border border-amber-500/20">YOU</span>
                )}
                <span className="text-[11px] text-[#475569] font-mono ml-auto">{msg.time}</span>
              </div>
              <p className={`text-[13px] break-words mt-1 leading-relaxed px-2.5 py-1.5 rounded-full max-w-fit ${
                msg.isMe 
                  ? "bg-amber-500/10 text-amber-100 border border-amber-500/20" 
                  : "bg-[#1a2030] text-[#cbd5e1] border border-[#1e293b]/50"
              }`}>
                {msg.text}
              </p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="p-2 bg-[#0b0f19] border-t border-[#1e293b]/40 flex items-center gap-2">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Send a message..."
          maxLength={100}
          className="flex-1 bg-[#141822] border border-[#1e293b] focus:border-amber-500/50 text-[#e2e8f0] placeholder:text-[#475569] px-3.5 py-2 rounded-full text-xs focus:outline-none transition-colors font-medium"
        />
        <button
          type="submit"
          disabled={!inputMsg.trim()}
          className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 disabled:bg-[#1e293b] disabled:text-[#475569] text-[#0b0f19] flex items-center justify-center font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_16px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95 disabled:shadow-none disabled:hover:scale-100"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Footer Provably Fair Badge */}
      <div className="px-3 py-2 bg-[#080a0f] border-t border-[#1e293b]/30 flex items-center justify-center gap-1.5 text-[12px] text-[#475569] font-bold uppercase tracking-wider">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Provably Fair • <strong className="text-[#64748b] normal-case">SHA-256 Verified</strong></span>
      </div>
    </div>
  );
}
