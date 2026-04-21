/**
 * Open-Meteo — free, worldwide, no-API-key weather service.
 * Aggregates data from official national weather services (NOAA, DWD,
 * ECMWF, Met Office, JMA, etc.) and updates hourly.
 *
 * Docs: https://open-meteo.com/en/docs
 * Geocoding: https://open-meteo.com/en/docs/geocoding-api
 *
 * We cache results for 10 minutes — Open-Meteo's underlying data refreshes
 * at most hourly, so this keeps the UI fresh while being polite to their
 * free service.
 */

import { db } from "../db";

const FORECAST = "https://api.open-meteo.com/v1/forecast";
const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
/**
 * BigDataCloud offers a free, key-less reverse-geocoding endpoint. Open-Meteo
 * itself doesn't have real reverse geocoding — only forward search — so we use
 * BDC to turn (lat, lon) into a proper city name.
 *   https://www.bigdatacloud.com/docs/api/free-reverse-geocode-to-city-api
 */
const BDC_REVERSE =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";
const TTL_MS = 10 * 60 * 1000; // 10 min

/* ─────────── Cache ─────────── */

type CacheRow = { payload: string; fetched_at: number };

function getCached(key: string): any | null {
  const row = db
    .prepare("SELECT payload, fetched_at FROM weather_cache WHERE cache_key = ?")
    .get(key) as CacheRow | undefined;
  if (!row) return null;
  if (Date.now() - row.fetched_at > TTL_MS) return null;
  try {
    return JSON.parse(row.payload);
  } catch {
    return null;
  }
}

function setCached(key: string, payload: unknown): void {
  db.prepare(
    `INSERT INTO weather_cache (cache_key, payload, fetched_at)
     VALUES (?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`
  ).run(key, JSON.stringify(payload), Date.now());
}

/* ─────────── Geocoding ─────────── */

interface GeocodeResult {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone?: string;
}

