import { memo } from "react";
import { motion } from "framer-motion";
import { Heart, Star, BadgeCheck } from "lucide-react";
import { primaryCondition } from "../../services/weatherApi";
import type { WeatherResponse } from "../../types/weather";
import { WeatherIcon } from "./WeatherIcon";
import { LiveSourceChip } from "../ui/LiveSourceChip";
import { useUnits } from "../../context/UnitsContext";
import { themeFor } from "../../lib/weather";
interface Props {
    weather: WeatherResponse;
    onSaveFavorite?: () => void;
    canSave: boolean;
    isSaved?: boolean;
}
function HeroCardInner({ weather, onSaveFavorite, canSave, isSaved, }: Props) {
    const { formatTemp } = useUnits();
    const w = primaryCondition(weather);
    const theme = themeFor(w.main, w.icon);
    return (        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} className="w-full max-w-3xl mx-auto">
      <div className="glass-strong rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-8 md:p-12 relative overflow-hidden">
        <motion.div aria-hidden animate={{ backgroundColor: theme.blobA }} transition={{ duration: 0.8, ease: "easeOut" }} className="pointer-events-none absolute -left-16 top-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full opacity-40" style={{ filter: "blur(90px)" }}/>

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
              <motion.h2 initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-display text-lg sm:text-xl md:text-2xl font-semibold tracking-wide text-white/95 min-w-0 break-words drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                {weather.name}
                {weather.sys.country && (<span className="text-white/40 font-medium">
                    , {weather.sys.country}
                  </span>)}
              </motion.h2>

              <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.35, type: "spring", stiffness: 260 }} className="relative inline-flex items-center" title="Verified live source">
                <BadgeCheck className="w-4 h-4 text-sky-300 drop-shadow-[0_0_6px_rgba(125,211,252,0.8)]"/>
                <span className="absolute inset-0 rounded-full animate-[live-pulse_2.4s_infinite]"/>
              </motion.span>

              {canSave && onSaveFavorite && (<motion.button whileHover={{ scale: 1.15, rotate: -6 }} whileTap={{ scale: 0.9 }} onClick={onSaveFavorite} className="ml-1 p-1 rounded-full hover:bg-white/10 transition-colors" title={isSaved ? "Saved" : "Save to favorites"} aria-label="Toggle favorite">
                  <Star className={`w-4 h-4 transition-colors ${isSaved
                ? "fill-amber-300 text-amber-300"
                : "text-white/40 hover:text-amber-200"}`}/>
                </motion.button>)}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <LiveSourceChip source={weather.source} updatedAt={weather.updatedAt}/>
              {canSave && onSaveFavorite && (<motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={onSaveFavorite} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 transition-colors" title="Save to favorites">
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-pink-300 text-pink-300" : "text-pink-300"}`}/>
                  {isSaved ? "Saved" : "Save"}
                </motion.button>)}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-4 md:gap-10 mt-6 sm:mt-8">
            <motion.div initial={{ scale: 0.8, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.1 }} className="text-white/90 shrink-0 drop-shadow-[0_0_30px_rgba(148,163,184,0.25)] self-center md:self-auto">
              <div className="flex items-center justify-center">
                <WeatherIcon main={w.main} icon={w.icon} size={140} animate={false}/>
              </div>
            </motion.div>

            <div className="flex-1 min-w-0 w-full">
              <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="temp-display font-thin text-[clamp(3.75rem,12vw,4.75rem)] leading-none sm:text-8xl md:text-9xl">
                {formatTemp(weather.main.temp)}
              </motion.h1>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-3">
                <p className="text-base md:text-lg text-slate-300 font-light tracking-wide capitalize flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{w.descriptionKa || w.description}</span>
                <span className="text-white/20">•</span>
                <span className="text-slate-300/80">
                    Feels like{" "}
                  <b className="text-blue-400 font-semibold drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
                      {formatTemp(weather.main.feels_like)}
                    </b>
                  </span>
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/50 mt-3 font-light">
                <span>
                  H{" "}
                  <b className="text-white/85 font-medium">
                    {formatTemp(weather.main.temp_max)}
                  </b>
                </span>
                <span>
                  L{" "}
                  <b className="text-white/85 font-medium">
                    {formatTemp(weather.main.temp_min)}
                  </b>
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>);
}
export const HeroCard = memo(HeroCardInner);
