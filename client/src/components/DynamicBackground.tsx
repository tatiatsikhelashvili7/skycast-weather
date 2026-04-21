import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Theme, themeFor } from "../lib/weather";
import { WeatherResponse } from "../lib/api";
import { localHourFor, skyTintForHour } from "../lib/sky";
import { useTimeMachine } from "../context/TimeMachineContext";
import { WeatherEffects, WeatherEffectKind } from "./WeatherEffects";
import { LensFlare } from "./LensFlare";
import { CelestialScene } from "./CelestialScene";
import { DriftingClouds } from "./DriftingClouds";

interface Props {
  /** Real, currently-observed weather — drives theme + local hour fallback. */
  current?: WeatherResponse | null;
}

/**
 * Dynamic Background Engine.
 *
 * Composes four stacked layers, back to front:
 *
 *   1. A morphing sky gradient driven by hour-of-day. Uses typed CSS
 *      custom properties (`--sky-top`, `--sky-bottom`) with `@property`
 *      so the browser interpolates RGB values smoothly as the user
 *      scrubs the Time Machine slider.
 *   2. Theme-coloured glow blobs that crossfade whenever the weather
 *      condition changes — keyed on `theme.key`, wrapped in
 *      `AnimatePresence` so same-condition city switches do NOT re-animate.
 *   3. A warm horizon wash that pulses during sunrise / sunset, scaled
 *      by `sunsetness` from the sky engine.
 *   4. A star field whose opacity is driven by `nightiness`, plus the
 *      existing celestial scene (sun / moon / clouds / lightning) and
 *      weather particle overlay.
 *
 * The layer reads `useTimeMachine()`: when the slider is being scrubbed,
 * its frame overrides the real `current.dt` / condition so the whole
 * sky previews the selected forecast moment.
 */
/**
 * Map the full theme `ParticleKind` to the narrower set the Canvas engine
 * renders. Flare / none both collapse to "none" because the canvas has
 * nothing to draw for them.
 */
function toCanvasKind(kind: string): WeatherEffectKind {
  if (kind === "rain" || kind === "drizzle" || kind === "snow") return kind;
  return "none";
}

