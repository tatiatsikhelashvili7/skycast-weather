import { motion } from "framer-motion";

/**
 * One big blurry SVG cloud. Gets cloned a handful of times with
 * different positions, scales, opacities, and drift durations so no
 * two cross the screen together.
 */
function Cloud({
  top,
  scale,
  opacity,
  duration,
  delay,
}: {
  top: string;
  scale: number;
  opacity: number;
  duration: number;
  delay: number;
}) {
  return (
    <motion.svg
      viewBox="0 0 200 80"
      width={320 * scale}
      height={128 * scale}
      initial={{ x: "-25vw" }}
      animate={{ x: "120vw" }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
      className="absolute"
      style={{
        top,
        opacity,
        filter: "blur(14px)",
      }}
    >
      <defs>
        <radialGradient id={`cloudGrad-${duration}`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <path
        d="M40 55 q-18 0 -22 -18 q0 -18 20 -20 q4 -18 25 -18 q18 0 25 14 q16 -10 32 4 q22 -4 26 18 q18 2 18 18 q0 18 -20 18 z"
        fill={`url(#cloudGrad-${duration})`}
      />
    </motion.svg>
  );
}

/**
 * Layer of 4 slow-drifting SVG clouds. Only renders when the current
 * theme reports cloudy conditions.
 */
export function DriftingClouds({ intensity = 1 }: { intensity?: number }) {
  const clouds = [
    { top: "8%", scale: 1.1, opacity: 0.55 * intensity, duration: 90, delay: 0 },
    { top: "22%", scale: 0.7, opacity: 0.35 * intensity, duration: 140, delay: 30 },
    { top: "48%", scale: 1.35, opacity: 0.5 * intensity, duration: 110, delay: 60 },
    { top: "68%", scale: 0.85, opacity: 0.3 * intensity, duration: 160, delay: 15 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {clouds.map((c, i) => (
        <Cloud key={i} {...c} />
      ))}
    </div>
  );
}
