const TOKEN_KEY = "skycast_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers = new Headers(opts.headers || {});
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...opts, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/* ---------- Domain types ---------- */

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  descriptionKa?: string;
  icon: string;
}

export interface WeatherResponse {
  name: string;
  sys: { country: string; sunrise: number; sunset: number };
  coord: { lat: number; lon: number };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    temp_min: number;
    temp_max: number;
  };
  weather: WeatherCondition[];
  wind: { speed: number; deg: number };
  visibility: number;
  clouds: { all: number };
  dt: number;
  /** Server-provided UV index (0–11). Falls back to a heuristic if missing. */
  uvIndex?: number;
  cached?: boolean;
  source?: string;
  updatedAt?: string;
}

/**
 * Safe accessor for a weather condition — some upstream payloads arrive
 * with an empty `weather` array (rare, but we've seen it in the wild).
 * Returns a neutral "unknown weather" placeholder so consumers never
 * have to `?.` through the access chain.
 */
export function primaryCondition(w: WeatherResponse): WeatherCondition {
  return (
    w.weather[0] || {
      id: 0,
      main: "Unknown",
      description: "weather",
      icon: "01d",
    }
  );
}

export interface ForecastResponse {
  list: {
    dt: number;
    main: { temp: number; humidity: number };
    weather: { main: string; description: string; icon: string }[];
    wind: { speed: number };
    dt_txt: string;
  }[];
  city: { name: string; country: string; sunrise: number; sunset: number };
}

export interface Favorite {
  id: number;
  city: string;
  country: string | null;
  lat: number | null;
  lon: number | null;
  created_at: string;
}

/* ─────────── Geocoding + bundle types ─────────── */

export interface GeocodeResult {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone?: string;
}

export interface WeatherBundle {
  current: WeatherResponse;
  forecast: ForecastResponse;
}

/**
 * A resolved place — something we can fetch weather for. Always has
 * concrete coordinates so the underlying hook can drive a single
 * coord-based pipeline for both search and "my location".
 */
export interface LocatedPlace {
  /** Human-readable label shown in the UI */
  label: string;
  /** Two-letter country code (ISO-3166) when known */
  country?: string;
  lat: number;
  lon: number;
  /** Where the place came from — useful for logging / debugging */
  source?: "search" | "coords" | "geolocation" | "storage" | "favorite";
}

/**
 * Turn a free-text query ("London", "Tbilisi") into coordinates via the
 * server's geocoding proxy. Throws a nicely-phrased error on 404 so the
 * caller can surface it as a toast.
 */
export async function geocodeCity(query: string): Promise<GeocodeResult> {
  return api.get<GeocodeResult>(
    `/api/weather/geocode?q=${encodeURIComponent(query.trim())}`
  );
}

/** Reverse-geocode a GPS position into the nearest populated place. */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodeResult | null> {
  try {
    return await api.get<GeocodeResult>(
      `/api/weather/reverse?lat=${lat}&lon=${lon}`
    );
  } catch {
    return null;
  }
}

/** Fetch `{ current, forecast }` in a single coordinate-based round-trip. */
export async function fetchWeatherBundle(
  lat: number,
  lon: number
): Promise<WeatherBundle> {
  return api.get<WeatherBundle>(
    `/api/weather/bundle?lat=${lat}&lon=${lon}`
  );
}