export async function geocodeCity(city: string): Promise<GeocodeResult | null> {
  const key = `geo:${city.toLowerCase().trim()}`;
  const cached = getCached(key);
  if (cached) return cached;

  const url = `${GEOCODE}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const r = data?.results?.[0];
  if (!r) return null;
  const out: GeocodeResult = {
    name: r.name,
    country: r.country ?? "",
    countryCode: r.country_code ?? "",
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone,
  };
  setCached(key, out);
  return out;
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodeResult | null> {
  const key = `rev:${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = getCached(key);
  if (cached) return cached;

  const url = `${BDC_REVERSE}?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    // BDC returns several fields; prefer the most specific populated place.
    const name =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      data.countryName ||
      "";
    if (!name) return null;
    const out: GeocodeResult = {
      name,
      country: data.countryName ?? "",
      countryCode: data.countryCode ?? "",
      lat,
      lon,
    };
    setCached(key, out);
    return out;
  } catch {
    return null;
  }
}

/* ─────────── WMO weather-code → OWM-ish mapping ─────────── */

interface CondMap {
  main: string;
  description: string;
  icon: string;
  id: number;
}

function wmoToCondition(code: number, isDay: boolean): CondMap {
  const d = isDay ? "d" : "n";
  const map: Record<number, CondMap> = {
    0: { main: "Clear", description: "clear sky", icon: `01${d}`, id: 800 },
    1: { main: "Clear", description: "mainly clear", icon: `01${d}`, id: 800 },
    2: { main: "Clouds", description: "partly cloudy", icon: `02${d}`, id: 801 },
    3: { main: "Clouds", description: "overcast", icon: `04${d}`, id: 804 },
    45: { main: "Mist", description: "fog", icon: `50${d}`, id: 741 },
    48: { main: "Mist", description: "freezing fog", icon: `50${d}`, id: 741 },
    51: { main: "Drizzle", description: "light drizzle", icon: `09${d}`, id: 300 },
    53: { main: "Drizzle", description: "drizzle", icon: `09${d}`, id: 301 },
    55: { main: "Drizzle", description: "heavy drizzle", icon: `09${d}`, id: 302 },
    56: { main: "Drizzle", description: "freezing drizzle", icon: `09${d}`, id: 311 },
    57: { main: "Drizzle", description: "freezing drizzle", icon: `09${d}`, id: 312 },
    61: { main: "Rain", description: "light rain", icon: `10${d}`, id: 500 },
    63: { main: "Rain", description: "rain", icon: `10${d}`, id: 501 },
    65: { main: "Rain", description: "heavy rain", icon: `10${d}`, id: 502 },
    66: { main: "Rain", description: "freezing rain", icon: `13${d}`, id: 511 },
    67: { main: "Rain", description: "heavy freezing rain", icon: `13${d}`, id: 511 },
    71: { main: "Snow", description: "light snow", icon: `13${d}`, id: 600 },
    73: { main: "Snow", description: "snow", icon: `13${d}`, id: 601 },
    75: { main: "Snow", description: "heavy snow", icon: `13${d}`, id: 602 },
    77: { main: "Snow", description: "snow grains", icon: `13${d}`, id: 600 },
    80: { main: "Rain", description: "light showers", icon: `09${d}`, id: 520 },
    81: { main: "Rain", description: "showers", icon: `09${d}`, id: 521 },
    82: { main: "Rain", description: "violent showers", icon: `09${d}`, id: 522 },
    85: { main: "Snow", description: "light snow showers", icon: `13${d}`, id: 620 },
    86: { main: "Snow", description: "snow showers", icon: `13${d}`, id: 622 },
    95: { main: "Thunderstorm", description: "thunderstorm", icon: `11${d}`, id: 200 },
    96: { main: "Thunderstorm", description: "thunderstorm with hail", icon: `11${d}`, id: 201 },
    99: { main: "Thunderstorm", description: "severe thunderstorm", icon: `11${d}`, id: 202 },
  };
  return map[code] ?? { main: "Clouds", description: "cloudy", icon: `03${d}`, id: 802 };
}

/* ─────────── Core fetch ─────────── */

async function fetchForecast(lat: number, lon: number, timezone?: string): Promise<any> {
  const tz = timezone || "auto";
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: tz,
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,is_day,cloud_cover,visibility",
    hourly: "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max",
    wind_speed_unit: "ms",
    temperature_unit: "celsius",
    // URLSearchParams' entries have to be strings — casting the number
    // here keeps the rest of the record cleanly typed.
    forecast_days: "7",
  });
  const url = `${FORECAST}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return res.json();
}

/* ─────────── Shape into OWM-compatible responses ─────────── */

function buildCurrent(
  city: GeocodeResult,
  raw: any
): any {
  const c = raw.current;
  const isDay = Boolean(c.is_day);
  const cond = wmoToCondition(c.weather_code, isDay);
  const nowSec = Math.floor(new Date(c.time + "Z").getTime() / 1000);
  const daily = raw.daily;
  const sunrise = daily?.sunrise?.[0] ? Math.floor(new Date(daily.sunrise[0] + "Z").getTime() / 1000) : 0;
  const sunset = daily?.sunset?.[0] ? Math.floor(new Date(daily.sunset[0] + "Z").getTime() / 1000) : 0;

  return {
    coord: { lat: city.lat, lon: city.lon },
    weather: [cond],
    main: {
      temp: c.temperature_2m,
      feels_like: c.apparent_temperature,
      temp_min: daily?.temperature_2m_min?.[0] ?? c.temperature_2m,
      temp_max: daily?.temperature_2m_max?.[0] ?? c.temperature_2m,
      pressure: Math.round(c.pressure_msl ?? 1013),
      humidity: Math.round(c.relative_humidity_2m ?? 0),
    },
    visibility: Math.round(c.visibility ?? 10000),
    wind: {
      speed: c.wind_speed_10m ?? 0,
      deg: Math.round(c.wind_direction_10m ?? 0),
    },
    clouds: { all: Math.round(c.cloud_cover ?? 0) },
    dt: nowSec,
    sys: { country: city.countryCode || "", sunrise, sunset },
    name: city.name,
    source: "open-meteo.com",
    updatedAt: new Date().toISOString(),
    uvIndex: daily?.uv_index_max?.[0] ?? null,
  };
}

function buildForecast(city: GeocodeResult, raw: any): any {
  const hourly = raw.hourly;
  const hoursBack = hourly.time.findIndex((t: string) => {
    return new Date(t + "Z").getTime() >= Date.now();
  });
  const startIdx = hoursBack >= 0 ? hoursBack : 0;

  // Build 3-hour stepped list like OpenWeatherMap forecast
  const list = [];
  for (let i = startIdx; i < hourly.time.length && list.length < 40; i += 3) {
    const t = hourly.time[i];
    const dt = Math.floor(new Date(t + "Z").getTime() / 1000);
    const isDay = true; // Open-Meteo hourly doesn't carry is_day; approximate
    const cond = wmoToCondition(hourly.weather_code[i], isDay);
    list.push({
      dt,
      main: {
        temp: hourly.temperature_2m[i],
        feels_like: hourly.temperature_2m[i] - 1,
        temp_min: hourly.temperature_2m[i] - 1,
        temp_max: hourly.temperature_2m[i] + 1,
        humidity: Math.round(hourly.relative_humidity_2m?.[i] ?? 60),
        pressure: 1013,
      },
      weather: [cond],
      wind: { speed: hourly.wind_speed_10m?.[i] ?? 0, deg: 0 },
      clouds: { all: 0 },
      dt_txt: t.replace("T", " ") + ":00",
    });
  }

  const daily = raw.daily;
  const sunrise = daily?.sunrise?.[0] ? Math.floor(new Date(daily.sunrise[0] + "Z").getTime() / 1000) : 0;
  const sunset = daily?.sunset?.[0] ? Math.floor(new Date(daily.sunset[0] + "Z").getTime() / 1000) : 0;

  return {
    cod: "200",
    message: 0,
    cnt: list.length,
    list,
    city: {
      id: 0,
      name: city.name,
      country: city.countryCode || "",
      sunrise,
      sunset,
    },
    source: "open-meteo.com",
    updatedAt: new Date().toISOString(),
  };
}

/* ─────────── Public API ─────────── */

export async function openMeteoCurrent(city: string): Promise<any | null> {
  const geo = await geocodeCity(city);
  if (!geo) return null;

  const key = `om:cur:${geo.lat.toFixed(3)},${geo.lon.toFixed(3)}`;
  const cached = getCached(key);
  if (cached) return { ...cached, cached: true };

  try {
    const raw = await fetchForecast(geo.lat, geo.lon, geo.timezone);
    const out = buildCurrent(geo, raw);
    setCached(key, out);
    // also cache the forecast built from the same response
    setCached(`om:fc:${geo.lat.toFixed(3)},${geo.lon.toFixed(3)}`, buildForecast(geo, raw));
    return { ...out, cached: false };
  } catch (err) {
    console.error("[open-meteo] failed:", (err as Error).message);
    return null;
  }
}

export async function openMeteoForecast(city: string): Promise<any | null> {
  const geo = await geocodeCity(city);
  if (!geo) return null;

  const key = `om:fc:${geo.lat.toFixed(3)},${geo.lon.toFixed(3)}`;
  const cached = getCached(key);
  if (cached) return { ...cached, cached: true };

  try {
    const raw = await fetchForecast(geo.lat, geo.lon, geo.timezone);
    const out = buildForecast(geo, raw);
    setCached(key, out);
    setCached(`om:cur:${geo.lat.toFixed(3)},${geo.lon.toFixed(3)}`, buildCurrent(geo, raw));
    return { ...out, cached: false };
  } catch (err) {
    console.error("[open-meteo] failed:", (err as Error).message);
    return null;
  }
}

export async function openMeteoByCoords(lat: number, lon: number): Promise<any | null> {
  const geo = (await reverseGeocode(lat, lon)) ?? {
    name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    country: "",
    countryCode: "",
    lat,
    lon,
  };
  const key = `om:cur:${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = getCached(key);
  if (cached) return { ...cached, cached: true };
  try {
    const raw = await fetchForecast(lat, lon);
    const cur = buildCurrent(geo, raw);
    setCached(key, cur);
    setCached(`om:fc:${lat.toFixed(3)},${lon.toFixed(3)}`, buildForecast(geo, raw));
    return { ...cur, cached: false };
  } catch (err) {
    console.error("[open-meteo] coords failed:", (err as Error).message);
    return null;
  }
}

export async function openMeteoForecastByCoords(
  lat: number,
  lon: number
): Promise<any | null> {
  const key = `om:fc:${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = getCached(key);
  if (cached) return { ...cached, cached: true };

  const geo = (await reverseGeocode(lat, lon)) ?? {
    name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    country: "",
    countryCode: "",
    lat,
    lon,
  };
  try {
    const raw = await fetchForecast(lat, lon);
    const fc = buildForecast(geo, raw);
    setCached(key, fc);
    setCached(`om:cur:${lat.toFixed(3)},${lon.toFixed(3)}`, buildCurrent(geo, raw));
    return { ...fc, cached: false };
  } catch (err) {
    console.error("[open-meteo] coords fc failed:", (err as Error).message);
    return null;
  }
}
