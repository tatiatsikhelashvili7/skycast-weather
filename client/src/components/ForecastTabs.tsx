import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Wind } from "lucide-react";
import { ForecastResponse } from "../lib/api";
import { WeatherIcon } from "./WeatherIcon";
import { useUnits } from "../context/UnitsContext";

interface Props {
  forecast: ForecastResponse;
  currentTemp?: number;
}

type Tab = "daily" | "hourly";

interface DayRow {
  day: string;
  weekday: string;
  dateLabel: string;
  icon: string;
  main: string;
  description: string;
  min: number;
  max: number;
  avg: number;
  humidity: number;
  isToday: boolean;
}

function groupByDay(forecast: ForecastResponse): DayRow[] {
  const map = new Map<string, ForecastResponse["list"]>();
  for (const entry of forecast.list) {
    const day = entry.dt_txt.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(entry);
  }

  const todayKey = new Date().toISOString().slice(0, 10);

  return Array.from(map.entries())
    .slice(0, 7)
    .map(([day, entries]) => {
      const temps = entries.map((e) => e.main.temp);
      const max = Math.round(Math.max(...temps));
      const min = Math.round(Math.min(...temps));
      const avg = Math.round(
        temps.reduce((a, b) => a + b, 0) / temps.length
      );

      // Prefer a midday sample for the icon/description
      const representative =
        entries.find((e) => e.dt_txt.includes("12:00")) ??
        entries[Math.floor(entries.length / 2)];

      const humidities = entries.map((e) => e.main.humidity);
      const humidity = Math.round(
        humidities.reduce((a, b) => a + b, 0) / humidities.length
      );

      const d = new Date(day + "T12:00:00");
      return {
        day,
        weekday: d.toLocaleDateString([], { weekday: "short" }),
        dateLabel: d.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
        icon: representative.weather[0].icon,
        main: representative.weather[0].main,
        description: representative.weather[0].description,
        min,
        max,
        avg,
        humidity,
        isToday: day === todayKey,
      };
    });
}

/**
 * Temperature range bar for a day row.
 * The bar spans the week's overall min..max; the pill inside marks where
 * today's own min..max sits, coloured in a sky→rose gradient.
 * If `marker` is provided (the actual current temp, for today's row) a
 * small white dot is drawn on top of the pill.
 */
