import { motion } from "framer-motion";
import { MapPin, Search, Compass } from "lucide-react";

interface Props {
  onPick: (city: string) => void;
  onAskLocation?: () => void;
}

const POPULAR = [
  "Tbilisi",
  "Batumi",
  "London",
  "Tokyo",
  "New York",
  "Paris",
  "Dubai",
  "Sydney",
];

export function WelcomeCard({ onPick, onAskLocation }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto glass-strong rounded-[2rem] p-8 md:p-12 text-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sky-400/25 to-indigo-500/25 border border-white/15 mb-5"
      >
        <Compass className="w-7 h-7 text-sky-200" strokeWidth={1.5} />
      </motion.div>

      <h2 className="text-display text-3xl md:text-4xl font-semibold">
        Pick a place to get started
      </h2>
      <p className="text-white/60 text-sm mt-3 max-w-md mx-auto leading-relaxed">
        Search any city worldwide or enter coordinates as{" "}
        <code className="text-white/80 bg-white/5 px-1.5 py-0.5 rounded">
          lat, lon
        </code>
        . Tap a suggestion below to explore instantly.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {POPULAR.map((c, i) => (
          <motion.button
            key={c}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.04 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onPick(c)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 px-3.5 py-1.5 text-sm transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-white/50" />
            {c}
          </motion.button>
        ))}
      </div>

      {onAskLocation && (
        <button
          onClick={onAskLocation}
          className="mt-6 inline-flex items-center gap-2 text-xs text-sky-200/90 hover:text-sky-100 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" />
          Or let me use your location
        </button>
      )}
    </motion.div>
  );
}
