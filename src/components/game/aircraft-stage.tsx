"use client";

import { useGameStore } from "@/lib/store/game-store";
import { useEffect, useRef } from "react";
import WinCelebration from "./win-celebration";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

interface Trail {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

interface Streak {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
}

export default function AircraftStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // Mutable animation state kept outside React so the RAF loop never restarts.
  const anim = useRef({
    stars: [] as Star[],
    trails: [] as Trail[],
    streaks: [] as Streak[],
    shake: 0,
    flyAwayT: 0, // 0 -> 1 progress of the departure animation
    prevStatus: "waiting" as string,
    planeX: 0,
    planeY: 0,
    takeoffT: 0, // eases the plane in on takeoff
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Seed background stars.
    const seedStars = () => {
      anim.current.stars = Array.from({ length: 55 }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        size: Math.random() * 1.5 + 0.4,
        opacity: Math.random() * 0.35 + 0.08,
        speed: Math.random() * 0.5 + 0.15,
      }));
    };
    seedStars();

    // Seed speed streaks.
    anim.current.streaks = Array.from({ length: 18 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      len: 20 + Math.random() * 60,
      speed: 4 + Math.random() * 10,
      alpha: 0.05 + Math.random() * 0.15,
    }));

    let last = performance.now();

    const draw = (time: number) => {
      const dt = Math.min(50, time - last);
      last = time;

      // Read live state without re-subscribing the effect.
      const { multiplier, status, crashPoint, countdown, roundNumber } =
        useGameStore.getState();

      const A = anim.current;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      // ---------- phase transitions ----------
      if (status !== A.prevStatus) {
        if (status === "active") {
          A.flyAwayT = 0;
          A.takeoffT = 0;
          A.trails = [];
          A.shake = 6; // takeoff kick
        }
        if (status === "crashed") {
          A.flyAwayT = 0.0001; // begin departure
          A.shake = 16; // impact shake
        }
        if (status === "waiting" || status === "accepting_bets") {
          A.flyAwayT = 0;
          A.trails = [];
        }
        A.prevStatus = status;
      }

      // Advance fly-away + takeoff easing.
      if (status === "crashed" && A.flyAwayT > 0) {
        A.flyAwayT = Math.min(1, A.flyAwayT + dt / 900);
        // Once the jet is gone, drop any remaining exhaust so nothing
        // lingers in the background while the result is displayed.
        if (A.flyAwayT >= 1 && A.trails.length) A.trails = [];
      }
      if (status === "active") {
        A.takeoffT = Math.min(1, A.takeoffT + dt / 700);
      }

      // Decay shake.
      A.shake *= Math.pow(0.9, dt / 16);
      if (A.shake < 0.05) A.shake = 0;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Apply screen shake to the whole scene.
      if (A.shake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * A.shake,
          (Math.random() - 0.5) * A.shake
        );
      }

      const originX = 30;
      const originY = height - 20;

      // ---------- background ----------
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        0,
        width * 0.5,
        height * 0.5,
        width
      );
      bgGrad.addColorStop(0, "#1a1d26");
      bgGrad.addColorStop(0.5, "#13151c");
      bgGrad.addColorStop(1, "#0d0e13");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // ---------- sunburst rays ----------
      ctx.save();
      const rayCount = 24;
      const raySpin = status === "active" ? time * 0.00006 : time * 0.00002;
      for (let i = 0; i < rayCount; i++) {
        const angle =
          (i / rayCount) * (Math.PI * 0.5) + Math.sin(time * 0.0003 + i) * 0.02 + raySpin;
        const rayLen = width * 1.6;
        const base = i % 2 === 0 ? 0.045 : 0.022;
        const intensity = status === "active" ? base * (1 + Math.min(1.4, multiplier / 12)) : base;
        ctx.fillStyle = `rgba(255, ${status === "active" ? 62 : 42}, ${
          status === "active" ? 62 : 42
        }, ${intensity})`;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + Math.cos(angle) * rayLen, originY - Math.sin(angle) * rayLen);
        ctx.lineTo(
          originX + Math.cos(angle + 0.04) * rayLen,
          originY - Math.sin(angle + 0.04) * rayLen
        );
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // ---------- grid dots ----------
      ctx.fillStyle = "rgba(255, 255, 255, 0.075)";
      for (let x = originX + 30; x < width - 10; x += 50) {
        for (let y = 20; y < height - 20; y += 50) {
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ---------- axes ----------
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(originX, 15);
      ctx.lineTo(originX, height - 10);
      ctx.lineTo(width - 10, height - 10);
      ctx.stroke();

      // ---------- drifting stars ----------
      const climbRate = status === "active" ? 0.4 + Math.min(4, multiplier * 0.28) : 0.25;
      A.stars.forEach((p) => {
        p.y += p.speed * climbRate * (dt / 16);
        if (p.y > height) {
          p.y = -4;
          p.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(255,255,255,${
          p.opacity * (status === "active" ? 0.85 : 0.4)
        })`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // ---------- speed streaks (intensify with multiplier) ----------
      if (status === "active" && multiplier > 1.4) {
        const boost = Math.min(1, (multiplier - 1.4) / 8);
        A.streaks.forEach((s) => {
          s.x -= s.speed * boost * (dt / 16);
          if (s.x + s.len < 0) {
            s.x = width + Math.random() * 60;
            s.y = Math.random() * height;
          }
          const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.len, s.y);
          grad.addColorStop(0, `rgba(255,255,255,0)`);
          grad.addColorStop(0.5, `rgba(255,190,160,${s.alpha * boost})`);
          grad.addColorStop(1, `rgba(255,255,255,0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + s.len, s.y);
          ctx.stroke();
        });
      }

      // ---------- flight curve geometry ----------
      let targetProgress = 0;
      if (status === "active" || status === "crashed") {
        const logProgress = Math.log(Math.max(1, multiplier)) / Math.log(100);
        targetProgress = Math.min(logProgress * 1.2, 0.92);
      }

      // Base position along the curve.
      let planeX = originX + targetProgress * (width - 70);
      let planeY = originY - Math.pow(targetProgress, 0.78) * (height - 80);

      // Takeoff ease-in so the jet slides in rather than popping.
      if (status === "active") {
        const ease = 1 - Math.pow(1 - A.takeoffT, 3);
        planeX = originX + (planeX - originX) * ease;
        planeY = originY + (planeY - originY) * ease;
      }

      // Idle flight motion: gentle bob + high-frequency engine vibration.
      let bob = 0;
      if (status === "active") {
        bob =
          Math.sin(time * 0.004) * 5 + // slow bob
          Math.sin(time * 0.02) * 1.4 * Math.min(2, multiplier / 4); // vibration
        planeY += bob;
      }

      // Fly-away: accelerate up and off the top-right of the stage.
      if (status === "crashed" && A.flyAwayT > 0) {
        const t = A.flyAwayT;
        const accel = t * t; // ease-in for a slingshot feel
        planeX += accel * (width * 1.15);
        planeY -= accel * (height * 0.85);
      }

      A.planeX = planeX;
      A.planeY = planeY;

      const cpX = originX + (planeX - originX) * 0.55;
      const cpY = originY - (planeY < originY ? (originY - planeY) * 0.15 : 0);

      // ---------- trajectory fill + line ----------
      if ((status === "active" || status === "crashed") && targetProgress > 0) {
        // Freeze the curve at the crash point while the plane departs.
        const curveX =
          status === "crashed"
            ? originX + targetProgress * (width - 70)
            : planeX;
        const curveY =
          status === "crashed"
            ? originY - Math.pow(targetProgress, 0.78) * (height - 80)
            : planeY;
        const ccpX = originX + (curveX - originX) * 0.55;
        const ccpY = originY - (curveY < originY ? (originY - curveY) * 0.15 : 0);

        ctx.save();
        const fillGradient = ctx.createLinearGradient(0, height, 0, curveY);
        if (status === "crashed") {
          fillGradient.addColorStop(0, "rgba(239, 68, 68, 0.01)");
          fillGradient.addColorStop(0.5, "rgba(220, 38, 38, 0.12)");
          fillGradient.addColorStop(1, "rgba(248, 113, 113, 0.25)");
        } else {
          fillGradient.addColorStop(0, "rgba(239, 68, 68, 0.02)");
          fillGradient.addColorStop(0.6, "rgba(239, 68, 68, 0.18)");
          fillGradient.addColorStop(0.85, "rgba(248, 113, 113, 0.35)");
          fillGradient.addColorStop(1, "rgba(251, 146, 60, 0.5)");
        }
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.quadraticCurveTo(ccpX, ccpY, curveX, curveY);
        ctx.lineTo(curveX, originY);
        ctx.closePath();
        ctx.fillStyle = fillGradient;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.quadraticCurveTo(ccpX, ccpY, curveX, curveY);
        ctx.strokeStyle = status === "crashed" ? "rgba(248, 113, 113, 0.9)" : "#ef4444";
        ctx.lineWidth = status === "crashed" ? 2 : 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (status === "active") {
          ctx.shadowColor = "rgba(239, 68, 68, 0.9)";
          ctx.shadowBlur = 14 + Math.min(16, multiplier);
        }
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.quadraticCurveTo(ccpX, ccpY, curveX, curveY);
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // ---------- exhaust trail particles ----------
      const flying = status === "active" || (status === "crashed" && A.flyAwayT < 1);
      if (flying) {
        const emit = status === "crashed" ? 4 : 2;
        for (let i = 0; i < emit; i++) {
          A.trails.push({
            x: planeX - 14 + (Math.random() - 0.5) * 4,
            y: planeY + (Math.random() - 0.5) * 5,
            life: 1,
            maxLife: 1,
            size: 3 + Math.random() * 4,
            hue: 25 + Math.random() * 25,
          });
        }
      }

      A.trails = A.trails.filter((t) => t.life > 0);
      A.trails.forEach((t) => {
        t.life -= dt / 620;
        t.x -= dt * 0.035;
        t.y += dt * 0.004;
        const a = Math.max(0, t.life);
        ctx.save();
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = `hsl(${t.hue}, 95%, ${55 + (1 - a) * 20}%)`;
        ctx.shadowColor = `hsla(${t.hue}, 95%, 60%, 0.8)`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size * a, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ---------- the jet ----------
      if (flying && targetProgress > 0) {
        const departing = status === "crashed";
        const fade = departing ? Math.max(0, 1 - A.flyAwayT * 1.15) : 1;

        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(planeX, planeY);

        // Tilt: climb angle + extra pitch-up while departing.
        let angle = Math.atan2(originY - planeY, planeX - originX) * 0.35;
        if (departing) angle += A.flyAwayT * 0.5;
        // Subtle banking wobble in flight.
        if (status === "active") angle += Math.sin(time * 0.003) * 0.05;
        ctx.rotate(-angle);

        // Motion blur ghosts while departing.
        if (departing) {
          for (let g = 1; g <= 3; g++) {
            ctx.save();
            ctx.globalAlpha = fade * (0.18 / g);
            ctx.translate(-g * 16, g * 5);
            ctx.fillStyle = "#e11d48";
            ctx.beginPath();
            ctx.moveTo(26, 0);
            ctx.lineTo(8, -7);
            ctx.lineTo(-12, -10);
            ctx.lineTo(-14, 0);
            ctx.lineTo(-12, 10);
            ctx.lineTo(8, 7);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }

        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 18;

        ctx.fillStyle = "#e11d48";
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(26, 0);
        ctx.lineTo(8, -7);
        ctx.lineTo(-12, -10);
        ctx.lineTo(-10, -2);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-10, 2);
        ctx.lineTo(-12, 10);
        ctx.lineTo(8, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Tail fin.
        ctx.fillStyle = "#be123c";
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.lineTo(-2, -12);
        ctx.lineTo(2, -2);
        ctx.closePath();
        ctx.fill();

        // Cockpit.
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#38bdf8";
        ctx.fillStyle = "#7dd3fc";
        ctx.beginPath();
        ctx.ellipse(6, 0, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Afterburner — longer and hotter as the multiplier climbs.
        const thrust = departing
          ? 26
          : 8 + Math.min(20, multiplier * 1.6) + Math.sin(time * 0.03) * 3;
        const flameGrad = ctx.createLinearGradient(-14, 0, -14 - thrust, 0);
        flameGrad.addColorStop(0, "#fff7ed");
        flameGrad.addColorStop(0.3, "#fbbf24");
        flameGrad.addColorStop(0.7, "#f97316");
        flameGrad.addColorStop(1, "rgba(249,115,22,0)");
        ctx.shadowColor = "#f97316";
        ctx.shadowBlur = 16;
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.ellipse(-14 - thrust / 2, 0, thrust / 2, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ---------- centre text ----------
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Proportional text scale so the stage type matches UI size at any height.
      const m = Math.max(0.7, Math.min(1.15, height / 420));

      if (status === "active") {
        // Pulse the number on milestone crossings.
        const pulse = 1 + Math.max(0, Math.sin(time * 0.008)) * 0.012;
        ctx.save();
        ctx.translate(width / 2, height / 2 - 8);
        ctx.scale(pulse, pulse);
        ctx.font = `900 ${Math.round(82 * m)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 20;
        const text = `${multiplier.toFixed(2)}x`;
        ctx.fillText(text, 0, 0);
        if (multiplier > 5) {
          ctx.shadowColor =
            multiplier > 10 ? "rgba(168, 85, 247, 0.85)" : "rgba(251, 191, 36, 0.65)";
          ctx.shadowBlur = 20;
          ctx.fillStyle = multiplier > 10 ? "#e9d5ff" : "#fef3c7";
          ctx.fillText(text, 0, 0);
        }
        ctx.restore();
      } else if (status === "crashed") {
        const t = Math.min(1, A.flyAwayT * 2);
        ctx.globalAlpha = t;
        ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
        ctx.shadowBlur = 24;
        ctx.font = `900 ${Math.round(53 * m)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "#fecaca";
        ctx.fillText("FLEW AWAY!", width / 2, height / 2 - 28);

        ctx.font = `800 ${Math.round(38 * m)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "#ef4444";
        ctx.shadowBlur = 12;
        ctx.fillText(
          `${crashPoint?.toFixed(2) || multiplier.toFixed(2)}x`,
          width / 2,
          height / 2 + 18
        );
        ctx.globalAlpha = 1;
      } else if (status === "accepting_bets") {
        const s = Math.max(0.72, Math.min(1, height / 360));
        const ringRadius = 42 * s;
        const ringCenterY = height / 2 - 66 * s;

        ctx.save();
        ctx.translate(width / 2, ringCenterY);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(15, 18, 25, 0.55)";
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius - 2 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 3.5 * s;
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3.5 * s;
        ctx.lineCap = "round";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#fbbf24";
        const progress = Math.max(0, Math.min(1, countdown / 5));
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
        ctx.restore();

        ctx.shadowColor = "rgba(251, 191, 36, 0.55)";
        ctx.shadowBlur = 16;
        ctx.font = `800 ${Math.round(46 * s)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "#fcd34d";
        ctx.fillText(`${countdown}`, width / 2, ringCenterY + 1);

        ctx.shadowBlur = 8;
        ctx.font = `700 ${Math.round(17 * s)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "#d1d5db";
        ctx.fillText("BETTING", width / 2, ringCenterY + ringRadius + 28 * s);

        ctx.shadowBlur = 0;
        ctx.font = `600 ${Math.round(16 * s)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "#9ca3af";
        ctx.fillText("Round starting...", width / 2, ringCenterY + ringRadius + 50 * s);
      } else if (status === "waiting") {
        ctx.font = `700 ${Math.round(19 * m)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "#6b7280";
        ctx.shadowBlur = 0;
        ctx.fillText("Preparing...", width / 2, height / 2);
        for (let i = 0; i < 3; i++) {
          const alpha = (Math.sin(time * 0.005 + i * 0.8) + 1) / 2;
          ctx.fillStyle = `rgba(107, 114, 128, ${0.3 + alpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(width / 2 - 12 + i * 12, height / 2 + 18, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      ctx.restore(); // shake transform

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Only used for the lightweight DOM overlays below.
  const status = useGameStore((s) => s.status);
  const multiplier = useGameStore((s) => s.multiplier);
  const roundNumber = useGameStore((s) => s.roundNumber);

  return (
    <div className="relative w-full h-full bg-[#0f1219] rounded-xl overflow-hidden border border-[#1e293b]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.6)] flex items-center justify-center select-none">
      <canvas ref={canvasRef} className="w-full h-full block" style={{ width: "100%", height: "100%" }} />

      {/* Crash red wash */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          status === "crashed" ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle at 50% 55%, rgba(239,68,68,0.18), transparent 65%)",
        }}
      />

      {/* Heat vignette that grows with the multiplier */}
      {status === "active" && multiplier > 2 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(700px circle at 50% 50%, rgba(239,68,68,${Math.min(
              0.18,
              (multiplier - 2) * 0.02
            )}), transparent 70%)`,
          }}
        />
      )}

      {/* Win confetti + payout banner */}
      <WinCelebration />

      {/* Round badge */}
      <div className="absolute bottom-2 left-3 text-[13px] font-mono text-[#475569] flex items-center gap-2 z-20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
        #{roundNumber || 0}
      </div>
    </div>
  );
}
