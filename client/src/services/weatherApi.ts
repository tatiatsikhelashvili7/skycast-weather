import { requestJson, authToken } from "./http";
import type { Favorite, ForecastResponse, GeocodeResult, LocatedPlace, WeatherBundle, WeatherCondition, WeatherResponse, } from "../types/weather";
export const api = {
    get: <T>(path: string) => requestJson<T>(path),
    post: <T>(path: string, body: unknown) => requestJson<T>(path, { method: "POST", body: JSON.stringify(body) }),
    delete: <T>(path: string) => requestJson<T>(path, { method: "DELETE" }),
};
export const tokenStorage = authToken;
export function primaryCondition(w: WeatherResponse): WeatherCondition {
    return (w.weather[0] || {
        id: 0,
        main: "Unknown",
        description: "weather",
        icon: "01d",
    });
}
export async function geocodeCity(query: string): Promise<GeocodeResult> {
    return api.get<GeocodeResult>(`/api/weather/geocode?q=${encodeURIComponent(query.trim())}`);
}
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult | null> {
    try {
        return await api.get<GeocodeResult>(`/api/weather/reverse?lat=${lat}&lon=${lon}`);
    }
    catch {
        return null;
    }
}
export async function fetchWeatherBundle(lat: number, lon: number): Promise<WeatherBundle> {
    return api.get<WeatherBundle>(`/api/weather/bundle?lat=${lat}&lon=${lon}`);
}
export type { Favorite, ForecastResponse, GeocodeResult, LocatedPlace, WeatherBundle, WeatherCondition, WeatherResponse, };
