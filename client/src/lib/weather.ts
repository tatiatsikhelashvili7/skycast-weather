export type ThemeKey = "clear-day" | "clear-night" | "clouds" | "drizzle" | "rain" | "thunderstorm" | "snow" | "mist" | "default";
export type ParticleKind = "rain" | "drizzle" | "snow" | "flare" | "none";
export interface Theme {
    key: ThemeKey;
    label: string;
    particles: ParticleKind;
    accent: string;
    blobA: string;
    blobB: string;
}
const THEMES: Record<ThemeKey, Theme> = {
    "clear-day": {
        key: "clear-day",
        label: "Clear sky",
        particles: "flare",
        accent: "#0ea5e9",
        blobA: "#075985",
        blobB: "#0ea5e9",
    },
    "clear-night": {
        key: "clear-night",
        label: "Clear night",
        particles: "none",
        accent: "#38bdf8",
        blobA: "#020617",
        blobB: "#075985",
    },
    clouds: {
        key: "clouds",
        label: "Cloudy",
        particles: "none",
        accent: "#7dd3fc",
        blobA: "#075985",
        blobB: "#020617",
    },
    drizzle: {
        key: "drizzle",
        label: "Drizzle",
        particles: "drizzle",
        accent: "#7dd3fc",
        blobA: "#075985",
        blobB: "#0ea5e9",
    },
    rain: {
        key: "rain",
        label: "Rain",
        particles: "rain",
        accent: "#38bdf8",
        blobA: "#075985",
        blobB: "#0ea5e9",
    },
    thunderstorm: {
        key: "thunderstorm",
        label: "Thunderstorm",
        particles: "rain",
        accent: "#bae6fd",
        blobA: "#020617",
        blobB: "#075985",
    },
    snow: {
        key: "snow",
        label: "Snow",
        particles: "snow",
        accent: "#e0f2fe",
        blobA: "#075985",
        blobB: "#7dd3fc",
    },
    mist: {
        key: "mist",
        label: "Mist",
        particles: "none",
        accent: "#cbd5e1",
        blobA: "#075985",
        blobB: "#020617",
    },
    default: {
        key: "default",
        label: "Weather",
        particles: "none",
        accent: "#38bdf8",
        blobA: "#075985",
        blobB: "#0ea5e9",
    },
};
export function themeFor(main: string, icon: string): Theme {
    const m = (main || "").toLowerCase();
    const isNight = icon?.endsWith("n");
    if (m.includes("thunder"))
        return THEMES.thunderstorm;
    if (m.includes("drizzle"))
        return THEMES.drizzle;
    if (m.includes("rain"))
        return THEMES.rain;
    if (m.includes("snow"))
        return THEMES.snow;
    if (m.includes("cloud"))
        return THEMES.clouds;
    if (m.includes("mist") ||
        m.includes("fog") ||
        m.includes("haze") ||
        m.includes("smoke"))
        return THEMES.mist;
    if (m.includes("clear"))
        return isNight ? THEMES["clear-night"] : THEMES["clear-day"];
    return THEMES.default;
}
export function degreesToCompass(deg: number): string {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round((deg % 360) / 45) % 8];
}
export function estimateUVIndex(main: string, icon: string, cloudiness: number): number {
    const isNight = icon?.endsWith("n");
    if (isNight)
        return 0;
    const m = main.toLowerCase();
    if (m.includes("clear"))
        return 8 - Math.round(cloudiness / 20);
    if (m.includes("cloud"))
        return Math.max(2, 6 - Math.round(cloudiness / 20));
    if (m.includes("rain") || m.includes("snow"))
        return 2;
    return 4;
}
