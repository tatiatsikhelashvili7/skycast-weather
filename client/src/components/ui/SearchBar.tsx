import { FormEvent, useEffect, useRef, useState } from "react";
import { Search, MapPin, Loader2, Navigation, ArrowRight, } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseQuery } from "../../lib/parseQuery";
import { Magnetic } from "./Magnetic";
interface Props {
    onSearch: (city: string) => void;
    onCoords?: (lat: number, lon: number) => void;
    onGeoLocate?: () => void;
    initial?: string;
    locating?: boolean;
    busy?: boolean;
}
export function SearchBar({ onSearch, onCoords, onGeoLocate, initial = "", locating = false, busy = false, }: Props) {
    const [value, setValue] = useState(initial);
    const [focused, setFocused] = useState(false);
    const [flash, setFlash] = useState(false);
    const lastInitial = useRef(initial);
    useEffect(() => {
        if (initial !== lastInitial.current) {
            lastInitial.current = initial;
            if (!focused)
                setValue(initial);
        }
    }, [initial, focused]);
    const parsed = value.trim() ? parseQuery(value) : null;
    const isCoords = parsed?.kind === "coords";
    const canSubmit = Boolean(parsed) && !busy;
    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!parsed || busy)
            return;
        setFlash(true);
        setTimeout(() => setFlash(false), 550);
        if (parsed.kind === "coords" && onCoords) {
            onCoords(parsed.lat, parsed.lon);
        }
        else if (parsed.kind === "city") {
            onSearch(parsed.city);
        }
    }
    return (<motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className={`glass glass-search w-full max-w-xl rounded-2xl flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 relative transition-shadow duration-300 ${focused
            ? "shadow-[0_0_0_2px_rgba(125,211,252,0.25),0_20px_45px_-20px_rgba(56,189,248,0.55)]"
            : ""}`}>
      <AnimatePresence>
        {focused && (<motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                background: "radial-gradient(ellipse at center, rgba(125,211,252,0.12), transparent 70%)",
            }}/>)}
      </AnimatePresence>

      <div className="ml-3 relative w-5 h-5 shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {isCoords ? (<motion.span key="nav" initial={{ opacity: 0, rotate: -40, scale: 0.6 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }} title="Detected coordinates" className="absolute inset-0 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-sky-300"/>
            </motion.span>) : (<motion.span key="search" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }} className="absolute inset-0 flex items-center justify-center">
              <Search className="w-5 h-5 text-white/60"/>
            </motion.span>)}
        </AnimatePresence>
      </div>

      <input className="flex-1 bg-transparent outline-none placeholder-white/40 py-2 min-w-[180px] sm:min-w-0" placeholder="Search a city or coords… (e.g. Tokyo, 41.74, 44.76)" value={value} onChange={(e) => setValue(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}/>

      {isCoords && (<motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-[10px] uppercase tracking-wider text-sky-200/80 bg-sky-400/10 border border-sky-300/20 rounded-full px-2 py-1">
          lat, lon
        </motion.span>)}

      {onGeoLocate && (<motion.button type="button" onClick={onGeoLocate} disabled={locating} whileHover={{ y: -1 }} whileTap={{ scale: 0.94 }} className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-60" title="Use my location">
          {locating ? (<Loader2 className="w-4 h-4 animate-spin"/>) : (<MapPin className="w-4 h-4"/>)}
          <span className="hidden sm:inline">My location</span>
        </motion.button>)}

      <Magnetic strength={0.22} radius={140}>
        <motion.button type="submit" disabled={!canSubmit} whileHover={canSubmit ? { scale: 1.04, y: -1 } : undefined} whileTap={canSubmit ? { scale: 0.95 } : undefined} transition={{ type: "spring", stiffness: 360, damping: 20 }} className={`relative overflow-hidden group inline-flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl font-medium text-white
            border border-white/20 shadow-lg
            transition-all duration-300
            ${canSubmit
            ? "bg-gradient-to-br from-sky-400/90 via-indigo-500/90 to-violet-500/90 hover:shadow-sky-400/30"
            : "bg-white/10 text-white/40 cursor-not-allowed"}`}>
          <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{
            background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
        }}/>
          <AnimatePresence>
            {flash && (<motion.span key="flash" initial={{ scale: 0, opacity: 0.9 }} animate={{ scale: 3.2, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/60"/>)}
          </AnimatePresence>

          {busy ? (<Loader2 className="w-4 h-4 relative z-10 animate-spin"/>) : (<Search className="w-4 h-4 relative z-10"/>)}
          <span className="hidden sm:inline relative z-10">
            {busy ? "Searching…" : "Search"}
          </span>
          <span className="relative z-10 flex">
            <ArrowRight className="w-4 h-4"/>
          </span>
        </motion.button>
      </Magnetic>
    </motion.form>);
}
