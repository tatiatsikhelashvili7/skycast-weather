/**
 * Sky palette engine for the Dynamic Background + Time Machine.
 *
 * Given an hour-of-day, returns a hand-tuned `SkyTint` — two colors that
 * together form a vertical linear gradient, plus two scalars that the rest
 * of the UI uses to fade in supporting effects:
 *
 *   • `nightiness`  — 0 at midday, 1 at midnight → drives star opacity
 *   • `sunsetness`  — peaks at sunrise / sunset   → drives warm horizon glow
 *
 * Values between keyframes are linearly interpolated in RGB space. It's
 * simple and cheap, and looks "right" because neighbouring keyframes are
 * chosen to sit in the same visual family.
 */

export interface SkyTint {
  /** CSS `rgb(...)` string for the TOP of the gradient. */
  topColor: string;
  /** CSS `rgb(...)` string for the BOTTOM of the gradient. */
  bottomColor: string;
  /** 0 = full daylight, 1 = full night. Drives star opacity etc. */
  nightiness: number;
  /** 0 = flat, 1 = peak golden hour. Drives the warm horizon wash. */
  sunsetness: number;
  /** Human-friendly phase label — useful for debug & a11y. */
  label: string;
}

type RGB = [number, number, number];

interface Keyframe {
  h: number;
  top: RGB;
  bottom: RGB;
  night: number;
  sunset: number;
  label: string;
}

/**
 * Keyframes sampled across a full 24 h cycle. First and last keyframes
 * must be at h=0 and h=24 and must match, so the palette wraps seamlessly.
 */
const KEYFRAMES: Keyframe[] = [
  // Night keyframes brightened to a rich "deep space" palette instead of
  // near-black, so wide desktop viewports don't feel like a dead void.
  // The stars layer still reads beautifully against these values.
  { h: 0,    top: [32, 28, 92],     bottom: [18, 14, 58],    night: 1.0,  sunset: 0.0, label: "Midnight" },
  { h: 5,    top: [50, 45, 115],    bottom: [28, 22, 72],    night: 0.95, sunset: 0.1, label: "Pre-dawn" },
  { h: 6.5,  top: [106, 90, 205],   bottom: [255, 140, 66],  night: 0.4,  sunset: 0.9, label: "Dawn" },
  { h: 8,    top: [135, 206, 235],  bottom: [250, 220, 140], night: 0.05, sunset: 0.3, label: "Morning" },
  { h: 12,   top: [79, 172, 254],   bottom: [0, 242, 254],   night: 0.0,  sunset: 0.0, label: "Midday" },
  { h: 15,   top: [100, 170, 240],  bottom: [175, 230, 250], night: 0.0,  sunset: 0.1, label: "Afternoon" },
  { h: 18,   top: [255, 94, 98],    bottom: [255, 153, 102], night: 0.2,  sunset: 1.0, label: "Sunset" },
  { h: 19.5, top: [97, 67, 133],    bottom: [81, 99, 149],   night: 0.6,  sunset: 0.6, label: "Dusk" },
  { h: 22,   top: [50, 45, 115],    bottom: [28, 20, 70],    night: 0.95, sunset: 0.1, label: "Night" },
  { h: 24,   top: [32, 28, 92],     bottom: [18, 14, 58],    night: 1.0,  sunset: 0.0, label: "Midnight" },
];

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}
function rgb(c: RGB): string {
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/**
 * Compute the sky tint for any hour-of-day (0–24, fractional allowed).
 * Out-of-range values wrap modulo 24.
 */
export function skyTintForHour(hour: number): SkyTint {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (h >= a.h && h <= b.h) {
      const t = (h - a.h) / Math.max(0.0001, b.h - a.h);
      return {
        topColor: rgb(lerpRGB(a.top, b.top, t)),
        bottomColor: rgb(lerpRGB(a.bottom, b.bottom, t)),
        nightiness: clamp01(lerp(a.night, b.night, t)),
        sunsetness: clamp01(lerp(a.sunset, b.sunset, t)),
        label: t < 0.5 ? a.label : b.label,
      };
    }
  }
  const k = KEYFRAMES[0];
  return {
    topColor: rgb(k.top),
    bottomColor: rgb(k.bottom),
    nightiness: k.night,
    sunsetness: k.sunset,
    label: k.label,
  };
}

/**
 * Convert a Unix-seconds timestamp to an approximate LOCAL hour-of-day
 * for the city described by `(sunrise, sunset)` — both also Unix-seconds.
 *
 * We derive the city's UTC offset by assuming `solarNoon == 12:00 local`,
 * which is accurate within ±1 h for almost every inhabited place on
 * Earth. It's a purely visual approximation; nothing numerically sensitive
 * depends on it being exact. If we don't have sunrise/sunset (e.g. a
 * mocked payload), we fall back to the browser's own local time.
 */
export function localHourFor(
  dt: number,
  sunrise?: number,
  sunset?: number
): number {
  if (!sunrise || !sunset) {
    const d = new Date(dt * 1000);
    return d.getHours() + d.getMinutes() / 60;
  }
  const solarNoonSecondsPastMidnightUtc = ((sunrise + sunset) / 2) % 86400;
  const offsetSec = 12 * 3600 - solarNoonSecondsPastMidnightUtc;
  const localUnix = dt + offsetSec;
  const secondsPastMidnight = ((localUnix % 86400) + 86400) % 86400;
  return secondsPastMidnight / 3600;
}
