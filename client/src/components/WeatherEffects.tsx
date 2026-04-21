import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Weather particle engine — draws rain / drizzle / snow on a full-screen
 * Canvas, and overlays random lightning flashes for thunderstorms.
 *
 * Why Canvas and not DOM nodes?
 *   • 100s of particles at 60 fps — one `<canvas>` paint is ~free, 100
 *     animated `<span>`s trigger layout thrash on low-end devices.
 *   • DPR-aware crisp rendering on HiDPI displays.
 *   • A single `requestAnimationFrame` loop is easy to pause when the
 *     tab is hidden.
 *
 * The component is purely decorative: `pointer-events: none`, absolutely
 * positioned, never contributes to layout.
 */
export type WeatherEffectKind = "rain" | "drizzle" | "snow" | "none";

interface Props {
  kind: WeatherEffectKind;
  /** When true, a white flash overlay fires every 10–15s on top of the canvas. */
  thunder?: boolean;
}

export function WeatherEffects({ kind, thunder = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (kind === "none") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cap DPR at 2 — anything higher burns battery with no visible gain.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    /**
     * Size the canvas from its OWN bounding box, never from
     * `window.innerWidth`. On mobile Safari + Chrome, `window.innerWidth`
     * is unreliable during browser-chrome transitions, in PWA standalone
     * mode, and in iOS split-view — it was the root cause of the
     * "rain only on the left side" bug. The canvas has `inset-0` so its
     * rect IS the viewport, measured exactly.
     */
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // Fall back to window metrics only if the element hasn't laid out
      // yet (very rare — happens during the first frame after mount).
      width = Math.round(rect.width) || window.innerWidth;
      height = Math.round(rect.height) || window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      // IMPORTANT: do NOT set canvas.style.width/height. Leaving them
      // unset lets the Tailwind `inset-0` classes keep the element
      // stretched to the parent; otherwise the inline style would pin
      // the canvas to a snapshot size that's wrong after orientation
      // changes on mobile.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // ResizeObserver gives us pixel-perfect updates for EVERY resize
    // cause — orientation flip, URL-bar show/hide, DevTools docking,
    // iOS split-screen drag — without needing to listen for multiple
    // separate events.
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    type Particle = {
      x: number;
      y: number;
      len: number;
      speed: number;
      drift: number;
      size: number;
      alpha: number;
    };

    const count =
      kind === "rain" ? 260 : kind === "drizzle" ? 120 : kind === "snow" ? 140 : 0;

    const particles: Particle[] = Array.from({ length: count }, () =>
      spawn(kind, width, height, true)
    );

    let rafId = 0;
    let running = true;

    const step = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      if (kind === "rain" || kind === "drizzle") {
        ctx.strokeStyle =
          kind === "rain" ? "rgba(200,220,255,0.55)" : "rgba(200,220,255,0.35)";
        ctx.lineWidth = kind === "rain" ? 1.1 : 0.8;
        ctx.beginPath();
        for (const p of particles) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.drift * 0.4, p.y + p.len);
          p.y += p.speed;
          p.x += p.drift;
          // Wrap horizontally too — prevents a dead zone if drift
          // accumulates particles on one edge over time.
          if (p.x > width) p.x = -10;
          if (p.x < -10) p.x = width;
          if (p.y > height) Object.assign(p, spawn(kind, width, height, false));
        }
        ctx.stroke();
      } else if (kind === "snow") {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        for (const p of particles) {
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speed;
          p.x += Math.sin((p.y + p.drift) * 0.01) * 0.6;
          if (p.x > width + 10) p.x = -10;
          if (p.x < -10) p.x = width + 10;
          if (p.y > height) Object.assign(p, spawn(kind, width, height, false));
        }
        ctx.globalAlpha = 1;
      }

      rafId = requestAnimationFrame(step);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      } else if (!running) {
        running = true;
        rafId = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // iOS Safari doesn't always fire ResizeObserver on orientation
    // flip — belt-and-braces `orientationchange` listener covers it.
    window.addEventListener("orientationchange", resize);

    rafId = requestAnimationFrame(step);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("orientationchange", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [kind]);

  return (
    <>
      {kind !== "none" && (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}
      {thunder && <ThunderFlash />}
    </>
  );
}

/**
 * Spawn / respawn a single particle. When `initial` is true we scatter it
 * across the full viewport so the scene looks "in progress" on mount;
 * otherwise we spawn above the top edge so particles flow in naturally.
 */
function spawn(
  kind: WeatherEffectKind,
  width: number,
  height: number,
  initial: boolean
) {
  const y = initial ? Math.random() * height : -20 - Math.random() * 120;
  if (kind === "rain") {
    return {
      x: Math.random() * width,
      y,
      len: 14 + Math.random() * 18,
      speed: 12 + Math.random() * 10,
      drift: 1.2 + Math.random() * 0.8,
      size: 0,
      alpha: 0.6,
    };
  }
  if (kind === "drizzle") {
    return {
      x: Math.random() * width,
      y,
      len: 6 + Math.random() * 8,
      speed: 3.5 + Math.random() * 2.5,
      drift: 0.4 + Math.random() * 0.6,
      size: 0,
      alpha: 0.4,
    };
  }
  // snow
  return {
    x: Math.random() * width,
    y,
    len: 0,
    speed: 0.6 + Math.random() * 1.4,
    drift: Math.random() * 200,
    size: 1 + Math.random() * 2.5,
    alpha: 0.5 + Math.random() * 0.5,
  };
}

/**
 * Full-screen white flash that fires every 10–15 seconds while thunder
 * is active. Each strike has a short "main" burst + a fainter aftershock,
 * so it reads as actual lightning rather than a strobe effect.
 */
function ThunderFlash() {
  const [strikeId, setStrikeId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fire = () => {
      if (cancelled) return;
      setStrikeId((n) => n + 1);
      const next = 10000 + Math.random() * 5000;
      timer = window.setTimeout(fire, next);
    };
    let timer = window.setTimeout(fire, 4000 + Math.random() * 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key={strikeId}
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "white", mixBlendMode: "screen" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0, 0.45, 0] }}
        transition={{ duration: 0.9, times: [0, 0.12, 0.35, 0.55, 1] }}
      />
    </AnimatePresence>
  );
}
