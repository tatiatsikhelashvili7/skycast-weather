import { motion } from "framer-motion";

interface Props {
  /** value from 0..max */
  value: number;
  max: number;
  label: string;
  display: string;
  hint?: string;
  color?: string;
  size?: number;
}

/**
 * Circular progress gauge. Used for humidity, UV, cloud cover, etc.
 * Animates the stroke-dashoffset on mount for a satisfying "fill" effect.
 */
export function GaugeRing({
  value,
  max,
  label,
  display,
  hint,
  color = "#38bdf8",
  size = 120,
}: Props) {
  const pct = Math.min(1, Math.max(0, value / max));
  const radius = size / 2 - 8;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center justify-center gap-1 select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={6}
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color}99)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-display text-xl font-semibold leading-none">
            {display}
          </div>
          {hint && <div className="text-[10px] text-white/50 mt-1">{hint}</div>}
        </div>
      </div>
      <div className="text-[11px] uppercase tracking-widest text-white/60">
        {label}
      </div>
    </div>
  );
}
