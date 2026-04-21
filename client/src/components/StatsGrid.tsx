import { memo } from "react";
import { motion } from "framer-motion";
import {
  Droplets,
  Sun,
  Eye,
  Gauge,
  Thermometer,
  CloudSun,
  Compass,
  Wind,
} from "lucide-react";
import { WeatherResponse, primaryCondition } from "../lib/api";
import { estimateUVIndex } from "../lib/weather";
import { useUnits } from "../context/UnitsContext";
import { WindCompass } from "./WindCompass";
import { GaugeRing } from "./GaugeRing";

interface Props {
  weather: WeatherResponse;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function StatsGridInner({ weather }: Props) {
  const { formatTemp, formatWind } = useUnits();
  const condition = primaryCondition(weather);

  const uv =
    weather.uvIndex != null
      ? Math.round(weather.uvIndex)
      : estimateUVIndex(condition.main, condition.icon, weather.clouds?.all ?? 0);

  const uvHint =
    uv >= 8 ? "Very high" : uv >= 6 ? "High" : uv >= 3 ? "Moderate" : "Low";
  const uvColor =
    uv >= 8 ? "#ef4444" : uv >= 6 ? "#f97316" : uv >= 3 ? "#f59e0b" : "#22c55e";

  const humidityHint =
    weather.main.humidity > 70
      ? "Humid"
      : weather.main.humidity < 30
      ? "Dry"
      : "Comfortable";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="max-w-5xl mx-auto space-y-3"
    >
      {/*
        Featured row — humidity / UV / wind.
        On mobile we stack the gauge ABOVE the text (vertical, centered)
        to avoid the cramped half-cropped look the side-by-side layout
        produced at 360px. On `md:` we revert to the side-by-side flow.
      */}
      <motion.div
        variants={cardVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="glass rounded-2xl p-5 flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-4 md:gap-5"
        >
          <div className="shrink-0">
            <GaugeRing
              value={weather.main.humidity}
              max={100}
              label="Humidity"
              display={`${weather.main.humidity}%`}
              hint={humidityHint}
              color="#38bdf8"
            />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white/60 text-[11px] uppercase tracking-wider">
              <Droplets className="w-3.5 h-3.5" />
              Humidity
            </div>
            <p className="text-sm text-white/70 mt-2 leading-relaxed">
              {humidityHint === "Humid"
                ? "Air feels heavy — more moisture than usual."
                : humidityHint === "Dry"
                ? "Very dry air. Stay hydrated."
                : "Comfortable moisture level."}
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="glass rounded-2xl p-5 flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-4 md:gap-5"
        >
          <div className="shrink-0">
            <GaugeRing
              value={uv}
              max={11}
              label="UV Index"
              display={String(uv)}
              hint={uvHint}
              color={uvColor}
            />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white/60 text-[11px] uppercase tracking-wider">
              <Sun className="w-3.5 h-3.5" />
              UV Index
            </div>
            <p className="text-sm text-white/70 mt-2 leading-relaxed">
              {uv >= 6
                ? "Sun protection recommended."
                : uv >= 3
                ? "Moderate exposure — SPF advised."
                : "Minimal sun risk."}
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="glass rounded-2xl p-5 flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-4 md:gap-5"
        >
          <div className="shrink-0">
            <WindCompass
              deg={weather.wind.deg ?? 0}
              speedLabel={formatWind(weather.wind.speed)}
              size={104}
            />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white/60 text-[11px] uppercase tracking-wider">
              <Wind className="w-3.5 h-3.5" />
              Wind
            </div>
            <div className="text-display text-xl font-semibold mt-1">
              {formatWind(weather.wind.speed)}
            </div>
            <p className="text-xs text-white/60 mt-1">Direction shown live</p>
          </div>
        </motion.div>
      </motion.div>

      {/*
        Small stat cards.
        • Mobile (default): 2 columns — easier to read on 360px.
        • sm: (≥ 640px): 3 columns — fits tablets nicely.
        • md: (≥ 768px): 5 columns — full desktop row.
        Values tabular-nums so `1014 hPa`, `13.5 km` etc. align vertically.
      */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3"
      >
        {[
          {
            icon: Eye,
            label: "Visibility",
            value: `${(weather.visibility / 1000).toFixed(1)} km`,
            hint:
              weather.visibility >= 10000
                ? "Perfect"
                : weather.visibility >= 5000
                ? "Good"
                : "Hazy",
          },
          {
            icon: Gauge,
            label: "Pressure",
            value: `${weather.main.pressure} hPa`,
            hint: weather.main.pressure > 1015 ? "High" : "Low",
          },
          {
            icon: Thermometer,
            label: "Feels like",
            value: formatTemp(weather.main.feels_like),
            hint: "Perceived",
          },
          {
            icon: CloudSun,
            label: "Cloud cover",
            value: `${weather.clouds?.all ?? 0}%`,
            hint: (weather.clouds?.all ?? 0) > 60 ? "Overcast" : "Clear",
          },
          {
            icon: Compass,
            label: "Location",
            value: `${weather.coord.lat.toFixed(1)}, ${weather.coord.lon.toFixed(1)}`,
            hint: "Lat, Lon",
          },
        ].map((s) => (
          <motion.div
            key={s.label}
            variants={cardVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="glass rounded-2xl p-3 sm:p-4 flex flex-col gap-1.5 min-w-0"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 text-[10px] sm:text-[11px] uppercase tracking-wider">
              <s.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">{s.label}</span>
            </div>
            <div className="text-display text-base sm:text-lg md:text-xl font-semibold tabular-nums truncate">
              {s.value}
            </div>
            <div className="text-[11px] sm:text-xs text-white/50 truncate">
              {s.hint}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export const StatsGrid = memo(StatsGridInner);

