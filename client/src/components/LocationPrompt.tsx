import { motion } from "framer-motion";
import { MapPin, X, Loader2 } from "lucide-react";

interface Props {
  status: "idle" | "requesting" | "success" | "error";
  error: string | null;
  denied: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

/**
 * First-visit modal asking for geolocation permission. Framed as a value
 * proposition (not a scary browser popup) so users actually click allow.
 */
export function LocationPrompt({ status, error, denied, onAllow, onSkip }: Props) {
  const isRequesting = status === "requesting";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative glass-strong rounded-[2rem] p-8 md:p-10 max-w-md w-full text-center"
      >
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          aria-label="Skip"
        >
          <X className="w-4 h-4" />
        </button>

        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sky-400/30 to-indigo-500/30 border border-white/20 mb-5"
        >
          <MapPin className="w-7 h-7 text-sky-200" strokeWidth={1.5} />
        </motion.div>

        <h2 className="text-display text-2xl md:text-3xl font-semibold">
          Weather for where you are
        </h2>
        <p className="text-white/60 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
          Allow location access and SkyCast will automatically track your spot
          and show live conditions for it — updated every minute.
        </p>

        {denied && (
          <div className="mt-4 text-xs text-rose-200 bg-rose-500/10 border border-rose-400/20 rounded-xl p-3">
            Location was blocked. Enable it in your browser's site settings
            (the lock icon in the address bar) and try again.
          </div>
        )}

        {error && !denied && (
          <div className="mt-4 text-xs text-amber-200 bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={onAllow}
            disabled={isRequesting}
            className="btn-primary !bg-white/20 hover:!bg-white/30 disabled:opacity-60"
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Locating…
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                {denied ? "Try again" : "Allow location"}
              </>
            )}
          </button>
          <button onClick={onSkip} className="btn-ghost">
            Not now
          </button>
        </div>

        <p className="text-[11px] text-white/40 mt-5">
          Coordinates are used only to look up your city. Nothing is stored.
        </p>
      </motion.div>
    </motion.div>
  );
}
