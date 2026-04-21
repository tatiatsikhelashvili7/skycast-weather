import { useEffect, useRef } from "react";
import { WeatherResponse } from "../lib/api";

/**
 * Severity bucket for a weather `main` value. Transitions BETWEEN buckets
 * count as "significant"; transitions WITHIN the same bucket (e.g. Clear
 * at 10:00 vs Clear at 10:01) don't.
 *
 *   calm   — Clear / Clouds / Mist / Haze / Fog
 *   wet    — Drizzle / Rain
 *   snow   — Snow
 *   severe — Thunderstorm / Tornado / Squall / Extreme
 */
type Bucket = "calm" | "wet" | "snow" | "severe";

function bucketOf(main: string): Bucket {
  const m = main.toLowerCase();
  if (m.includes("thunder") || m.includes("tornado") || m.includes("squall"))
    return "severe";
  if (m.includes("snow")) return "snow";
  if (m.includes("rain") || m.includes("drizzle")) return "wet";
  return "calm";
}

function messageFor(prev: Bucket, next: Bucket, main: string): string {
  if (next === "severe") return `Severe weather alert — ${main.toLowerCase()} conditions incoming.`;
  if (next === "wet" && prev === "calm") return `Rain is moving in.`;
  if (next === "snow" && prev !== "snow") return `It's starting to snow.`;
  if (next === "calm" && prev !== "calm") return `The weather is clearing up.`;
  return `Weather just shifted to ${main.toLowerCase()}.`;
}

/**
 * Mock notification system — fires a real `Notification` (when the user
 * has granted permission) whenever the weather for the currently-selected
 * city changes from one severity bucket to another. Also falls back to a
 * subtle in-page `console.info` so we don't surprise the user with an
 * `alert()` if they haven't opted in to notifications.
 *
 * Call this once per Dashboard mount, passing it the `current` payload.
 * The hook handles permission requests, debouncing, and city-change reset
 * internally.
 */
export function useWeatherAlerts(current: WeatherResponse | null) {
  const lastBucketRef = useRef<Bucket | null>(null);
  const lastCityRef = useRef<string | null>(null);
  const askedPermissionRef = useRef(false);

  useEffect(() => {
    if (!current) return;

    const city = current.name;
    const main = current.weather[0]?.main || "";
    const next = bucketOf(main);

    // New city → just remember the bucket, never fire on first sample.
    if (lastCityRef.current !== city) {
      lastCityRef.current = city;
      lastBucketRef.current = next;
      return;
    }

    const prev = lastBucketRef.current;
    lastBucketRef.current = next;
    if (prev === null || prev === next) return;

    const message = messageFor(prev, next, main);

    // Lazy permission prompt — only once per session, only after we have
    // an actual event to announce. Not blocking: the console fallback
    // still fires even if the user denies permission.
    if (
      "Notification" in window &&
      Notification.permission === "default" &&
      !askedPermissionRef.current
    ) {
      askedPermissionRef.current = true;
      Notification.requestPermission().catch(() => {});
    }

    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(`SkyCast · ${city}`, {
          body: message,
          icon: "/favicon.svg",
          badge: "/favicon.svg",
          tag: `skycast-${city}`,
        });
      } catch {
        console.info(`[SkyCast alert] ${city}: ${message}`);
      }
    } else {
      console.info(`[SkyCast alert] ${city}: ${message}`);
    }
  }, [current]);
}
