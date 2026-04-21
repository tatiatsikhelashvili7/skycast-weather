import { motion, AnimatePresence } from "framer-motion";
import { MapPinOff, X, Sparkles } from "lucide-react";

interface Props {
  /** The failing query (e.g. "Londno") — shown quoted in the toast. */
  query: string | null;
  /** Optional suggestions the user can click to retry quickly. */
  suggestions?: string[];
  onDismiss: () => void;
  onPick?: (city: string) => void;
}

/**
 * Floating "city not found" toast shown when the server's geocoder
 * returns a 404 for the user's query. Offers one-click retries for
 * common nearby alternatives.
 */
export function CityNotFoundToast({
  query,
  suggestions = [],
  onDismiss,
  onPick,
}: Props) {
  return (
    <AnimatePresence>
      {query && (
        <motion.div
          key="not-found"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] max-w-md w-[92%]"
          role="status"
        >
          <div className="glass-active rounded-2xl p-4 pr-3 relative overflow-hidden">
            {/* Amber tinted glow */}
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3.5, repeat: Infinity }}
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(251,191,36,0.25), transparent 70%)",
                filter: "blur(40px)",
              }}
            />

            <div className="relative flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-300/25 flex items-center justify-center shrink-0">
                <MapPinOff className="w-5 h-5 text-amber-200" />
              </span>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-[0.3em] text-amber-200/80">
                  City not found
                </div>
                <div className="text-sm text-white/90 mt-0.5">
                  We couldn't locate{" "}
                  <span className="font-semibold text-white">"{query}"</span>.
                  Try another spelling?
                </div>

                {suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/40 pr-1">
                      <Sparkles className="w-3 h-3" />
                      try
                    </span>
                    {suggestions.map((s) => (
                      <motion.button
                        key={s}
                        whileHover={{ y: -1, scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onPick?.(s)}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 text-white/80"
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={onDismiss}
                aria-label="Dismiss"
                className="text-white/50 hover:text-white/90 shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
