import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface Props {
  /** When `true`, the overlay is visible. */
  show: boolean;
  /** Short label, e.g. "Fetching London…" */
  label?: string;
}

/**
 * Full-screen glassy loading overlay used while the search pipeline is
 * resolving (geocoding + fetching). Sits *above* the dashboard but
 * below modals so the user gets clear feedback that a request is in
 * flight. Uses `backdrop-blur-md` so the underlying UI remains visible
 * but clearly "paused".
 */
export function LoadingOverlay({ show, label = "Fetching weather…" }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto"
          style={{
            backdropFilter: "blur(12px) saturate(120%)",
            WebkitBackdropFilter: "blur(12px) saturate(120%)",
            background:
              "radial-gradient(circle at center, rgba(2,6,23,0.35) 0%, rgba(2,6,23,0.6) 100%)",
          }}
          aria-live="polite"
          aria-busy="true"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="glass-active rounded-2xl px-6 py-5 flex items-center gap-3 min-w-[260px]"
          >
            <div className="relative w-8 h-8 shrink-0">
              <motion.span
                className="absolute inset-0 rounded-full border border-sky-300/30"
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-sky-200 animate-spin" />
              </span>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/50">
                One moment
              </div>
              <div className="text-sm font-medium text-white/90">{label}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
