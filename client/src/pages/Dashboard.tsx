import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchBar } from "../components/ui/SearchBar";
import { CurrentWeather } from "../components/weather/CurrentWeather";
import { ForecastSection } from "../components/weather/ForecastSection";
import { SocialRoom } from "../components/weather/SocialRoom";
import { AlertToasts } from "../components/ui/AlertToasts";
import { Header } from "../components/ui/Header";
import { UnitToggle } from "../components/ui/UnitToggle";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { LoadingOverlay } from "../components/ui/LoadingOverlay";
import { CityNotFoundToast } from "../components/ui/CityNotFoundToast";
import { LocationPrompt } from "../components/ui/LocationPrompt";
import { WelcomeCard } from "../components/ui/WelcomeCard";
import { AuthModal } from "../components/ui/AuthModal";
import { FavoritesDrawer } from "../components/ui/FavoritesDrawer";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { ServiceInterruption } from "../components/ui/ServiceInterruption";
import { useWeather } from "../hooks/useWeather";
import { UnitsProvider } from "../context/UnitsContext";
import { TimeMachineProvider, useTimeMachine } from "../context/TimeMachineContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { useGeolocation } from "../hooks/useGeolocation";
import { useWeatherAlerts } from "../hooks/useWeatherAlerts";
import { api } from "../services/weatherApi";
import { WeatherAtmosphere } from "../components/weather/WeatherAtmosphere";
import type { Favorite } from "../types/weather";

const LOC_SKIP_KEY = "skycast:skip_location_prompt";

const LOC_SUGGESTIONS: Record<string, string[]> = {
    l: ["London", "Los Angeles", "Lisbon"],
    t: ["Tokyo", "Toronto", "Tbilisi"],
    p: ["Paris", "Prague", "Porto"],
    n: ["New York", "Nairobi", "Nice"],
    b: ["Berlin", "Barcelona", "Boston"],
    s: ["Stockholm", "Sydney", "Seoul"],
    m: ["Madrid", "Moscow", "Miami"],
    r: ["Rome", "Riyadh", "Rio de Janeiro"],
    a: ["Athens", "Amsterdam", "Austin"],
};

function suggestionsFor(q: string | null): string[] {
    if (!q) return [];
    const first = q.trim()[0]?.toLowerCase() ?? "";
    return LOC_SUGGESTIONS[first] ?? ["London", "Tokyo", "Paris"];
}

