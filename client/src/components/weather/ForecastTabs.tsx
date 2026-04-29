import { memo, useCallback, useMemo, useState } from "react";
import { Droplets, Wind } from "lucide-react";
import type { ForecastResponse } from "../../types/weather";
import { WeatherIcon } from "./WeatherIcon";
import { useUnits } from "../../context/UnitsContext";
import { useDeviceTier } from "../../hooks/useDeviceTier";
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
        if (!map.has(day))
            map.set(day, []);
        map.get(day)!.push(entry);
    }
    const todayKey = new Date().toISOString().slice(0, 10);
    return Array.from(map.entries())
        .slice(0, 7)
        .map(([day, entries]) => {
        const temps = entries.map((e) => e.main.temp);
        const max = Math.round(Math.max(...temps));
        const min = Math.round(Math.min(...temps));
        const avg = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
        const representative = entries.find((e) => e.dt_txt.includes("12:00")) ??
            entries[Math.floor(entries.length / 2)];
        const humidities = entries.map((e) => e.main.humidity);
        const humidity = Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length);
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
function TempBar({ weekMin, weekMax, dayMin, dayMax, marker, }: {
    weekMin: number;
    weekMax: number;
    dayMin: number;
    dayMax: number;
    marker?: number;
}) {
    const span = Math.max(1, weekMax - weekMin);
    const left = ((dayMin - weekMin) / span) * 100;
    const right = ((dayMax - weekMin) / span) * 100;
    const markerPct = marker !== undefined
        ? Math.min(100, Math.max(0, ((marker - weekMin) / span) * 100))
        : null;
    return (<div className="relative h-1.5 rounded-full bg-white/10 overflow-visible">
      <div className="absolute top-0 h-full rounded-full" style={{
            width: `${right - left}%`,
            left: `${left}%`,
            background: "linear-gradient(90deg, #38bdf8 0%, #a5b4fc 45%, #f9a8d4 75%, #fb7185 100%)",
        }}/>
      {markerPct !== null && (<div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.55)]" style={{ left: `calc(${markerPct}% - 6px)` }} title={`Now ${Math.round(marker!)}°`}/>)}
    </div>);
}
const DailyRowItem = memo(function DailyRowItem({ d, i, isMobile, weekMin, weekMax, currentTemp, formatTemp, toUnit, }: {
    d: DayRow;
    i: number;
    isMobile: boolean;
    weekMin: number;
    weekMax: number;
    currentTemp?: number;
    formatTemp: (t: number) => string;
    toUnit: (t: number) => number;
}) {
    const content = (<div className={`grid items-center gap-2 sm:gap-3 py-3 px-2 sm:px-3 rounded-2xl
        grid-cols-[minmax(72px,1fr)_32px_minmax(120px,1.3fr)]
        md:grid-cols-[minmax(88px,1fr)_44px_1fr_minmax(110px,1fr)_64px]
        ${d.isToday ? "bg-white/[0.06]" : ""}`}>
      <div className="min-w-0">
        <div className={`font-medium text-sm sm:text-base ${d.isToday ? "text-white" : "text-white/85"}`}>
          {d.isToday ? "Today" : d.weekday}
        </div>
        <div className="text-[11px] text-white/45">{d.dateLabel}</div>
        <div className="md:hidden text-[10px] text-white/50 capitalize truncate mt-0.5">
          {d.description}
        </div>
      </div>

      <div className="flex justify-center text-white/85">
        <WeatherIcon main={d.main} icon={d.icon} size={26}/>
      </div>

      <div className="hidden md:block text-xs text-white/55 font-light truncate">
        <span className="capitalize">{d.description}</span>
        <span className="inline-flex items-center gap-1 ml-2 text-white/40">
          <Droplets className="w-3 h-3"/>
          {d.humidity}%
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <span className="text-[11px] sm:text-xs text-sky-200/90 w-7 sm:w-8 text-right tabular-nums">
          {formatTemp(d.min)}
        </span>
        <div className="flex-1 min-w-0">
          <TempBar weekMin={weekMin} weekMax={weekMax} dayMin={d.min} dayMax={d.max} marker={d.isToday && currentTemp !== undefined ? toUnit(currentTemp) : undefined}/>
        </div>
        <span className="text-[11px] sm:text-xs text-rose-200 font-medium w-7 sm:w-8 tabular-nums">
          {formatTemp(d.max)}
        </span>
      </div>

      <div className="hidden md:block text-right text-[11px] uppercase tracking-widest text-white/30">
        avg {formatTemp(d.avg)}
      </div>
    </div>);
    if (isMobile) {
        return <li className="divide-y divide-white/5">{content}</li>;
    }
    return <li className="rounded-2xl">{content}</li>;
});
const HourlyCard = memo(function HourlyCard({ h, i, isMobile, formatTemp, }: {
    h: ForecastResponse["list"][number];
    i: number;
    isMobile: boolean;
    formatTemp: (t: number) => string;
}) {
    const d = new Date(h.dt * 1000);
    const isNow = i === 0;
    const hour = isNow
        ? "Now"
        : d.toLocaleTimeString([], { hour: "numeric", hour12: true });
    const cls = `snap-start shrink-0 w-[82px] flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-colors ${isNow
        ? "bg-white/15 border-white/25 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
        : "bg-white/5 border-white/10 hover:bg-white/10"}`;
    const body = (<div className={cls}>
      <div className={`text-[11px] font-medium ${isNow ? "text-white" : "text-white/60"}`}>
        {hour}
      </div>
      <WeatherIcon main={h.weather[0].main} icon={h.weather[0].icon} size={30}/>
      <div className="text-base font-semibold tabular-nums">{formatTemp(h.main.temp)}</div>
      <div className="flex items-center gap-0.5 text-[10px] text-white/45">
        <Wind className="w-2.5 h-2.5"/>
        {Math.round(h.wind.speed)}
      </div>
    </div>);
    return body;
});
function ForecastTabsInner({ forecast, currentTemp }: Props) {
    const [tab, setTab] = useState<Tab>("daily");
    const { formatTemp, toUnit } = useUnits();
    const tier = useDeviceTier();
    const isMobile = tier.isMobile || tier.isLowEnd || tier.saveData;
    const setDaily = useCallback(() => setTab("daily"), []);
    const setHourly = useCallback(() => setTab("hourly"), []);
    const days = useMemo(() => groupByDay(forecast), [forecast]);
    const weekMin = days.length ? Math.min(...days.map((d) => d.min)) : 0;
    const weekMax = days.length ? Math.max(...days.map((d) => d.max)) : 0;
    return (<div className="max-w-5xl mx-auto">
      <div className="mb-4 w-full max-w-sm sm:max-w-none inline-flex glass rounded-2xl p-1 relative">
        {(["daily", "hourly"] as Tab[]).map((t) => (<button key={t} onClick={t === "daily" ? setDaily : setHourly} className="relative flex-1 px-3 sm:px-5 py-2 text-sm font-medium z-10">
            {tab === t && (<span className="absolute inset-0 rounded-xl bg-white/10 border border-white/10"/>)}
            <span className={`relative ${tab === t ? "text-white" : "text-white/60"}`}>
              {t === "daily" ? "7-day" : "Hourly"}
            </span>
          </button>))}
      </div>

      {tab === "daily" ? (<div className="glass rounded-3xl p-3 md:p-4 relative overflow-hidden">
            <div aria-hidden className="absolute inset-x-10 -top-10 h-32 pointer-events-none" style={{
                background: "radial-gradient(ellipse, rgba(125,211,252,0.2), transparent 65%)",
                filter: "blur(30px)",
            }}/>

            <ul className="relative divide-y divide-white/5">
              {days.map((d, i) => (<DailyRowItem key={d.day} d={d} i={i} isMobile={isMobile} weekMin={weekMin} weekMax={weekMax} currentTemp={currentTemp} formatTemp={formatTemp} toUnit={toUnit}/>))}
            </ul>
        </div>) : (<div className="glass rounded-3xl p-4 md:p-5 relative overflow-hidden">
            <div aria-hidden className="absolute inset-x-10 -top-10 h-32 pointer-events-none" style={{
                background: "radial-gradient(ellipse, rgba(251,113,133,0.18), transparent 65%)",
                filter: "blur(30px)",
            }}/>

            <div className="relative flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
              {forecast.list.slice(0, 16).map((h, i) => (<HourlyCard key={h.dt} h={h} i={i} isMobile={isMobile} formatTemp={formatTemp}/>))}
            </div>

            <div className="relative text-[11px] text-white/40 mt-2 text-center tracking-wide">
              Scroll to see more hours →
            </div>
        </div>)}
    </div>);
}
export const ForecastTabs = memo(ForecastTabsInner);