function TempBar({
  weekMin,
  weekMax,
  dayMin,
  dayMax,
  marker,
}: {
  weekMin: number;
  weekMax: number;
  dayMin: number;
  dayMax: number;
  marker?: number;
}) {
  const span = Math.max(1, weekMax - weekMin);
  const left = ((dayMin - weekMin) / span) * 100;
  const right = ((dayMax - weekMin) / span) * 100;
  const markerPct =
    marker !== undefined
      ? Math.min(100, Math.max(0, ((marker - weekMin) / span) * 100))
      : null;

  return (
    <div className="relative h-1.5 rounded-full bg-white/10 overflow-visible">
      <motion.div
        initial={{ width: 0, left: `${left}%` }}
        animate={{ width: `${right - left}%`, left: `${left}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-0 h-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, #38bdf8 0%, #a5b4fc 45%, #f9a8d4 75%, #fb7185 100%)",
        }}
      />
      {markerPct !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          style={{ left: `calc(${markerPct}% - 6px)` }}
          title={`Now ${Math.round(marker!)}°`}
        />
      )}
    </div>
  );
}

function ForecastTabsInner({ forecast, currentTemp }: Props) {
  const [tab, setTab] = useState<Tab>("daily");
  const { formatTemp, toUnit } = useUnits();

  const days = useMemo(() => groupByDay(forecast), [forecast]);

  // Week-wide min/max for the temp bars.
  const weekMin = days.length ? Math.min(...days.map((d) => d.min)) : 0;
  const weekMax = days.length ? Math.max(...days.map((d) => d.max)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto"
    >
      {/* Tab switcher with sliding pill */}
      <div className="mb-4 inline-flex glass rounded-2xl p-1 relative">
        {(["daily", "hourly"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative px-5 py-2 text-sm font-medium z-10"
          >
            {tab === t && (
              <motion.span
                layoutId="forecast-tab-pill"
                className="absolute inset-0 rounded-xl bg-white/20 border border-white/20"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span
              className={`relative ${
                tab === t ? "text-white" : "text-white/60"
              }`}
            >
              {t === "daily" ? "7-day" : "Hourly"}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "daily" ? (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="glass rounded-3xl p-3 md:p-4 relative overflow-hidden"
          >
            {/* Ambient glow behind the list */}
            <div
              aria-hidden
              className="absolute inset-x-10 -top-10 h-32 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(125,211,252,0.2), transparent 65%)",
                filter: "blur(30px)",
              }}
            />

            {/*
              Responsive row grid.
              • Mobile (≤ md): 4 tracks — weekday · icon · temp-range · (avg hidden).
              • Desktop: 5 tracks — weekday · icon · description · temp-range · avg.
              The description is collapsed under the weekday on phones so the
              row never needs horizontal scrolling even at 320px.
            */}
            <ul className="relative divide-y divide-white/5">
              {days.map((d, i) => (
                <motion.li
                  key={d.day}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  whileHover={{ x: 3 }}
                  transition={{
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                  }}
                  className={`grid items-center gap-2 sm:gap-3 py-3 px-2 sm:px-3 rounded-2xl
                    grid-cols-[minmax(72px,1fr)_32px_minmax(120px,1.3fr)]
                    md:grid-cols-[minmax(88px,1fr)_44px_1fr_minmax(110px,1fr)_64px]
                    ${d.isToday ? "bg-white/[0.06]" : ""}`}
                >
                  {/* Weekday + date (description folds under on mobile) */}
                  <div className="min-w-0">
                    <div
                      className={`font-medium text-sm sm:text-base ${
                        d.isToday ? "text-white" : "text-white/85"
                      }`}
                    >
                      {d.isToday ? "Today" : d.weekday}
                    </div>
                    <div className="text-[11px] text-white/45">
                      {d.dateLabel}
                    </div>
                    {/* Description — mobile-only, ships below the weekday */}
                    <div className="md:hidden text-[10px] text-white/50 capitalize truncate mt-0.5">
                      {d.description}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="flex justify-center text-white/85">
                    <motion.div
                      whileHover={{ rotate: 8, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <WeatherIcon main={d.main} icon={d.icon} size={26} />
                    </motion.div>
                  </div>

                  {/* Humidity + description — desktop only */}
                  <div className="hidden md:block text-xs text-white/55 font-light truncate">
                    <span className="capitalize">{d.description}</span>
                    <span className="inline-flex items-center gap-1 ml-2 text-white/40">
                      <Droplets className="w-3 h-3" />
                      {d.humidity}%
                    </span>
                  </div>

                  {/* Temp range bar with min/max caps */}
                  <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                    <span className="text-[11px] sm:text-xs text-sky-200/90 w-7 sm:w-8 text-right tabular-nums">
                      {formatTemp(d.min)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <TempBar
                        weekMin={weekMin}
                        weekMax={weekMax}
                        dayMin={d.min}
                        dayMax={d.max}
                        marker={
                          d.isToday && currentTemp !== undefined
                            ? toUnit(currentTemp)
                            : undefined
                        }
                      />
                    </div>
                    <span className="text-[11px] sm:text-xs text-rose-200 font-medium w-7 sm:w-8 tabular-nums">
                      {formatTemp(d.max)}
                    </span>
                  </div>

                  {/* Right-side accent number (avg), pure decoration — desktop only */}
                  <div className="hidden md:block text-right text-[11px] uppercase tracking-widest text-white/30">
                    avg {formatTemp(d.avg)}
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ) : (
          <motion.div
            key="hourly"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="glass rounded-3xl p-4 md:p-5 relative overflow-hidden"
          >
            <div
              aria-hidden
              className="absolute inset-x-10 -top-10 h-32 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(251,113,133,0.18), transparent 65%)",
                filter: "blur(30px)",
              }}
            />

            <div className="relative flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
              {forecast.list.slice(0, 16).map((h, i) => {
                const d = new Date(h.dt * 1000);
                const isNow = i === 0;
                const hour = isNow
                  ? "Now"
                  : d.toLocaleTimeString([], {
                      hour: "numeric",
                      hour12: true,
                    });
                return (
                  <motion.div
                    key={h.dt}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -4, scale: 1.03 }}
                    transition={{
                      delay: i * 0.04,
                      type: "spring",
                      stiffness: 320,
                      damping: 22,
                    }}
                    className={`snap-start shrink-0 w-[82px] flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-colors ${
                      isNow
                        ? "bg-white/15 border-white/25 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div
                      className={`text-[11px] font-medium ${
                        isNow
                          ? "text-white"
                          : "text-white/60"
                      }`}
                    >
                      {hour}
                    </div>
                    <WeatherIcon
                      main={h.weather[0].main}
                      icon={h.weather[0].icon}
                      size={30}
                    />
                    <div className="text-base font-semibold tabular-nums">
                      {formatTemp(h.main.temp)}
                    </div>
                    <div className="flex items-center gap-0.5 text-[10px] text-white/45">
                      <Wind className="w-2.5 h-2.5" />
                      {Math.round(h.wind.speed)}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="relative text-[11px] text-white/40 mt-2 text-center tracking-wide">
              Scroll to see more hours →
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Memoised — only re-renders when `forecast` reference or `currentTemp`
 * actually change. Keeps scroll interactions on the dashboard smooth.
 */
export const ForecastTabs = memo(ForecastTabsInner);

