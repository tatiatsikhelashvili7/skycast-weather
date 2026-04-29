import { db } from "../db";
import { config } from "../config";
import { amindiGetCurrent, amindiGetForecast, isGeorgianCity } from "./amindi";
import { openMeteoCurrent, openMeteoForecast, openMeteoByCoords, openMeteoForecastByCoords, geocodeCity, reverseGeocode, } from "./openMeteo";
const BASE = "https://api.openweathermap.org";
type CacheRow = {
    payload: string;
    fetched_at: number;
};
function getCached(key: string): any | null {
    const row = db
        .prepare("SELECT payload, fetched_at FROM weather_cache WHERE cache_key = ?")
        .get(key) as CacheRow | undefined;
    if (!row)
        return null;
    if (Date.now() - row.fetched_at > config.cacheTtlMs)
        return null;
    try {
        return JSON.parse(row.payload);
    }
    catch {
        return null;
    }
}
function setCached(key: string, payload: unknown): void {
    db.prepare(`INSERT INTO weather_cache (cache_key, payload, fetched_at)
     VALUES (?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`).run(key, JSON.stringify(payload), Date.now());
}
async function owmFetch(pathAndQuery: string): Promise<any> {
    const sep = pathAndQuery.includes("?") ? "&" : "?";
    const url = `${BASE}${pathAndQuery}${sep}appid=${config.openWeatherKey}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenWeather error ${res.status}: ${text}`);
    }
    return res.json();
}
export async function getCurrentWeather(city: string): Promise<any> {
    if (isGeorgianCity(city)) {
        const amindi = await amindiGetCurrent(city);
        if (amindi)
            return amindi;
    }
    const om = await openMeteoCurrent(city);
    if (om)
        return om;
    if (config.openWeatherKey) {
        const key = `current:${city.toLowerCase()}`;
        const cached = getCached(key);
        if (cached)
            return { ...cached, cached: true };
        const data = await owmFetch(`/data/2.5/weather?q=${encodeURIComponent(city)}`);
        setCached(key, data);
        return { ...data, cached: false, source: "openweathermap.org" };
    }
    throw new Error(`No weather data available for "${city}"`);
}
export async function getForecast(city: string): Promise<any> {
    if (isGeorgianCity(city)) {
        const amindi = await amindiGetForecast(city);
        if (amindi)
            return amindi;
    }
    const om = await openMeteoForecast(city);
    if (om)
        return om;
    if (config.openWeatherKey) {
        const key = `forecast:${city.toLowerCase()}`;
        const cached = getCached(key);
        if (cached)
            return { ...cached, cached: true };
        const data = await owmFetch(`/data/2.5/forecast?q=${encodeURIComponent(city)}`);
        setCached(key, data);
        return { ...data, cached: false, source: "openweathermap.org" };
    }
    throw new Error(`No forecast data available for "${city}"`);
}
export async function getByCoords(lat: number, lon: number): Promise<any> {
    const om = await openMeteoByCoords(lat, lon);
    if (om)
        return om;
    if (config.openWeatherKey) {
        const key = `coords:${lat.toFixed(3)},${lon.toFixed(3)}`;
        const cached = getCached(key);
        if (cached)
            return { ...cached, cached: true };
        const data = await owmFetch(`/data/2.5/weather?lat=${lat}&lon=${lon}`);
        setCached(key, data);
        return { ...data, cached: false, source: "openweathermap.org" };
    }
    throw new Error("Coordinate lookup failed");
}
export async function geocodeQuery(query: string) {
    const geo = await geocodeCity(query);
    if (!geo)
        throw new Error(`We couldn't find "${query}". Try another spelling?`);
    return geo;
}
export async function reverseGeocodeCoords(lat: number, lon: number) {
    return reverseGeocode(lat, lon);
}
export async function getBundleByCoords(lat: number, lon: number): Promise<{
    current: any;
    forecast: any;
}> {
    const [current, forecast] = await Promise.all([
        openMeteoByCoords(lat, lon),
        openMeteoForecastByCoords(lat, lon),
    ]);
    if (current && forecast)
        return { current, forecast };
    if (config.openWeatherKey) {
        const [curRes, fcRes] = await Promise.all([
            owmFetch(`/data/2.5/weather?lat=${lat}&lon=${lon}`),
            owmFetch(`/data/2.5/forecast?lat=${lat}&lon=${lon}`),
        ]);
        return {
            current: { ...curRes, source: "openweathermap.org", cached: false },
            forecast: { ...fcRes, source: "openweathermap.org", cached: false },
        };
    }
    throw new Error(`Weather services are unreachable for (${lat.toFixed(3)}, ${lon.toFixed(3)})`);
}
