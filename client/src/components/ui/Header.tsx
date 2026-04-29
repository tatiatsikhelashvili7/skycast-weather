import { motion, AnimatePresence, } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, LogOut, User2, WifiOff, Radio, Menu, Heart, } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { LiveAlert } from "../../hooks/useSocket";
import type { WeatherResponse } from "../../types/weather";
import { WeatherIcon } from "../weather/WeatherIcon";
import { useUnits } from "../../context/UnitsContext";
import { useDeviceTier } from "../../hooks/useDeviceTier";
import { Magnetic } from "./Magnetic";
interface Props {
    connected: boolean;
    fact?: LiveAlert | null;
    onOpenAuth: () => void;
    onOpenFavorites: () => void;
    current?: WeatherResponse | null;
}
export function Header({ connected, fact, onOpenAuth, onOpenFavorites, current, }: Props) {
    const tier = useDeviceTier();
    if (tier.isMobile || tier.isLowEnd || tier.saveData || tier.reduceMotion) {
        return (<header className="sticky top-0 z-40 w-full px-4 md:px-6 py-3 backdrop-blur-md bg-black/20 border-b" style={{ borderColor: "rgba(255,255,255,var(--glass-border-alpha))" }}>
        {!connected && (<div aria-hidden className="absolute left-0 right-0 top-0 h-[2px] overflow-hidden">
            <div className="h-full w-full bg-white/5"/>
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-sky-300/70 to-transparent animate-[loading-bar_1.2s_linear_infinite]"/>
          </div>)}
        <HeaderContent connected={connected} fact={fact} onOpenAuth={onOpenAuth} onOpenFavorites={onOpenFavorites} current={current}/>
      </header>);
    }
    return (<motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="sticky top-0 z-40 w-full px-4 md:px-6 py-3 backdrop-blur-md bg-black/20 border-b" style={{ borderColor: "rgba(255,255,255,var(--glass-border-alpha))" }}>
      {!connected && (<div aria-hidden className="absolute left-0 right-0 top-0 h-[2px] overflow-hidden">
          <div className="h-full w-full bg-white/5"/>
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-sky-300/70 to-transparent animate-[loading-bar_1.2s_linear_infinite]"/>
        </div>)}
      <HeaderContent connected={connected} fact={fact} onOpenAuth={onOpenAuth} onOpenFavorites={onOpenFavorites} current={current}/>
    </motion.header>);
}
function HeaderContent({ connected, fact, onOpenAuth, onOpenFavorites, current, }: Props) {
    const { user, logout } = useAuth();
    const { formatTemp } = useUnits();
    return (<div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onOpenFavorites} className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Saved locations" aria-label="Open favorites">
            <Menu className="w-5 h-5"/>
          </button>

          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-base sm:text-lg shadow-lg shadow-indigo-500/30 shrink-0">
              ☀️
            </div>
            <div className="min-w-0">
              <div className="text-display text-lg sm:text-xl font-semibold leading-none">
                SkyCast
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/50 truncate">
                Immersive Weather
              </div>
            </div>
          </Link>

          {current && current.weather[0] && (<div className="hidden md:flex items-center gap-2 pl-4 ml-2 border-l border-white/10">
              <WeatherIcon main={current.weather[0].main} icon={current.weather[0].icon} size={22}/>
              <span className="text-display text-lg font-semibold leading-none">
                {formatTemp(current.main.temp)}
              </span>
              <span className="text-sm text-white/60 truncate max-w-[140px]">
                {current.name}
              </span>
            </div>)}
        </div>

        <div className="hidden lg:flex flex-1 justify-center overflow-hidden px-6">
          <AnimatePresence mode="wait">
            {fact && (<motion.div key={fact.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2 text-xs text-white/70 max-w-md truncate">
                <Radio className="w-3.5 h-3.5 text-emerald-300 shrink-0"/>
                <span className="font-semibold text-white/90 shrink-0">
                  {fact.title}
                </span>
                <span className="truncate text-white/60">{fact.message}</span>
              </motion.div>)}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Magnetic strength={0.16} radius={120}>
            <div className={`flex items-center gap-1.5 sm:gap-2 text-xs px-2 sm:px-3 py-1.5 rounded-full border transition-colors ${connected
            ? "border-[#991b1b]/40 text-slate-200 bg-[#991b1b]/10"
            : "border-white/10 text-white/50 bg-white/5"}`} title={connected ? "Receiving live updates" : "Disconnected"}>
              {connected ? (<>
                  <span className="live-dot" aria-hidden/>
                  <span className="hidden sm:inline font-semibold uppercase tracking-wider">
                    Live
                  </span>
                </>) : (<>
                  <WifiOff className="w-3 h-3"/>
                  <span className="hidden sm:inline">Offline</span>
                </>)}
            </div>
          </Magnetic>

          {user && (<button onClick={onOpenFavorites} className="hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl text-pink-200 hover:text-pink-100 hover:bg-white/10 transition-colors" title="Saved">
              <Heart className="w-4 h-4"/>
              <span>Saved</span>
            </button>)}

          {user ? (<>
              <span className="hidden lg:inline-flex items-center gap-2 text-sm text-white/80">
                <User2 className="w-4 h-4"/>
                {user.email}
              </span>
              <button onClick={logout} className="btn-ghost">
                <LogOut className="w-4 h-4"/>
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>) : (<button onClick={onOpenAuth} className="btn-primary !py-2 !px-4">
              <LogIn className="w-4 h-4"/>
              <span className="hidden sm:inline">Sign in</span>
            </button>)}
        </div>
      </div>);
}
