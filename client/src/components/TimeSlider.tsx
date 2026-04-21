import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ForecastResponse, WeatherResponse } from "../lib/api";
import { WeatherIcon } from "./WeatherIcon";
import { useUnits } from "../context/UnitsContext";
import { useTimeMachine } from "../context/TimeMachineContext";
import { localHourFor, skyTintForHour } from "../lib/sky";

interface Props {
  forecast: ForecastResponse | null;
  /**
   * The currently-observed weather — used to anchor the preview frame to
   * the city's local time zone via its sunrise / sunset. Safe to omit;
   * we fall back to the browser's local time when absent.
   */
  current?: WeatherResponse | null;
}

type ForecastPoint = ForecastResponse["list"][number];

/**
 * Interpolate the (possibly 1- or 3-hourly) forecast samples into a
 * dense 30-minute series. For each target slot we find the two raw
 * samples that straddle it and linearly blend the numeric fields. The
 * weather icon is inherited from whichever neighbour is closer in time,
 * so icons don't "flicker" on every slot.
 *
 * @param raw       Raw forecast samples (any spacing; must be sortable by `dt`).
 * @param slotCount Number of 30-minute slots to produce starting from the first sample.
 */
function to30MinSteps(raw: ForecastPoint[], slotCount: number): ForecastPoint[] {
  if (raw.length === 0) return [];
  const sorted = [...raw].sort((a, b) => a.dt - b.dt);
  const first = sorted[0];

  const step = 1800;
  const out: ForecastPoint[] = [];

  for (let i = 0; i < slotCount; i++) {
    const t = first.dt + i * step;

    let before = sorted[0];
    let after = sorted[sorted.length - 1];
    for (let j = 0; j < sorted.length - 1; j++) {
      if (sorted[j].dt <= t && sorted[j + 1].dt >= t) {
        before = sorted[j];
        after = sorted[j + 1];
        break;
      }
    }

    const span = Math.max(1, after.dt - before.dt);
    const frac = Math.min(1, Math.max(0, (t - before.dt) / span));
    const lerp = (a: number, b: number) => a + (b - a) * frac;

    const iconSource = frac < 0.5 ? before : after;

    out.push({
      ...before,
      dt: t,
      dt_txt: new Date(t * 1000).toISOString().replace("T", " ").slice(0, 19),
      main: {
        temp: lerp(before.main.temp, after.main.temp),
        humidity: Math.round(lerp(before.main.humidity, after.main.humidity)),
      },
      weather: iconSource.weather,
      wind: {
        speed: lerp(before.wind.speed, after.wind.speed),
      },
    });
  }
  return out;
}

/** 48 slots × 30-minute granularity → 24 hours of coverage. */
const SLOT_COUNT = 48;
/** Number of quick-jump shortcut buttons rendered under the slider. */
const SHORTCUT_COUNT = 6;

