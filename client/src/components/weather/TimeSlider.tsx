import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ForecastResponse, WeatherResponse } from "../../types/weather";
import { WeatherIcon } from "./WeatherIcon";
import { useUnits } from "../../context/UnitsContext";
import { useTimeMachine } from "../../context/TimeMachineContext";
import { skyTintForHour } from "../../lib/sky";
import { useDeviceTier } from "../../hooks/useDeviceTier";
interface Props {
    forecast: ForecastResponse | null;
    current?: WeatherResponse | null;
}
type ForecastPoint = ForecastResponse["list"][number];
function nextSlots(raw: ForecastPoint[], max: number): ForecastPoint[] {
    if (raw.length === 0)
        return [];
    const sorted = [...raw].sort((a, b) => a.dt - b.dt);
    return sorted.slice(0, Math.min(max, sorted.length));
}
const SLOT_COUNT_FULL = 16;
const SLOT_COUNT_MOBILE = 5;
const SHORTCUT_COUNT = 6;

function hourFromForecastPoint(point: ForecastPoint): number {
    const timePart = point.dt_txt.split(" ")[1] ?? "12:00:00";
    const [hours, minutes] = timePart.split(":").map(Number);
    return (Number.isFinite(hours) ? hours : 12) + (Number.isFinite(minutes) ? minutes : 0) / 60;
}

function labelFromForecastPoint(point: ForecastPoint): string {
    const timePart = point.dt_txt.split(" ")[1] ?? "12:00:00";
    const [rawHours, rawMinutes] = timePart.split(":").map(Number);
    const hours = Number.isFinite(rawHours) ? rawHours : 12;
    const minutes = Number.isFinite(rawMinutes) ? rawMinutes : 0;
    const period = hours >= 12 ? "PM" : "AM";
    const normalized = hours % 12 || 12;
    return `${normalized.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function TimeSliderInner({ forecast, current }: Props) {
    const { formatTemp } = useUnits();
    const { setFrame } = useTimeMachine();
    const tier = useDeviceTier();
    const defaultShort = tier.isMobile || tier.isLowEnd || tier.saveData;
    const [showFullDay, setShowFullDay] = useState(!defaultShort);
    useEffect(() => {
        setShowFullDay(!defaultShort);
    }, [defaultShort]);
    const slots = useMemo(() => {
        if (!forecast)
            return [];
        const count = showFullDay ? SLOT_COUNT_FULL : SLOT_COUNT_MOBILE;
        return nextSlots(forecast.list, count);
    }, [forecast, showFullDay]);
    const shortcuts = useMemo(() => {
        if (slots.length === 0)
            return [];
        const stride = Math.max(1, Math.floor(slots.length / SHORTCUT_COUNT));
        return Array.from({ length: SHORTCUT_COUNT }, (_, i) => {
            const slotIdx = Math.min(slots.length - 1, i * stride);
            return { slotIdx, slot: slots[slotIdx] };
        });
    }, [slots]);
    const [idx, setIdx] = useState(0);
    const point = slots[idx];
    useEffect(() => {
        setIdx(0);
    }, [forecast, showFullDay]);
    const lastEmittedHourRef = useRef<number | null>(null);
    useEffect(() => {
        if (!point)
            return;
        const hour = hourFromForecastPoint(point);
        if (lastEmittedHourRef.current !== null &&
            Math.abs(lastEmittedHourRef.current - hour) < 0.001) {
            return;
        }
        lastEmittedHourRef.current = hour;
        setFrame({
            hour,
            condition: point.weather[0].main,
            icon: point.weather[0].icon,
            isDay: point.is_day === 1,
        });
    }, [point, setFrame]);
    useEffect(() => {
        return () => setFrame(null);
    }, [setFrame]);
    if (!point)
        return null;
    const hour = labelFromForecastPoint(point);
    const dayPct = idx / Math.max(1, slots.length - 1);
    const stripGradient = useMemo(() => {
        const steps = 7;
        const stops = Array.from({ length: steps }, (_, i) => {
            const t = i / (steps - 1);
            const slotIdx = Math.round(t * (slots.length - 1));
            const s = slots[slotIdx];
            const tint = s
                ? skyTintForHour(hourFromForecastPoint(s))
                : skyTintForHour(12);
            return `${tint.topColor} ${(t * 100).toFixed(1)}%`;
        });
        return `linear-gradient(90deg, ${stops.join(", ")})`;
    }, [slots]);
    const handleRange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setIdx(Number(e.target.value)), []);
    const handleJump = useCallback((slotIdx: number) => setIdx(slotIdx), []);
    return (<div className="glass rounded-3xl p-5 md:p-8 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-4">
          <WeatherIcon main={point.weather[0].main} icon={point.weather[0].icon} size={52}/>
          <div>
            <div className="text-display text-3xl md:text-4xl font-light leading-none">
              {formatTemp(point.main.temp)}
            </div>
            <div className="text-sm text-white/60 capitalize mt-1">
              {hour} · {point.weather[0].description}
            </div>
          </div>
        </div>

        <div className="text-[11px] uppercase tracking-widest text-white/45">
          Time Machine · {showFullDay ? "~48 h" : "~15 h"}
        </div>
      </div>

      <div className="h-16 rounded-2xl relative overflow-hidden border" style={{
            background: stripGradient,
            borderColor: "rgba(255,255,255,var(--glass-border-alpha))",
        }}>
        <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow-[0_0_28px_8px_rgba(255,255,255,0.55)]" style={{ left: `calc(${dayPct * 100}% - 12px)` }}/>
      </div>

      <input type="range" min={0} max={slots.length - 1} value={idx} onChange={handleRange} className="time-slider w-full mt-5" aria-label="Scrub through the hourly forecast"/>

      <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 flex-1 min-w-0 w-full">
          {shortcuts.map(({ slotIdx, slot }) => (<button key={slot.dt} onClick={() => handleJump(slotIdx)} className={`rounded-xl p-2.5 text-center transition-colors border ${slotIdx === idx
                ? "bg-white/20 border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
                : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
              <div className="text-[11px] text-white/60">
                {labelFromForecastPoint(slot)}
              </div>
              <div className="flex justify-center my-1 text-white/80">
                <WeatherIcon main={slot.weather[0].main} icon={slot.weather[0].icon} size={20}/>
              </div>
              <div className="text-sm font-semibold">
                {formatTemp(slot.main.temp)}
              </div>
            </button>))}
        </div>

        {defaultShort && (<button onClick={() => setShowFullDay((v) => !v)} className="text-xs px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-colors">
            {showFullDay ? "Compact" : "Full track"}
          </button>)}
      </div>
    </div>);
}
export const TimeSlider = memo(TimeSliderInner);
