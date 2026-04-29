import {
    createContext,
    createElement,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { fetchWeatherBundle, geocodeCity, reverseGeocode } from "../services/weatherApi";
import type { ForecastResponse, GeocodeResult, WeatherResponse } from "../types/weather";

const STORAGE_KEY = "skycast:lastPlace";
const REFRESH_MS = 5 * 60 * 1000;

export type WeatherPlace = { label: string; lat: number; lon: number };

type WeatherData = {
    current_weather: {
        is_day: 0 | 1;
    };
    current: WeatherResponse;
    forecast: ForecastResponse;
};

type WeatherStore = {
    place: WeatherPlace | null;
    weatherData: WeatherData | null;
    isLoading: boolean;
    error: string | null;
    notFoundQuery: string | null;
    isDay: boolean;
    setCity: (q: string) => void;
    setCoords: (lat: number, lon: number) => void;
    refresh: () => void;
    clearNotFound: () => void;
};

const WeatherContext = createContext<WeatherStore | null>(null);

function loadStoredPlace(): WeatherPlace | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        const p = JSON.parse(raw) as Partial<WeatherPlace>;
        if (!p?.label || !Number.isFinite(p.lat) || !Number.isFinite(p.lon))
            return null;
        return { label: String(p.label), lat: p.lat!, lon: p.lon! };
    }
    catch {
        return null;
    }
}

function savePlace(place: WeatherPlace | null) {
    if (!place) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(place));
}

export function WeatherProvider({ children }: { children: ReactNode }) {
    const [place, setPlaceState] = useState<WeatherPlace | null>(() => loadStoredPlace());
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notFoundQuery, setNotFoundQuery] = useState<string | null>(null);
    const placeRef = useRef<WeatherPlace | null>(place);
    placeRef.current = place;

    const fetchForPlace = useCallback(async (p: WeatherPlace) => {
        setIsLoading(true);
        setError(null);
        setNotFoundQuery(null);
        try {
            const bundle = await fetchWeatherBundle(p.lat, p.lon);
            setWeatherData(bundle);
        }
        catch (e) {
            setWeatherData(null);
            setError(e instanceof Error ? e.message : "Weather unavailable");
        }
        finally {
            setIsLoading(false);
        }
    }, []);

    const refresh = useCallback(() => {
        const p = placeRef.current;
        if (!p)
            return;
        void fetchForPlace(p);
    }, [fetchForPlace]);

    const clearNotFound = useCallback(() => {
        setNotFoundQuery(null);
    }, []);

    useEffect(() => {
        if (!place)
            return;
        savePlace(place);
        void fetchForPlace(place);
    }, [place, fetchForPlace]);

    useEffect(() => {
        if (!place)
            return;
        const id = window.setInterval(() => {
            void fetchForPlace(placeRef.current!);
        }, REFRESH_MS);
        return () => window.clearInterval(id);
    }, [place, fetchForPlace]);

    const setCity = useCallback((q: string) => {
        const trimmed = q.trim();
        if (!trimmed)
            return;
        setNotFoundQuery(null);
        setError(null);
        void (async () => {
            setIsLoading(true);
            try {
                const geo = await geocodeCity(trimmed);
                const p: WeatherPlace = { label: geo.name, lat: geo.lat, lon: geo.lon };
                setPlaceState(p);
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : "City not found";
                if (/not found/i.test(msg)) {
                    setNotFoundQuery(trimmed);
                    setWeatherData(null);
                    setError(null);
                }
                else {
                    setError(msg);
                }
            }
            finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const setCoords = useCallback((lat: number, lon: number) => {
        setNotFoundQuery(null);
        setError(null);
        void (async () => {
            setIsLoading(true);
            try {
                let geo: GeocodeResult | null = null;
                try {
                    geo = await reverseGeocode(lat, lon);
                }
                catch {
                    geo = null;
                }
                const label = geo?.name && geo.name.trim()
                    ? geo.name
                    : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
                const p: WeatherPlace = { label, lat, lon };
                setPlaceState(p);
            }
            finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const isDay = weatherData?.current_weather?.is_day === 1;

    const value = useMemo<WeatherStore>(() => ({
        place,
        weatherData,
        isLoading,
        error,
        notFoundQuery,
        isDay,
        setCity,
        setCoords,
        refresh,
        clearNotFound,
    }), [place, weatherData, isLoading, error, notFoundQuery, isDay, setCity, setCoords, refresh, clearNotFound]);

    return createElement(WeatherContext.Provider, { value }, children);
}

export function useWeather() {
    const ctx = useContext(WeatherContext);
    if (!ctx)
        throw new Error("useWeather must be used within WeatherProvider");
    return ctx;
}