export function DynamicBackground({ current }: Props) {
  const { frame } = useTimeMachine();

  // Effective condition + icon — prefer the previewed frame when scrubbing.
  const effectiveCondition = frame?.condition ?? current?.weather[0]?.main ?? "";
  const effectiveIcon = frame?.icon ?? current?.weather[0]?.icon ?? "";
  const theme: Theme = useMemo(
    () => themeFor(effectiveCondition, effectiveIcon),
    [effectiveCondition, effectiveIcon]
  );

  // Effective hour — prefer the slider, otherwise derive from current weather.
  const hour = useMemo(() => {
    if (frame) return frame.hour;
    if (current)
      return localHourFor(current.dt, current.sys.sunrise, current.sys.sunset);
    return 12;
  }, [frame, current]);

  const tint = useMemo(() => skyTintForHour(hour), [hour]);

  const showClouds =
    theme.key === "clouds" ||
    theme.key === "mist" ||
    theme.key === "thunderstorm";

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/*
        1. Morphing sky gradient — CSS handles the color interpolation
           thanks to the @property declarations in index.css.
      */}
      <div
        className="sky-layer absolute inset-0"
        style={
          {
            "--sky-top": tint.topColor,
            "--sky-bottom": tint.bottomColor,
          } as React.CSSProperties
        }
      />

      {/* 2. Theme-reactive glow blobs that crossfade when the condition changes. */}
      <AnimatePresence mode="sync">
        <motion.div
          key={theme.key}
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <GlowBlobs theme={theme} />
        </motion.div>
      </AnimatePresence>

      {/* 3. Warm horizon wash — only visible near sunrise / sunset. */}
      <SunsetGlow strength={tint.sunsetness} />

      {/* 4a. Stars — fade in with nightiness, regardless of weather theme.
          `ShootingStars` piggy-backs on the same nightiness scalar so the
          sky genuinely feels alive once the sun goes down. */}
      <NightStars intensity={tint.nightiness} />
      <ShootingStars intensity={tint.nightiness} />

      {/* 4b. Weather-specific SVG cloud drift (clouds / mist / storm only). */}
      {showClouds && (
        <DriftingClouds intensity={theme.key === "mist" ? 0.75 : 1} />
      )}

      {/* 4c. Sun / moon / scenery clouds / aurora — existing celestial scene. */}
      <div className="absolute inset-0 pointer-events-none opacity-80">
        <CelestialScene theme={theme} />
      </div>

      {/*
        4d–4e. Condition-driven atmospherics (lens flare on clear days,
        Canvas particles for rain / drizzle / snow, thunder flash when
        storming). Wrapped in a keyed `AnimatePresence` so that switching
        cities with a different weather state performs a buttery
        crossfade instead of an instant snap — this is the "Sandro"
        visual contract the rest of the sky engine honours.
      */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`fx-${theme.key}`}
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {theme.particles === "flare" && <LensFlare />}
          <WeatherEffects
            kind={toCanvasKind(theme.particles)}
            thunder={theme.key === "thunderstorm"}
          />
        </motion.div>
      </AnimatePresence>

      {/* Bottom readability fade keeps white type legible on bright skies.
          Kept intentionally light so it doesn't crush desktop's larger
          vertical canvas into a dead void. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, transparent 70%, rgba(11,17,32,0.18) 88%, rgba(11,17,32,0.35) 100%)",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────── Glow Blobs ─────────────────────────────── */

/**
 * Three very large, blurry radial blobs that slowly drift and pulse,
 * giving the background real "liquid" depth instead of feeling flat.
 *
 * Palette comes from the active theme so each weather state has its own
 * signature glow; because these live inside the parent `AnimatePresence`
 * layer they crossfade in and out together with the condition. Opacity
 * peaks are deliberately punchy (≥0.9 at the top of the cycle) so the
 * pulse is visible on desktop's larger surface area — the previous
 * values were too subtle and users read the background as "static".
 */
function GlowBlobs({ theme }: { theme: Theme }) {
  return (
    <>
      <motion.div
        aria-hidden
        className="absolute rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${theme.blobA} 0%, ${theme.blobA}cc 38%, transparent 72%)`,
          width: "62rem",
          height: "62rem",
          top: "-22%",
          left: "-18%",
          filter: "blur(130px)",
          mixBlendMode: "screen",
        }}
        animate={{
          x: [0, 90, -50, 0],
          y: [0, 60, 100, 0],
          scale: [1, 1.18, 0.92, 1],
          opacity: [0.75, 1, 0.7, 0.75],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute rounded-full"
        style={{
          background: `radial-gradient(circle at 70% 70%, ${theme.blobB} 0%, ${theme.blobB}cc 38%, transparent 72%)`,
          width: "68rem",
          height: "68rem",
          bottom: "-26%",
          right: "-20%",
          filter: "blur(140px)",
          mixBlendMode: "screen",
        }}
        animate={{
          x: [0, -70, 50, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.12, 0.9, 1],
          opacity: [0.65, 0.9, 0.68, 0.65],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.accent} 0%, ${theme.accent}99 40%, transparent 72%)`,
          width: "40rem",
          height: "40rem",
          top: "28%",
          left: "34%",
          filter: "blur(110px)",
          mixBlendMode: "screen",
        }}
        animate={{
          x: [0, 50, -40, 25, 0],
          y: [0, -40, 50, -15, 0],
          scale: [1, 1.2, 0.88, 1.08, 1],
          opacity: [0.42, 0.62, 0.45, 0.55, 0.42],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

/* ─────────────────────────────── Sunset glow ────────────────────────────── */

/**
 * Warm horizon wash rendered near the bottom of the screen. Opacity is
 * driven directly by the sky engine's `sunsetness` scalar, so it peaks at
 * sunrise and sunset and vanishes at midday / midnight.
 */
function SunsetGlow({ strength }: { strength: number }) {
  if (strength <= 0.01) return null;
  return (
    <motion.div
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-[70vh] pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 90% 55% at 50% 100%, rgba(255,140,66,0.45) 0%, rgba(255,94,98,0.25) 45%, transparent 80%)",
      }}
      animate={{ opacity: Math.min(1, strength) }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
    />
  );
}

/* ─────────────────────────────── Night stars ────────────────────────────── */

/**
 * Twinkling star field. Kicks in at the very first hint of dusk
 * (`intensity > 0.04`) so the sky never feels empty even before full
 * night falls. Star positions are randomised once and memoised; only
 * the container opacity animates with `intensity`.
 *
 * The field is split into two "tiers" — a dense layer of small far
 * stars plus a sparser layer of brighter close stars — which reads as
 * real depth instead of a flat dot pattern.
 */
function NightStars({ intensity }: { intensity: number }) {
  const stars = useMemo(
    () => [
      // Far tier — many, small, subtle.
      ...Array.from({ length: 160 }).map((_, i) => ({
        key: `f-${i}`,
        left: Math.random() * 100,
        top: Math.random() * 80,
        size: 0.6 + Math.random() * 1.4,
        delay: Math.random() * 5,
        duration: 2.5 + Math.random() * 4,
        bright: false,
      })),
      // Near tier — fewer, bigger, glow-forward.
      ...Array.from({ length: 40 }).map((_, i) => ({
        key: `n-${i}`,
        left: Math.random() * 100,
        top: Math.random() * 70,
        size: 1.8 + Math.random() * 2.2,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 3.5,
        bright: true,
      })),
    ],
    []
  );

  if (intensity <= 0.04) return null;

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      animate={{ opacity: Math.min(1, (intensity - 0.04) / 0.4) }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
    >
      {stars.map((s) => (
        <motion.span
          key={s.key}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            boxShadow: s.bright
              ? `0 0 ${s.size * 4}px rgba(255,255,255,0.95)`
              : `0 0 ${s.size * 2.2}px rgba(255,255,255,0.65)`,
          }}
          animate={{ opacity: s.bright ? [0.35, 1, 0.35] : [0.15, 0.85, 0.15] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────── Shooting stars ─────────────────────── */

/**
 * Occasional meteor streak that fires every 6–12 s at night. Pure
 * CSS/Framer Motion — a single thin gradient line that animates its
 * transform from off-screen top-left to off-screen bottom-right with
 * a fast opacity pulse. The `key` on the motion element is bumped on
 * each schedule tick so `AnimatePresence` re-plays the stroke cleanly.
 */
function ShootingStars({ intensity }: { intensity: number }) {
  const [tick, setTick] = useState(0);
  const [origin, setOrigin] = useState({ top: 12, left: 8, angle: 28 });

  useEffect(() => {
    if (intensity <= 0.3) return;
    let cancelled = false;
    const fire = () => {
      if (cancelled) return;
      setOrigin({
        top: Math.random() * 40,
        left: Math.random() * 60,
        angle: 22 + Math.random() * 18,
      });
      setTick((n) => n + 1);
      timer = window.setTimeout(fire, 6000 + Math.random() * 6000);
    };
    let timer = window.setTimeout(fire, 2500 + Math.random() * 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [intensity]);

  if (intensity <= 0.3) return null;

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      <motion.span
        key={tick}
        className="absolute block"
        style={{
          top: `${origin.top}%`,
          left: `${origin.left}%`,
          width: 180,
          height: 2,
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 60%, rgba(255,255,255,0) 100%)",
          transform: `rotate(${origin.angle}deg)`,
          transformOrigin: "0 50%",
          filter: "drop-shadow(0 0 6px rgba(255,255,255,0.8))",
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1], x: [0, 620] }}
        transition={{ duration: 1.1, ease: "easeOut", times: [0, 0.2, 1] }}
      />
    </div>
  );
}
