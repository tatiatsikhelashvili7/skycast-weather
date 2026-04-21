import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { Link } from "react-router-dom";
import {
  LogIn,
  LogOut,
  User2,
  WifiOff,
  Radio,
  Menu,
  Heart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { LiveAlert } from "../hooks/useSocket";
import { WeatherResponse } from "../lib/api";
import { WeatherIcon } from "./WeatherIcon";
import { useUnits } from "../context/UnitsContext";

interface Props {
  connected: boolean;
  fact?: LiveAlert | null;
  onOpenAuth: () => void;
  onOpenFavorites: () => void;
  current?: WeatherResponse | null;
}

export function Header({
  connected,
  fact,
  onOpenAuth,
  onOpenFavorites,
  current,
}: Props) {
  const { user, logout } = useAuth();
  const { formatTemp } = useUnits();

  // Scroll-driven mini-hero: fades in as the user scrolls past ~300px.
  const { scrollY } = useScroll();
  const miniOpacity = useTransform(scrollY, [220, 360], [0, 1]);
  const miniScale = useTransform(scrollY, [220, 360], [0.85, 1]);
  const miniX = useTransform(scrollY, [220, 360], [-8, 0]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-40 w-full px-4 md:px-6 py-3 backdrop-blur-xl bg-black/25 border-b border-white/10"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenFavorites}
            className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Saved locations"
            aria-label="Open favorites"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/30">
              ☀️
            </div>
            <div className="hidden sm:block">
              <div className="text-display text-xl font-semibold leading-none">
                SkyCast
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/50">
                Immersive Weather
              </div>
            </div>
          </Link>

          {/* Sticky mini-hero (materializes as you scroll past the big one) */}
          {current && current.weather[0] && (
            <motion.div
              style={{
                opacity: miniOpacity,
                scale: miniScale,
                x: miniX,
                transformOrigin: "left center",
              }}
              className="hidden md:flex items-center gap-2 pl-4 ml-2 border-l border-white/10"
            >
              <WeatherIcon
                main={current.weather[0].main}
                icon={current.weather[0].icon}
                size={22}
              />
              <span className="text-display text-lg font-semibold leading-none">
                {formatTemp(current.main.temp)}
              </span>
              <span className="text-sm text-white/60 truncate max-w-[140px]">
                {current.name}
              </span>
            </motion.div>
          )}
        </div>

        {/* Live fact ticker */}
        <div className="hidden lg:flex flex-1 justify-center overflow-hidden px-6">
          <AnimatePresence mode="wait">
            {fact && (
              <motion.div
                key={fact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 text-xs text-white/70 max-w-md truncate"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="font-semibold text-white/90 shrink-0">
                  {fact.title}
                </span>
                <span className="truncate text-white/60">{fact.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/*
            Live/Offline chip. On phones we collapse to a single pulse dot
            (no label) to reclaim horizontal space for the Sign-in button.
            Full label re-appears at `sm:` and up.
          */}
          <div
            className={`flex items-center gap-1.5 sm:gap-2 text-xs px-2 sm:px-3 py-1.5 rounded-full border transition-colors ${
              connected
                ? "border-emerald-300/30 text-emerald-100 bg-emerald-500/10"
                : "border-white/10 text-white/50 bg-white/5"
            }`}
            title={connected ? "Receiving live updates" : "Disconnected"}
          >
            {connected ? (
              <>
                <span className="live-dot" aria-hidden />
                <span className="hidden sm:inline font-semibold uppercase tracking-wider">
                  Live
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </div>

          {user && (
            <button
              onClick={onOpenFavorites}
              className="hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl text-pink-200 hover:text-pink-100 hover:bg-white/10 transition-colors"
              title="Saved"
            >
              <Heart className="w-4 h-4" />
              <span>Saved</span>
            </button>
          )}

          {user ? (
            <>
              <span className="hidden lg:inline-flex items-center gap-2 text-sm text-white/80">
                <User2 className="w-4 h-4" />
                {user.email}
              </span>
              <button onClick={logout} className="btn-ghost">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary !py-2 !px-4">
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign in</span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
