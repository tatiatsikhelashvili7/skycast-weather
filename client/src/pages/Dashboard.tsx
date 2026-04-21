import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { SearchBar } from "../components/SearchBar";
import { HeroCard } from "../components/HeroCard";
import { StatsGrid } from "../components/StatsGrid";
import { SunCycleCard } from "../components/SunCycleCard";
import { TimeSlider } from "../components/TimeSlider";
import { ForecastTabs } from "../components/ForecastTabs";
import { FriendsRoomSection } from "../components/FriendsRoomSection";
import { AlertToasts } from "../components/AlertToasts";
import { DynamicBackground } from "../components/DynamicBackground";
import { Header } from "../components/Header";
import { UnitToggle } from "../components/UnitToggle";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { CityNotFoundToast } from "../components/CityNotFoundToast";
import { LocationPrompt } from "../components/LocationPrompt";
import { WelcomeCard } from "../components/WelcomeCard";
import { AuthModal } from "../components/AuthModal";
import { FavoritesDrawer } from "../components/FavoritesDrawer";
import { SlideUpOnScroll } from "../components/ScrollLinked";
import { StaggerStack } from "../components/StaggerStack";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ServiceInterruption } from "../components/ServiceInterruption";

import { useWeather } from "../hooks/useWeather";
import { useSocket } from "../hooks/useSocket";
import { useWeatherAlerts } from "../hooks/useWeatherAlerts";
import { useAuth } from "../context/AuthContext";
import { useGeolocation } from "../hooks/useGeolocation";
import { themeFor } from "../lib/weather";
import {
  api,
  Favorite,
  LocatedPlace,
  geocodeCity,
  reverseGeocode,
} from "../lib/api";
import { parseQuery } from "../lib/parseQuery";
import { UnitsProvider } from "../context/UnitsContext";
import { TimeMachineProvider } from "../context/TimeMachineContext";
import { STORAGE_KEYS } from "../utils/constants";

/**
 * Section headline used above each major block on the dashboard.
 *
 * @param kicker       Small uppercase label above the title.
 * @param title        Main headline.
 * @param staticReveal When true, the component renders without the
 *                     scroll-triggered entrance animation. Use this for
 *                     interactive sections like the Time Machine where
 *                     a moving headline is disorienting.
 */
