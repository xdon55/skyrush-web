"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/store/game-store";

interface WinToast {
  id: string;
  panel: 1 | 2;
  amount: number;
  multiplier: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  rot: number;
  vrot: number;
  shape: "rect" | "circle";
}

const COLORS = ["#fbbf24", "#f59e0b", "#22c55e", "#34d399", "#ffffff", "#fcd34d", "#4ade80"];

/**
 * Full-stage win feedback: confetti burst, golden flash and an
 * animated payout banner. Triggers whenever a bet panel is cashed out.
 */
export default function WinCelebration() {
  const panel1 = useGameStore((s) => s.bets.panel1);
  const panel2 = useGameStore((s) => s.bets.panel2);
  const status = useGameStore((s) => s.status);

  const [toasts, setToasts] = useState<WinToast[]>([]);
  const [flash, setFlash] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const prev1 = useRef(panel1.status);
  const prev2 = useRef(panel2.status);

  const burst = (big: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const count = big ? 130 : 70;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 2.5 + Math.random() * (big ? 8 : 5);
      const maxLife = 60 + Math.random() * 50;
      particles.current.push({
        x: w / 2,
        y: h / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * (big ? 6 : 4),
        life: maxLife,
        maxLife,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.45 ? "rect" : "circle",
      });
    }

    setFlash(true);
    window.setTimeout(() => setFlash(false), 320);
  };

  const addWin = (panel: 1 | 2, amount: number, multiplier: number) => {
    const id = `${panel}-${Date.now()}`;
    setToasts((t) => [...t, { id, panel, amount, multiplier }]);
    burst(multiplier >= 5);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2600);
  };

  // Watch both panels for a cashout.
  useEffect(() => {
    if (panel1.status === "won" && prev1.current !== "won") {
      addWin(1, panel1.winAmount ?? 0, panel1.cashedOut ?? 1);
    }
    prev1.current = panel1.status;
  }, [panel1.status, panel1.winAmount, panel1.cashedOut]);

  useEffect(() => {
    if (panel2.status === "won" && prev2.current !== "won") {
      addWin(2, panel2.winAmount ?? 0, panel2.cashedOut ?? 1);
    }
    prev2.current = panel2.status;
  }, [panel2.status, panel2.winAmount, panel2.cashedOut]);

  // Hard reset every time a new round begins so no confetti can linger
  // in the background of the stage.
  useEffect(() => {
    if (status === "accepting_bets" || status === "waiting" || status === "active") {
      particles.current = [];
      setToasts([]);
      setFlash(false);
      const c = canvasRef.current;
      const cx = c?.getContext("2d");
      if (c && cx) cx.clearRect(0, 0, c.width, c.height);
    }
  }, [status]);

  // Particle render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Cull dead particles and anything that has left the stage so they can
      // never accumulate along the bottom edge.
      particles.current = particles.current.filter(
        (p) => p.life > 0 && p.y < h + 40 && p.x > -60 && p.x < w + 60
      );

      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16; // gravity
        p.vx *= 0.99;
        p.rot += p.vrot;
        p.life -= 1;

        const alpha = Math.min(1, p.life / (p.maxLife * 0.6));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {/* Confetti layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Golden flash */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          flash ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(251,191,36,0.22), rgba(34,197,94,0.08) 45%, transparent 70%)",
        }}
      />

      {/* Payout banners */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        {toasts.map((t, i) => (
          <div
            key={t.id}
            className="animate-win-pop"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="relative flex flex-col items-center">
              <div className="absolute inset-0 blur-2xl bg-emerald-400/30 rounded-full scale-150" />
              <div className="relative bg-gradient-to-b from-[#16351f] to-[#0d2415] border-2 border-emerald-400/60 rounded-2xl px-6 py-3 shadow-[0_0_36px_rgba(16,185,129,0.55)] flex flex-col items-center">
                <span className="text-[12px] font-black uppercase tracking-[0.18em] text-emerald-300/90">
                  Cashed Out · Bet {t.panel}
                </span>
                <span className="text-[36px] leading-none font-black text-white font-mono drop-shadow mt-1">
                  +{t.amount.toFixed(2)}
                  <span className="text-emerald-300 text-[22px] ml-1">$</span>
                </span>
                <span className="mt-1 text-[16px] font-black text-amber-300 font-mono bg-amber-400/10 border border-amber-400/30 rounded-full px-2.5 py-0.5">
                  {t.multiplier.toFixed(2)}x
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes win-pop {
          0% {
            opacity: 0;
            transform: scale(0.55) translateY(24px);
          }
          45% {
            opacity: 1;
            transform: scale(1.12) translateY(-6px);
          }
          60% {
            transform: scale(1) translateY(0);
          }
          82% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.94) translateY(-40px);
          }
        }
        .animate-win-pop {
          animation: win-pop 2.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
}
