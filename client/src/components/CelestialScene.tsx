import { useMemo } from "react";
import { motion } from "framer-motion";
import { Theme } from "../lib/weather";

interface Props {
  theme: Theme;
}

/**
 * Celestial scene — paints sun / moon / scenery clouds on top of the base
 * sky. Only handles *condition-linked* visuals; the time-of-day star field
 * lives in `DynamicBackground > NightStars` and the thunderstorm flash
 * lives in `WeatherEffects`, so this component is free to focus on the
 * slow, always-on "skybox".
 */
export function CelestialScene({ theme }: Props) {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      {/* Aurora / horizon glow — always on, tinted by theme accent */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 55% at 50% 100%, ${theme.accent}33 0%, transparent 70%)`,
        }}
      />

      {theme.key === "clear-day" && <AnimatedSun />}
      {theme.key === "clear-night" && <AnimatedMoon />}
      {theme.key === "clouds" && (
        <>
          <SoftSun dim />
          <SceneryClouds count={5} />
        </>
      )}
      {theme.key === "mist" && <SceneryClouds count={7} low />}
      {theme.key === "rain" && <SceneryClouds count={4} dark />}
      {theme.key === "thunderstorm" && <SceneryClouds count={4} dark />}
      {theme.key === "snow" && <SoftSun pastel />}
    </div>
  );
}

/* ─────────────── Sun ─────────────── */

function AnimatedSun() {
  return (
    <div
      className="absolute"
      style={{ top: "18%", left: "50%", transform: "translateX(-50%)" }}
    >
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 540,
          height: 540,
          left: "50%",
          top: "50%",
          x: "-50%",
          y: "-50%",
          background:
            "radial-gradient(circle, rgba(244,216,184,0.38) 0%, rgba(217,183,155,0.22) 40%, transparent 72%)",
          filter: "blur(14px)",
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 110,
          height: 110,
          left: "50%",
          top: "50%",
          x: "-50%",
          y: "-50%",
          background:
            "radial-gradient(circle at 35% 30%, #fdf2e3 0%, #f0d6b8 55%, #d9b79b 100%)",
          boxShadow: "0 0 80px 20px rgba(244,216,184,0.35)",
        }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function SoftSun({
  dim = false,
  pastel = false,
}: {
  dim?: boolean;
  pastel?: boolean;
}) {
  const color = pastel
    ? "radial-gradient(circle, rgba(230,236,242,0.55) 0%, rgba(196,210,224,0.25) 50%, transparent 75%)"
    : dim
    ? "radial-gradient(circle, rgba(240,214,184,0.35) 0%, rgba(200,200,210,0.15) 55%, transparent 80%)"
    : "radial-gradient(circle, rgba(244,216,184,0.45) 0%, rgba(217,183,155,0.2) 45%, transparent 75%)";
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        top: "12%",
        right: "14%",
        width: 280,
        height: 280,
        background: color,
        filter: "blur(10px)",
      }}
      animate={{ scale: [1, 1.04, 1], opacity: [0.7, 0.95, 0.7] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ─────────────── Moon ─────────────── */

function AnimatedMoon() {
  return (
    <div className="absolute" style={{ top: "16%", right: "14%" }}>
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 340,
          height: 340,
          left: "50%",
          top: "50%",
          x: "-50%",
          y: "-50%",
          background:
            "radial-gradient(circle, rgba(138,164,200,0.35) 0%, rgba(138,164,200,0.15) 45%, transparent 75%)",
          filter: "blur(10px)",
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative" style={{ width: 120, height: 120 }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #dce5ef 0%, #b8c5d4 55%, #8aa4c8 100%)",
            boxShadow: "0 0 50px 10px rgba(138,164,200,0.35)",
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────── Scenery clouds (internal) ─────────────── */

interface SceneryCloudsProps {
  count: number;
  dark?: boolean;
  low?: boolean;
}

/**
 * Blurry radial "puff" clouds used inside CelestialScene for cloudy / misty /
 * rainy / stormy conditions. Named `SceneryClouds` to disambiguate from the
 * crisper SVG-based `DriftingClouds` layer rendered by `DynamicBackground`.
 */
function SceneryClouds({ count, dark, low }: SceneryCloudsProps) {
  const clouds = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        key: i,
        top: (low ? 30 : 5) + Math.random() * (low ? 40 : 40),
        size: 180 + Math.random() * 220,
        opacity: dark
          ? 0.45 + Math.random() * 0.35
          : 0.55 + Math.random() * 0.35,
        duration: 60 + Math.random() * 80,
        delay: -Math.random() * 60,
      })),
    [count, dark, low]
  );

  return (
    <div className="absolute inset-0">
      {clouds.map((c) => (
        <motion.div
          key={c.key}
          className="absolute rounded-full"
          style={{
            top: `${c.top}%`,
            width: c.size,
            height: c.size * 0.45,
            background: dark
              ? "radial-gradient(ellipse at center, rgba(100,116,139,0.85) 0%, rgba(30,41,59,0.4) 60%, transparent 80%)"
              : "radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(248,250,252,0.4) 60%, transparent 80%)",
            filter: "blur(10px)",
            opacity: c.opacity,
          }}
          initial={{ x: "-30vw" }}
          animate={{ x: "130vw" }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