function DashboardContent() {
    const { frame } = useTimeMachine();
    const { user, loading: authLoading } = useAuth();
    const {
        place,
        weatherData,
        isLoading,
        error,
        notFoundQuery,
        clearNotFound,
        setCity,
        setCoords,
    } = useWeather();

    const current = weatherData?.current ?? null;
    const forecast = weatherData?.forecast ?? null;
    const isDayFromApi = weatherData?.current_weather?.is_day === 1;
    const isDay = frame?.isDay ?? isDayFromApi;
    const conditionMain = current?.weather[0]?.main;
    const { alerts, fact, connected, dismiss } = useSocket(current?.name, conditionMain);
    useWeatherAlerts(current);

    const geo = useGeolocation();

    const [authOpen, setAuthOpen] = useState(false);
    const [favoritesOpen, setFavoritesOpen] = useState(false);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [locPrompt, setLocPrompt] = useState(false);

    const loadFavorites = useCallback(async () => {
        if (!user) return;
        try {
            const data = await api.get<{ favorites: Favorite[] }>("/api/favorites");
            setFavorites(data.favorites);
        } catch {
            setFavorites([]);
        }
    }, [user]);

    useEffect(() => {
        void loadFavorites();
    }, [loadFavorites]);

    const savedFavoriteId = useMemo(() => {
        if (!current || !favorites.length) return null;
        const match = favorites.find(
            (f) => f.city.toLowerCase() === current.name.toLowerCase()
        );
        return match?.id ?? null;
    }, [current, favorites]);

    const onToggleFavorite = useCallback(async () => {
        if (!user) {
            setAuthOpen(true);
            return;
        }
        if (!current) return;
        try {
            if (savedFavoriteId) {
                await api.delete(`/api/favorites/${savedFavoriteId}`);
                setFavorites((prev) => prev.filter((f) => f.id !== savedFavoriteId));
                return;
            }
            const created = await api.post<{ id: number }>("/api/favorites", {
                city: current.name,
                country: current.sys.country || undefined,
                lat: current.coord.lat,
                lon: current.coord.lon,
            });
            setFavorites((prev) => [
                {
                    id: created.id,
                    city: current.name,
                    country: current.sys.country || null,
                    lat: current.coord.lat,
                    lon: current.coord.lon,
                    created_at: new Date().toISOString(),
                },
                ...prev,
            ]);
        } catch {}
    }, [user, current, savedFavoriteId]);

    const onRemoveFavorite = useCallback(
        async (id: number) => {
            if (!user) return;
            try {
                await api.delete(`/api/favorites/${id}`);
                setFavorites((prev) => prev.filter((f) => f.id !== id));
            } catch {}
        },
        [user]
    );

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (authLoading) return;
        if (place) {
            setLocPrompt(false);
            return;
        }

        if (localStorage.getItem(LOC_SKIP_KEY) === "1") {
            setLocPrompt(false);
            return;
        }

        setLocPrompt(geo.status === "requesting" || geo.status === "error");
    }, [authLoading, place, geo.permission, geo.status]);

    useEffect(() => {
        if (geo.status === "success" && geo.position) {
            setCoords(geo.position.lat, geo.position.lon);
            setLocPrompt(false);
        }
    }, [geo.status, geo.position, setCoords]);

    useEffect(() => {
        if (typeof document === "undefined") return;
        const body = document.body;
        body.classList.remove("theme-day", "theme-night");
        body.classList.add(isDay ? "theme-day" : "theme-night");
        return () => {
            body.classList.remove("theme-day", "theme-night");
        };
    }, [isDay]);

    return (
        <div className="relative min-h-[100svh] w-full overflow-hidden">
                    <WeatherAtmosphere current={current} isDay={isDay} />

                    <div className="relative z-[10]">
                        <Header
                            connected={connected}
                            fact={fact}
                            onOpenAuth={() => setAuthOpen(true)}
                            onOpenFavorites={() => {
                                if (!user) {
                                    setAuthOpen(true);
                                    return;
                                }
                                setFavoritesOpen(true);
                            }}
                            current={current}
                        />

                        <ErrorBoundary>
                            <main className="relative pb-16">
                                <section className="pt-8 md:pt-10 px-4">
                                    <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
                                        <motion.div
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6 }}
                                            className="text-center"
                                        >
                                            <div className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                                                {current ? "Weather" : "SkyCast · Immersive Weather"}
                                            </div>
                                        </motion.div>

                                        <div className="w-full flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                                            <div className="flex-1 min-w-0 w-full sm:w-auto">
                                                <SearchBar
                                                    onSearch={(c) => setCity(c)}
                                                    onCoords={(lat, lon) => setCoords(lat, lon)}
                                                    onGeoLocate={() => {
                                                        setLocPrompt(false);
                                                        geo.request();
                                                    }}
                                                    initial={place?.label || current?.name || ""}
                                                    locating={geo.status === "requesting"}
                                                    busy={isLoading}
                                                />
                                            </div>
                                            <div className="self-end sm:self-auto">
                                                <UnitToggle />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="px-4 mt-8">
                                    <AnimatePresence mode="wait">
                                        {!current && !isLoading && (
                                            <motion.div
                                                key="welcome"
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.35 }}
                                            >
                                                <WelcomeCard
                                                    onPick={(c) => setCity(c)}
                                                    onAskLocation={() => {
                                                        localStorage.removeItem(LOC_SKIP_KEY);
                                                        geo.request();
                                                    }}
                                                />
                                            </motion.div>
                                        )}

                                        {isLoading && (
                                            <motion.div
                                                key="skeleton"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <LoadingSkeleton />
                                            </motion.div>
                                        )}

                                        {error && !isLoading && !notFoundQuery && (
                                            <motion.div
                                                key="servicedown"
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.35 }}
                                            >
                                                <ServiceInterruption
                                                    title="Couldn't reach the weather service"
                                                    message={error}
                                                    onRetry={() =>
                                                        place ? setCity(place.label) : setCity("London")
                                                    }
                                                    kind="network"
                                                />
                                            </motion.div>
                                        )}

                                        <CurrentWeather
                                            current={current}
                                            isSaved={Boolean(user && savedFavoriteId)}
                                            onToggleFavorite={onToggleFavorite}
                                        />
                                    </AnimatePresence>
                                </section>

                                <ForecastSection current={current} forecast={forecast} />
                                <SocialRoom current={current} />

                                <footer className="px-4 mt-16 text-center text-xs text-white/40">
                                    <div className="inline-flex items-center gap-2 flex-wrap justify-center">
                                        <span className="live-dot" />
                                        SkyCast · auto-refreshing every 5 min · data powered by{" "}
                                        <a
                                            href="https://www.amindi.ge"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white/70 underline decoration-dotted underline-offset-2 hover:text-white"
                                        >
                                            amindi.ge
                                        </a>{" "}
                                        (Georgia) &{" "}
                                        <a
                                            href="https://open-meteo.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white/70 underline decoration-dotted underline-offset-2 hover:text-white"
                                        >
                                            open-meteo.com
                                        </a>{" "}
                                        (worldwide)
                                    </div>
                                </footer>
                            </main>
                        </ErrorBoundary>

                        <AlertToasts alerts={alerts} onDismiss={dismiss} />
                        <FavoritesDrawer
                            open={favoritesOpen}
                            onClose={() => setFavoritesOpen(false)}
                            favorites={favorites}
                            onSelect={(c) => setCity(c)}
                            onRemove={(id) => void onRemoveFavorite(id)}
                        />
                        <AnimatePresence>
                            {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
                        </AnimatePresence>
                        <AnimatePresence>
                            {locPrompt && (
                                <LocationPrompt
                                    status={geo.status}
                                    error={geo.error}
                                    denied={geo.permission === "denied"}
                                    onAllow={() => {
                                        localStorage.removeItem(LOC_SKIP_KEY);
                                        geo.request();
                                    }}
                                    onSkip={() => {
                                        localStorage.setItem(LOC_SKIP_KEY, "1");
                                        setLocPrompt(false);
                                    }}
                                />
                            )}
                        </AnimatePresence>
                        <LoadingOverlay show={isLoading} label={isLoading ? "Updating…" : ""} />
                        <CityNotFoundToast
                            query={notFoundQuery}
                            onDismiss={clearNotFound}
                            onPick={(s) => {
                                clearNotFound();
                                setCity(s);
                            }}
                            suggestions={suggestionsFor(notFoundQuery)}
                        />
                    </div>
                </div>
    );
}

export default function Dashboard() {
    return (
        <UnitsProvider>
            <TimeMachineProvider>
                <DashboardContent />
            </TimeMachineProvider>
        </UnitsProvider>
    );
}