function SectionTitle({
  kicker,
  title,
  staticReveal = false,
}: {
  kicker: string;
  title: string;
  staticReveal?: boolean;
}) {
  if (staticReveal) {
    return (
      <div className="max-w-5xl mx-auto mb-5 px-1">
        <div className="text-[11px] uppercase tracking-[0.3em] text-white/50">
          {kicker}
        </div>
        <h3 className="text-display text-2xl md:text-3xl font-semibold mt-1">
          {title}
        </h3>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto mb-5 px-1"
    >
      <div className="text-[11px] uppercase tracking-[0.3em] text-white/50">
        {kicker}
      </div>
      <h3 className="text-display text-2xl md:text-3xl font-semibold mt-1">
        {title}
      </h3>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  /* ─────────── Core weather state (single hook as source of truth) ─────────── */
  const {
    place,
    current,
    forecast,
    loading,
    refetching,
    error,
    attempted,
    setPlace,
    refetch,
  } = useWeather();

  /* ─────────── Search pipeline state ─────────── */
  // We keep the "resolving" state (geocoding + flash of overlay) separate
  // from the hook's `loading` so we can show the overlay even before the
  // bundle fetch starts.
  const [resolving, setResolving] = useState(false);
  const [notFoundQuery, setNotFoundQuery] = useState<string | null>(null);

  /**
   * Monotonic request counter — every fresh geocode bumps it. When an
   * in-flight `await geocodeCity()` finally resolves we compare back
   * against the counter and ignore stale wins. This is what keeps rapid
   * "London → Paris → Berlin" typing from ending on whichever geocode
   * happened to land last instead of the one the user actually asked for.
   */
  const searchReqIdRef = useRef(0);

  /**
   * Universal entry point for any user-initiated search.
   *   • Coords string → parsed directly
   *   • City text     → forwarded to the geocoder first
   *
   * Fails gracefully by surfacing the "city not found" toast so the user
   * never sees a raw error message.
   */
  const handleSearch = useCallback(
    async (rawQuery: string) => {
      const query = (rawQuery || "").trim();
      if (!query) return;

      const parsed = parseQuery(query);
      const reqId = ++searchReqIdRef.current;
      setNotFoundQuery(null);

      // Direct coordinates — bypass geocoding entirely.
      if (parsed.kind === "coords") {
        setPlace({
          label: `${parsed.lat.toFixed(2)}, ${parsed.lon.toFixed(2)}`,
          lat: parsed.lat,
          lon: parsed.lon,
          source: "coords",
        });
        return;
      }

      setResolving(true);
      try {
        const geo = await geocodeCity(parsed.city);
        if (searchReqIdRef.current !== reqId) return; // stale — newer search has started
        setPlace({
          label: geo.name,
          country: geo.countryCode || geo.country,
          lat: geo.lat,
          lon: geo.lon,
          source: "search",
        });
      } catch (err) {
        if (searchReqIdRef.current !== reqId) return; // stale — ignore error too
        // 404s from the geocoder surface here — show the friendly toast.
        setNotFoundQuery(parsed.city);
        if (err instanceof Error) {
          console.debug("[search] geocode failed:", err.message);
        }
      } finally {
        if (searchReqIdRef.current === reqId) setResolving(false);
      }
    },
    [setPlace]
  );

  /* ─────────── Geolocation ─────────── */
  const geo = useGeolocation();
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const resolvedCoordsOnce = useRef(false);

  // Ask for permission on mount if we have nothing else to show
  useEffect(() => {
    if (geo.permission === "unknown") return;
    const hasStoredPlace = Boolean(place);
    const hasAsked = localStorage.getItem(STORAGE_KEYS.locationAsked) === "1";

    if (geo.permission === "granted") {
      geo.request();
      return;
    }
    if (geo.permission === "unsupported") return;
    if (geo.permission === "prompt" && !hasAsked && !hasStoredPlace) {
      setShowLocationPrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.permission]);

  // When geolocation resolves a position → reverse-geocode + install as place
  useEffect(() => {
    if (!geo.position || resolvedCoordsOnce.current) return;
    resolvedCoordsOnce.current = true;
    (async () => {
      const { lat, lon } = geo.position!;
      const reversed = await reverseGeocode(lat, lon);
      setPlace({
        label: reversed?.name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        country: reversed?.countryCode ?? reversed?.country,
        lat,
        lon,
        source: "geolocation",
      });
      setShowLocationPrompt(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.position]);

  /**
   * Triggered by the "My location" pill in the SearchBar. Uses the
   * browser API directly and pipes the result into the same pipeline
   * the search flow uses.
   */
  const handleGeoLocate = useCallback(() => {
    resolvedCoordsOnce.current = false;
    geo.request();
  }, [geo]);

  /**
   * Alternate entry path used by e.g. the friends-map "share my spot"
   * feature where we already have coordinates. Shares the same stale-win
   * guard as `handleSearch`.
   */
  const handleSearchByCoords = useCallback(
    async (lat: number, lon: number) => {
      const reqId = ++searchReqIdRef.current;
      setResolving(true);
      try {
        const reversed = await reverseGeocode(lat, lon);
        if (searchReqIdRef.current !== reqId) return;
        setPlace({
          label: reversed?.name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
          country: reversed?.countryCode ?? reversed?.country,
          lat,
          lon,
          source: "coords",
        });
      } finally {
        if (searchReqIdRef.current === reqId) setResolving(false);
      }
    },
    [setPlace]
  );

  /* ─────────── Theme & sockets ─────────── */
  const theme = useMemo(() => {
    if (!current) return themeFor("", "");
    const w = current.weather[0];
    return themeFor(w?.main ?? "", w?.icon ?? "");
  }, [current]);

  const { alerts, fact, connected, dismiss } = useSocket(
    current?.name,
    current?.weather[0]?.main
  );

  // Mock notification system: fire a browser Notification whenever the
  // weather bucket changes (clear → rain, rain → thunder, etc.).
  useWeatherAlerts(current);

  /* ─────────── UI overlays ─────────── */
  const [showAuth, setShowAuth] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  /* ─────────── Favorites ─────────── */
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    api
      .get<{ favorites: Favorite[] }>("/api/favorites")
      .then((d) => setFavorites(d.favorites))
      .catch(() => setFavorites([]));
  }, [user]);

  const isCurrentSaved = useMemo(() => {
    if (!current) return false;
    const c = current.name.toLowerCase();
    return favorites.some((f) => f.city.toLowerCase() === c);
  }, [favorites, current]);

  async function toggleFavorite() {
    if (!user) return setShowAuth(true);
    if (!current) return;
    const existing = favorites.find(
      (f) => f.city.toLowerCase() === current.name.toLowerCase()
    );
    if (existing) return removeFavorite(existing.id);
    try {
      const fav = await api.post<Favorite>("/api/favorites", {
        city: current.name,
        country: current.sys.country,
        lat: current.coord.lat,
        lon: current.coord.lon,
      });
      setFavorites((prev) => [fav, ...prev]);
    } catch {
      /* duplicate — ignore */
    }
  }

  async function removeFavorite(id: number) {
    await api.delete(`/api/favorites/${id}`).catch(() => {});
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }

  // Picking a saved favorite is effectively a free-text search — reuse the
  // full pipeline so geocoding/state-clearing run the same way every time.
  const pickFavorite = useCallback(
    (fav: Favorite) => {
      if (typeof fav.lat === "number" && typeof fav.lon === "number") {
        setPlace({
          label: fav.city,
          country: fav.country || undefined,
          lat: fav.lat,
          lon: fav.lon,
          source: "favorite",
        });
      } else {
        void handleSearch(fav.city);
      }
    },
    [setPlace, handleSearch]
  );

  function handleAllowLocation() {
    localStorage.setItem(STORAGE_KEYS.locationAsked, "1");
    geo.request();
  }

  function handleSkipLocation() {
    localStorage.setItem(STORAGE_KEYS.locationAsked, "1");
    setShowLocationPrompt(false);
  }

  /* ─────────── Derived render flags ─────────── */
  const hasPlace = Boolean(place);
  const showSkeleton = hasPlace && loading && !current;
  const showServiceDown =
    hasPlace && attempted && !!error && !current && !resolving;
  const showWelcome = !hasPlace && !showLocationPrompt && !resolving;
  const locating = geo.status === "requesting";
  const overlayLabel = place
    ? `Updating ${place.label}…`
    : "Finding that place…";

  return (
    <UnitsProvider>
      <TimeMachineProvider>
      <div
        className={`min-h-[100dvh] text-white ${
          refetching ? "refreshing-cards" : ""
        }`}
      >
        <DynamicBackground current={current} />
        <Header
          connected={connected}
          fact={fact}
          onOpenAuth={() => setShowAuth(true)}
          onOpenFavorites={() => setShowFavorites(true)}
          current={current}
        />

        <ErrorBoundary>
          <main className="relative pb-16">
            {/* ───── Top controls ───── */}
            <section className="pt-8 md:pt-10 px-4">
              <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <div className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                    {hasPlace ? theme.label : "SkyCast"}
                  </div>
                </motion.div>

                {/*
                  Top controls: search + °C/°F toggle.
                  On wide screens they sit side by side; on phones we let
                  the UnitToggle wrap below so the search input never
                  gets squeezed below a usable width.
                */}
                <div className="w-full flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <SearchBar
                      onSearch={handleSearch}
                      onCoords={handleSearchByCoords}
                      onGeoLocate={handleGeoLocate}
                      initial={place?.label || ""}
                      locating={locating}
                      busy={resolving}
                    />
                  </div>
                  <div className="self-end sm:self-auto">
                    <UnitToggle />
                  </div>
                </div>

                {geo.permission === "denied" && (
                  <div className="text-xs text-amber-200/90 flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 rounded-full px-3 py-1.5">
                    Location blocked. Enable it in your browser to auto-detect
                    your city.
                  </div>
                )}
              </div>
            </section>

            {/* ───── Content area (welcome / skeleton / service-down / real) ───── */}
            <section className="px-4 mt-8">
              <AnimatePresence mode="wait">
                {showWelcome && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                  >
                    <WelcomeCard
                      onPick={handleSearch}
                      onAskLocation={
                        geo.permission === "prompt"
                          ? handleGeoLocate
                          : undefined
                      }
                    />
                  </motion.div>
                )}

                {showSkeleton && (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <LoadingSkeleton />
                  </motion.div>
                )}

                {showServiceDown && (
                  <motion.div
                    key="servicedown"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                  >
                    <ServiceInterruption
                      title="Couldn't reach the weather service"
                      message={
                        error ||
                        "We're having trouble talking to the forecast API. Check your connection, or try again in a moment."
                      }
                      onRetry={refetch}
                      kind="network"
                    />
                  </motion.div>
                )}

                {current && (
                  <motion.div
                    key={`weather-${current.name}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                  >
                    <HeroCard
                      weather={current}
                      onSaveFavorite={toggleFavorite}
                      canSave
                      isSaved={isCurrentSaved}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/*
              iOS-style staggered reveal for the *passive* info blocks
              (stats + sun cycle). The interactive Time Machine section
              is intentionally rendered OUTSIDE this wrapper — see below.
            */}
            {current && (
              <StaggerStack
                replayKey={current.name}
                delayBetween={0.05}
                initialDelay={0.15}
              >
                <section className="px-4 mt-12">
                  <SectionTitle kicker="Conditions" title="Right now" />
                  <StatsGrid weather={current} />
                </section>

                {current.sys.sunrise > 0 && (
                  <section className="px-4 mt-12">
                    <SectionTitle kicker="Sun" title="Sunrise & sunset" />
                    <SunCycleCard weather={current} />
                  </section>
                )}
              </StaggerStack>
            )}

            {/*
              "How today unfolds" — Time Machine slider.
              Deliberately rendered bare, with NO entrance animation and
              NO scroll-linked transforms, so its hit target is rock solid
              and the control feels pinned to the page the instant it
              becomes visible. This was a major mobile pain point.
            */}
            {current && forecast && (
              <section className="px-4 mt-12">
                <SectionTitle
                  kicker="Sky"
                  title="How today unfolds"
                  staticReveal
                />
                <TimeSlider forecast={forecast} current={current} />
              </section>
            )}

            {current && (
              <>
                {forecast && (
                  <SlideUpOnScroll>
                    <section className="px-4 mt-12">
                      <SectionTitle kicker="Forecast" title="The days ahead" />
                      <ForecastTabs
                        forecast={forecast}
                        currentTemp={current?.main.temp}
                      />
                    </section>
                  </SlideUpOnScroll>
                )}

                <SlideUpOnScroll stiffness={0.8}>
                  <section className="px-4 mt-12">
                    <SectionTitle
                      kicker="Together"
                      title="Watch the weather with friends"
                    />
                    <FriendsRoomSection current={current} />
                  </section>
                </SlideUpOnScroll>
              </>
            )}

            <footer className="px-4 mt-16 text-center text-xs text-white/40">
              <div className="inline-flex items-center gap-2 flex-wrap justify-center">
                <span className="live-dot" />
                SkyCast · auto-refreshing every 60s · data powered by{" "}
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
          open={showFavorites}
          onClose={() => setShowFavorites(false)}
          favorites={favorites}
          onSelect={(city: string) => {
            const fav = favorites.find((f) => f.city === city);
            if (fav) pickFavorite(fav);
            else void handleSearch(city);
          }}
          onRemove={removeFavorite}
        />

        <AnimatePresence>
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        </AnimatePresence>

        <AnimatePresence>
          {showLocationPrompt && (
            <LocationPrompt
              status={geo.status}
              error={geo.error}
              denied={geo.permission === "denied"}
              onAllow={handleAllowLocation}
              onSkip={handleSkipLocation}
            />
          )}
        </AnimatePresence>

        {/* Full-screen blur overlay whenever the search pipeline is in flight. */}
        <LoadingOverlay show={resolving} label={overlayLabel} />

        {/* Friendly "city not found" toast — auto-dismisses on next search. */}
        <CityNotFoundToast
          query={notFoundQuery}
          onDismiss={() => setNotFoundQuery(null)}
          onPick={(s) => {
            setNotFoundQuery(null);
            void handleSearch(s);
          }}
          suggestions={suggestionsFor(notFoundQuery)}
        />
      </div>
      </TimeMachineProvider>
    </UnitsProvider>
  );
}

/**
 * Light-weight suggestion engine — if a user types "Londno" we nudge them
 * toward well-known cities that start with the same letter. This lives
 * client-side because it's a UX nicety rather than actual search.
 */
function suggestionsFor(q: string | null): string[] {
  if (!q) return [];
  const first = q.trim()[0]?.toLowerCase();
  const pool: Record<string, string[]> = {
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
  return pool[first ?? ""] ?? ["London", "Tokyo", "Paris"];
}
