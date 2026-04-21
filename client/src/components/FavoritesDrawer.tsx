import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Trash2, MapPin } from "lucide-react";
import { Favorite } from "../lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  favorites: Favorite[];
  onSelect: (city: string) => void;
  onRemove: (id: number) => void;
}

export function FavoritesDrawer({
  open,
  onClose,
  favorites,
  onSelect,
  onRemove,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: -380, opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -380, opacity: 0.5 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed top-0 left-0 z-50 h-full w-[min(92vw,22rem)] glass-strong border-r border-white/10 flex flex-col"
          >
            <header className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-300" />
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-white/50">
                    Saved locations
                  </div>
                  <div className="text-lg font-semibold text-display">
                    Your places
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {favorites.length === 0 ? (
                <div className="text-center text-sm text-white/50 py-10 px-4">
                  No favorites yet. Sign in and tap the{" "}
                  <Heart className="inline w-3.5 h-3.5 text-pink-300 -mt-0.5" />{" "}
                  on a weather card to save it here.
                </div>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  <AnimatePresence initial={false}>
                    {favorites.map((f) => (
                      <motion.li
                        layout
                        key={f.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="group flex items-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 pr-1 transition-colors"
                      >
                        <button
                          onClick={() => {
                            onSelect(f.city);
                            onClose();
                          }}
                          className="flex-1 flex items-center gap-3 px-3 py-3 text-left min-w-0"
                        >
                          <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-white/70" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold truncate">
                              {f.city}
                            </span>
                            <span className="block text-[11px] text-white/50 truncate">
                              {f.country || "—"}
                            </span>
                          </span>
                        </button>
                        <button
                          onClick={() => onRemove(f.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-white/10"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            <footer className="px-5 py-3 text-[11px] text-white/40 border-t border-white/10">
              Tap a place to jump to it. Swipes sync across your devices when
              signed in.
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
