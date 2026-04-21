import { useCallback, useEffect, useRef, useState } from "react";
import {
  LocatedPlace,
  WeatherResponse,
  ForecastResponse,
  fetchWeatherBundle,
} from "../lib/api";

const REFRESH_MS = 60_000;
const PLACE_STORAGE_KEY = "skycast_place";
/** Legacy key — migrated on first load, then removed. */
const LEGACY_CITY_KEY = "skycast_city";

export interface UseWeatherReturn {
  /** Currently-selected place, or `null` if nothing has been searched yet. */
  place: LocatedPlace | null;
  current: WeatherResponse | null;
  forecast: ForecastResponse | null;
  /** `true` during the first load for a new place — used to show skeletons. */
  loading: boolean;
  /** `true` during a silent background refresh — used to shimmer cards. */
  refetching: boolean;
  /** Last error message, or `null`. */
  error: string | null;
  /** `true` once at least one fetch for the current place has completed. */
  attempted: boolean;
  /** Replace the active place and trigger a fresh fetch. */
  setPlace: (place: LocatedPlace | null) => void;
  /** Imperatively reload the current place. No-op if `place` is null. */
  refetch: () => void;
}

/* ─────────── LocalStorage helpers ─────────── */

function readStoredPlace(): LocatedPlace | null {
  try {
    const raw = localStorage.getItem(PLACE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocatedPlace;
      if (
        parsed &&
        typeof parsed.lat === "number" &&
        typeof parsed.lon === "number" &&
        typeof parsed.label === "string"
      ) {
        return { ...parsed, source: "storage" };
      }
    }
    // One-time migration from the old "city name only" key
    const legacy = localStorage.getItem(LEGACY_CITY_KEY);
    if (legacy) {
      localStorage.removeItem(LEGACY_CITY_KEY);
      return null; // signal that Dashboard should geocode+replay it
    }
  } catch {
    /* corrupted LS — fall through */
  }
  return null;
}

function writeStoredPlace(place: LocatedPlace | null): void {
  try {
    if (place) {
      const { label, lat, lon, country } = place;
      localStorage.setItem(
        PLACE_STORAGE_KEY,
        JSON.stringify({ label, lat, lon, country })
      );
    } else {
      localStorage.removeItem(PLACE_STORAGE_KEY);
    }
  } catch {
    /* private mode / quota — ignore */
  }
}

/**
 * `useWeather` — single source of truth for the weather payload.
 *
 * Contract:
 *   • The caller supplies a `LocatedPlace` (always resolved to coords).
 *   • Fetches `{ current, forecast }` as a bundle → exactly one backend
 *     round-trip per refresh cycle.
 *   • Distinguishes `loading` (hard reload, show skeleton) from
 *     `refetching` (silent 60s refresh, show shimmer).
 *   • Persists the active place in localStorage so reloading restores
 *     the last thing the user was looking at.
 *   • Exposes `refetch()` for retry buttons.
 */
export function useWeather(): UseWeatherReturn {
  const [place, setPlaceState] = useState<LocatedPlace | null>(() =>
    readStoredPlace()
  );
  const [current, setCurrent] = useState<WeatherResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  // `currentRef` gives our async code access to the latest payload without
  // forcing us to list it as an effect dependency (which would cause a
  // refetch loop).
  const currentRef = useRef<WeatherResponse | null>(null);
  currentRef.current = current;

  /* ─────────── Public setters ─────────── */

  const setPlace = useCallback((next: LocatedPlace | null) => {
    writeStoredPlace(next);
    setPlaceState((prev) => {
      // If the coords actually changed, aggressively clear the payload so
      // the dashboard crossfades to the skeleton screen instead of
      // briefly displaying stale data from the previous city (what the
      // user used to see as a "Weather not found" blink).
      const coordsChanged =
        !prev || !next || prev.lat !== next.lat || prev.lon !== next.lon;
      if (coordsChanged) {
        setCurrent(null);
        setForecast(null);
      }
      return next;
    });

    if (!next) {
      setError(null);
      setAttempted(false);
      setLoading(false);
      setRefetching(false);
    } else {
      setError(null);
      setAttempted(false);
    }
  }, []);

  const refetch = useCallback(() => setRetryTick((n) => n + 1), []);

  /* ─────────── Fetch effect ─────────── */

  useEffect(() => {
    if (!place) return;

    let cancelled = false;

    const load = async (showSpinner: boolean) => {
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefetching(true);
      }
      try {
        const bundle = await fetchWeatherBundle(place.lat, place.lon);
        if (cancelled) return;
        setCurrent(bundle.current);
        setForecast(bundle.forecast);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Could not load weather right now.";
        setError(msg);
        // Keep the last good payload on a silent refresh failure, but
        // clear it on a hard (first-time) load so the error UI takes over.
        if (showSpinner && !currentRef.current) {
          setCurrent(null);
          setForecast(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefetching(false);
          setAttempted(true);
        }
      }
    };

    load(true);
    const id = window.setInterval(() => load(false), REFRESH_MS);
    const onFocus = () => load(false);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [place?.lat, place?.lon, retryTick]);

  return {
    place,
    current,
    forecast,
    loading,
    refetching,
    error,
    attempted,
    setPlace,
    refetch,
  };
}
