"use client";

import { useEffect, useRef, useState } from "react";
import { activeFestive, type Festive } from "@/lib/festive";

/**
 * Decided in the browser, after mount — same reason as `useActiveCampaign`:
 * pages are built ahead of time, and deciding at build time would freeze
 * whatever was true on build day, so the snow would never arrive or never stop.
 */
export function useFestive(): Festive | null {
  const [festive, setFestive] = useState<Festive | null>(null);
  useEffect(() => {
    setFestive(activeFestive());
  }, []);
  return festive;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

type Flake = {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
  opacity: number;
};

/**
 * Light snowfall over the whole page.
 *
 * White on cream is invisible, so each flake is a white dot on a soft
 * blue-grey halo — reads as snow without greying the page. Kept sparse and
 * small so it never sits between a customer and a product photo for long.
 * Off for anyone who has asked their device for reduced motion.
 */
export function Snowfall() {
  const festive = useFestive();
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!festive || reduced) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];
    let raf = 0;

    const spawn = (anywhere: boolean): Flake => {
      const r = Math.random() * 2.2 + 0.8;
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -10,
        r,
        // Bigger flakes are "closer", so they fall faster.
        speed: 0.25 + r * 0.22 + Math.random() * 0.2,
        drift: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.35 + 0.55,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(110, Math.round((w * h) / 14000));
      flakes = Array.from({ length: count }, () => spawn(true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.phase += 0.01;
        f.y += f.speed;
        f.x += Math.sin(f.phase) * f.drift * 0.5;
        if (f.y > h + 10) Object.assign(f, spawn(false));
        if (f.x < -10) f.x = w + 10;
        if (f.x > w + 10) f.x = -10;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 1.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120, 142, 168, ${f.opacity * 0.3})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [festive, reduced]);

  if (!festive || reduced) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-40"
    />
  );
}

const BULB_COLOURS = ["#C8102E", "#1F6B4A", "#E8B021", "#2C5D9E", "#C8102E", "#E8B021", "#1F6B4A"];

/**
 * A string of fairy lights hanging under the header. One 64px swag of wire
 * per bulb, repeated across the width; the overflow is clipped so it fits any
 * screen without stretching the bulbs.
 */
export function FairyLights() {
  const festive = useFestive();
  if (!festive) return null;
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 right-0 top-full h-5 overflow-hidden pointer-events-none flex"
    >
      {Array.from({ length: 48 }, (_, i) => {
        const colour = BULB_COLOURS[i % BULB_COLOURS.length];
        return (
          <svg key={i} width="64" height="20" viewBox="0 0 64 20" className="shrink-0">
            <path d="M0 2 Q32 12 64 2" fill="none" stroke="#3B4A3F" strokeWidth="1.2" opacity="0.7" />
            <rect x="29.5" y="6" width="5" height="3.5" rx="1" fill="#5B5B55" />
            <ellipse
              cx="32"
              cy="13.5"
              rx="3.6"
              ry="5"
              fill={colour}
              className="festive-bulb"
              style={{ animationDelay: `${(i * 0.37) % 2.4}s`, color: colour }}
            />
          </svg>
        );
      })}
    </div>
  );
}

/** A small Santa hat, perched on the logo badge. */
export function SantaHat({ className = "" }: { className?: string }) {
  const festive = useFestive();
  if (!festive) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 32"
      className={`pointer-events-none absolute ${className}`}
    >
      {/* hat body */}
      <path d="M4 25 C8 12 18 3 30 4 C34 5 35 9 33 13 C31 17 29 21 30 25 Z" fill="#C8102E" />
      <path d="M30 4 C34 5 35 9 33 13 C32 11 31 9 28 8 Z" fill="#9E0C24" />
      {/* fur brim */}
      <rect x="2" y="22" width="31" height="7" rx="3.5" fill="#FFFFFF" stroke="#E6DCD3" strokeWidth="0.8" />
      {/* pompom */}
      <circle cx="33.5" cy="13" r="4" fill="#FFFFFF" stroke="#E6DCD3" strokeWidth="0.8" />
    </svg>
  );
}
