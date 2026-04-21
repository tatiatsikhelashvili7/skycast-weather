import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
} from "lucide-react";

interface Props {
  main: string;
  icon?: string;
  size?: number;
  className?: string;
  /**
   * Condition-aware micro-animation.
   *   • sun  → slow continuous rotation
   *   • moon → gentle bob + soft glow pulse
   *   • clouds / fog / haze → horizontal drift
   *   • rain / drizzle / snow → vertical bob
   *   • thunder → quick flicker (opacity pulse) + bob
   *
   * Pass `animate={false}` to render a static icon (useful when the caller
   * already wraps the icon in its own motion element).
   */
  animate?: boolean;
}

type IconKey =
  | "sun"
  | "moon"
  | "cloud"
  | "rain"
  | "drizzle"
  | "snow"
  | "thunder"
  | "fog";

function resolveKind(main: string, icon: string): IconKey {
  const m = main.toLowerCase();
  const isNight = icon.endsWith("n");
  if (m.includes("thunder")) return "thunder";
  if (m.includes("drizzle")) return "drizzle";
  if (m.includes("rain")) return "rain";
  if (m.includes("snow")) return "snow";
  if (m.includes("cloud")) return "cloud";
  if (
    m.includes("mist") ||
    m.includes("fog") ||
    m.includes("haze") ||
    m.includes("smoke")
  )
    return "fog";
  if (m.includes("clear")) return isNight ? "moon" : "sun";
  return "cloud";
}

export function WeatherIcon({
  main,
  icon = "",
  size = 112,
  className = "",
  animate = true,
}: Props) {
  const kind = resolveKind(main, icon);
  const iconProps = { size, strokeWidth: 1.25, className };

  const IconComponent = (() => {
    switch (kind) {
      case "sun":
        return <Sun {...iconProps} />;
      case "moon":
        return <Moon {...iconProps} />;
      case "thunder":
        return <CloudLightning {...iconProps} />;
      case "drizzle":
        return <CloudDrizzle {...iconProps} />;
      case "rain":
        return <CloudRain {...iconProps} />;
      case "snow":
        return <CloudSnow {...iconProps} />;
      case "fog":
        return <CloudFog {...iconProps} />;
      case "cloud":
      default:
        return <Cloud {...iconProps} />;
    }
  })();

  if (!animate) return IconComponent;

  // Each animation is deliberately gentle so dozens of icons on the page
  // don't visually compete with each other or steal focus from the hero.
  switch (kind) {
    case "sun":
      return (
        <motion.span
          className="inline-block will-change-transform"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ originX: 0.5, originY: 0.5 }}
        >
          {IconComponent}
        </motion.span>
      );
    case "moon":
      return (
        <motion.span
          className="inline-block will-change-transform"
          animate={{ y: [0, -3, 0], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          {IconComponent}
        </motion.span>
      );
    case "cloud":
    case "fog":
      return (
        <motion.span
          className="inline-block will-change-transform"
          animate={{ x: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          {IconComponent}
        </motion.span>
      );
    case "rain":
    case "drizzle":
    case "snow":
      return (
        <motion.span
          className="inline-block will-change-transform"
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {IconComponent}
        </motion.span>
      );
    case "thunder":
      return (
        <motion.span
          className="inline-block will-change-transform"
          animate={{ opacity: [1, 0.55, 1, 0.8, 1], y: [0, -2, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {IconComponent}
        </motion.span>
      );
  }
}