function TimeSliderInner({ forecast, current }: Props) {
  const { formatTemp } = useUnits();
  const { setFrame } = useTimeMachine();

  const slots = useMemo(() => {
    if (!forecast) return [];
    return to30MinSteps(forecast.list, SLOT_COUNT);
  }, [forecast]);

  /** Six evenly-spread quick-jump slots — e.g. 0 h, +4 h, +8 h, +12 h, +16 h, +20 h. */
  const shortcuts = useMemo(() => {
    if (slots.length === 0) return [];
    const stride = Math.max(1, Math.floor(slots.length / SHORTCUT_COUNT));
    return Array.from({ length: SHORTCUT_COUNT }, (_, i) => {
      const slotIdx = Math.min(slots.length - 1, i * stride);
      return { slotIdx, slot: slots[slotIdx] };
    });
  }, [slots]);

  const [idx, setIdx] = useState(0);
  const point = slots[idx];

  const sunrise = current?.sys.sunrise;
  const sunset = current?.sys.sunset;

  /**
   * Push the current scrub position into `TimeMachineContext` so the
   * Dynamic Background can morph in real time.
   *
   * We use a ref to avoid emitting identical frames — this keeps the
   * context from re-rendering consumers when the hour hasn't changed
   * meaningfully (e.g. on an initial double-commit from StrictMode).
   */
  const lastEmittedHourRef = useRef<number | null>(null);
  useEffect(() => {
    if (!point) return;
    const hour = localHourFor(point.dt, sunrise, sunset);
    if (
      lastEmittedHourRef.current !== null &&
      Math.abs(lastEmittedHourRef.current - hour) < 0.001
    ) {
      return;
    }
    lastEmittedHourRef.current = hour;
    setFrame({
      hour,
      condition: point.weather[0].main,
      icon: point.weather[0].icon,
    });
  }, [point, setFrame, sunrise, sunset]);

  /** Clear the preview on unmount so the background reverts to "now". */
  useEffect(() => {
    return () => setFrame(null);
  }, [setFrame]);

  if (!point) return null;

  const hour = new Date(point.dt * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dayPct = idx / Math.max(1, slots.length - 1);

  /**
   * Live preview strip under the slider — samples the same sky engine the
   * background uses, so what you see in the strip is what you'll see
   * wrapping the whole page.
   */
  const stripGradient = useMemo(() => {
    const steps = 7;
    const stops = Array.from({ length: steps }, (_, i) => {
      const t = i / (steps - 1);
      const slotIdx = Math.round(t * (slots.length - 1));
      const s = slots[slotIdx];
      const tint = s
        ? skyTintForHour(localHourFor(s.dt, sunrise, sunset))
        : skyTintForHour(12);
      return `${tint.topColor} ${(t * 100).toFixed(1)}%`;
    });
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  }, [slots, sunrise, sunset]);

  return (
    /*
     * No entrance animation here — "How today unfolds" is an interactive
     * control surface. A fade-in / slide-in makes the slider feel like
     * it's moving away from the user's finger on mobile. Render flat.
     */
    <div className="glass rounded-3xl p-5 md:p-8 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-4">
          <WeatherIcon
            main={point.weather[0].main}
            icon={point.weather[0].icon}
            size={52}
          />
          <div>
            <motion.div
              key={`temp-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-display text-3xl md:text-4xl font-light leading-none"
            >
              {formatTemp(point.main.temp)}
            </motion.div>
            <motion.div
              key={`desc-${idx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-white/60 capitalize mt-1"
            >
              {hour} · {point.weather[0].description}
            </motion.div>
          </div>
        </div>

        <div className="text-[11px] uppercase tracking-widest text-white/45">
          Time Machine · 24 h
        </div>
      </div>

      {/* Live sky strip — mirrors the actual background engine. */}
      <div
        className="h-16 rounded-2xl relative overflow-hidden border border-white/10"
        style={{ background: stripGradient }}
      >
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow-[0_0_28px_8px_rgba(255,255,255,0.55)]"
          animate={{ left: `calc(${dayPct * 100}% - 12px)` }}
          transition={{ type: "spring", stiffness: 90, damping: 16 }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={slots.length - 1}
        value={idx}
        onChange={(e) => setIdx(Number(e.target.value))}
        className="time-slider w-full mt-5"
        aria-label="Scrub through the hourly forecast"
      />

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
        {shortcuts.map(({ slotIdx, slot }) => (
          <motion.button
            key={slot.dt}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            onClick={() => setIdx(slotIdx)}
            className={`rounded-xl p-2.5 text-center transition-all border ${
              slotIdx === idx
                ? "bg-white/20 border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="text-[11px] text-white/60">
              {new Date(slot.dt * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="flex justify-center my-1 text-white/80">
              <WeatherIcon
                main={slot.weather[0].main}
                icon={slot.weather[0].icon}
                size={20}
              />
            </div>
            <div className="text-sm font-semibold">
              {formatTemp(slot.main.temp)}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/** Memoised so scrubbing elsewhere on the page doesn't re-layout this slider. */
export const TimeSlider = memo(TimeSliderInner);
