export type ThemeKey =
  | "clear-day"
  | "clear-night"
  | "clouds"
  | "drizzle"
  | "rain"
  | "thunderstorm"
  | "snow"
  | "mist"
  | "default";

export type ParticleKind =
  | "rain"
  | "drizzle"
  | "snow"
  | "flare"
  | "none";

/**
 * A visual theme derived from the current weather condition. The Sky engine
 * (see `lib/sky.ts`) drives the BASE gradient — these values only control
 * overlay accents: particle kind, glow-blob colors, and a human label.
 */
export interface Theme {
  key: ThemeKey;
  label: string;
  /**
   * Atmospheric overlay:
   *   • `rain`    / `drizzle` / `snow` — rendered by `WeatherEffects` on a
   *     full-screen Canvas (DPR-aware, pauses when the tab is hidden).
   *   • `flare`                         — DOM-based lens-flare overlay used
   *     for clear-day skies (`LensFlare`).
   *   • `none`                          — no overlay.
   */
  particles: ParticleKind;
  /** Primary accent color — used for aurora glow + highlights. */
  accent: string;
  /** Primary glow color for the large background blob (weather-reactive). */
  blobA: string;
  /** Secondary glow color for the second background blob. */
  blobB: string;
}

const THEMES: Record<ThemeKey, Theme> = {
  "clear-day": {
    key: "clear-day",
    label: "Clear sky",
    particles: "flare",
    accent: "#fbbf24",
    blobA: "#f59e0b",
    blobB: "#8b5cf6",
  },
  "clear-night": {
    key: "clear-night",
    label: "Clear night",
    particles: "none",
    accent: "#a5b4fc",
    blobA: "#4f46e5",
    blobB: "#8b5cf6",
  },
  clouds: {
    key: "clouds",
    label: "Cloudy",
    particles: "none",
    accent: "#94a3b8",
    blobA: "#64748b",
    blobB: "#6366f1",
  },
  drizzle: {
    key: "drizzle",
    label: "Drizzle",
    particles: "drizzle",
    accent: "#7dd3fc",
    blobA: "#38bdf8",
    blobB: "#6366f1",
  },
  rain: {
    key: "rain",
    label: "Rain",
    particles: "rain",
    accent: "#38bdf8",
    blobA: "#0ea5e9",
    blobB: "#3b82f6",
  },
  thunderstorm: {
    key: "thunderstorm",
    label: "Thunderstorm",
    particles: "rain",
    accent: "#c4b5fd",
    blobA: "#8b5cf6",
    blobB: "#ec4899",
  },
  snow: {
    key: "snow",
    label: "Snow",
    particles: "snow",
    accent: "#e0f2fe",
    blobA: "#38bdf8",
    blobB: "#a5b4fc",
  },
  mist: {
    key: "mist",
    label: "Mist",
    particles: "none",
    accent: "#cbd5e1",
    blobA: "#64748b",
    blobB: "#94a3b8",
  },
  default: {
    key: "default",
    label: "Weather",
    particles: "none",
    accent: "#a5b4fc",
    blobA: "#6366f1",
    blobB: "#8b5cf6",
  },
};

/**
 * Map a raw OpenWeatherMap `weather.main` + `icon` pair to a visual theme.
 * The icon's last character (`d` / `n`) disambiguates day vs night for
 * "Clear" conditions.
 */
export function themeFor(main: string, icon: string): Theme {
  const m = (main || "").toLowerCase();
  const isNight = icon?.endsWith("n");
  if (m.includes("thunder")) return THEMES.thunderstorm;
  if (m.includes("drizzle")) return THEMES.drizzle;
  if (m.includes("rain")) return THEMES.rain;
  if (m.includes("snow")) return THEMES.snow;
  if (m.includes("cloud")) return THEMES.clouds;
  if (
    m.includes("mist") ||
    m.includes("fog") ||
    m.includes("haze") ||
    m.includes("smoke")
  )
    return THEMES.mist;
  if (m.includes("clear"))
    return isNight ? THEMES["clear-night"] : THEMES["clear-day"];
  return THEMES.default;
}

/** 8-point compass bearing for a wind direction in degrees. */
export function degreesToCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round((deg % 360) / 45) % 8];
}

/**
 * Lightweight UV-index estimate when the backend doesn't provide one
 * directly. Uses weather condition + cloud cover as heuristics.
 */
export function estimateUVIndex(
  main: string,
  icon: string,
  cloudiness: number
): number {
  const isNight = icon?.endsWith("n");
  if (isNight) return 0;
  const m = main.toLowerCase();
  if (m.includes("clear")) return 8 - Math.round(cloudiness / 20);
  if (m.includes("cloud")) return Math.max(2, 6 - Math.round(cloudiness / 20));
  if (m.includes("rain") || m.includes("snow")) return 2;
  return 4;
}
