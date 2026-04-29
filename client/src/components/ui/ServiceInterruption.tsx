import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
interface Props {
    title?: string;
    message?: string;
    onRetry?: () => void;
    kind?: "network" | "error";
}
export function ServiceInterruption({ title = "Service interruption", message = "We couldn't reach the weather service. This usually clears up in a few seconds — the problem is on our side, not yours.", onRetry, kind = "error", }: Props) {
    const Icon = kind === "network" ? WifiOff : AlertTriangle;
    return (<motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="max-w-2xl mx-auto glass-active rounded-[2rem] p-8 md:p-10 text-center relative overflow-hidden">
      <motion.div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] rounded-full pointer-events-none" style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.28), rgba(34,211,238,0.18) 40%, transparent 70%)",
            filter: "blur(70px)",
        }} animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}/>

      <div className="relative">
        <motion.div initial={{ scale: 0.6, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }} className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/10 mb-5">
          <motion.span aria-hidden className="absolute inset-0 rounded-2xl" style={{
            boxShadow: "0 0 0 1px rgba(99,102,241,0.35), 0 0 36px -4px rgba(99,102,241,0.6)",
        }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}/>
          <Icon className={`w-9 h-9 relative ${kind === "network" ? "text-cyan-200" : "text-amber-200"}`} strokeWidth={1.5}/>
        </motion.div>

        <h3 className="text-display text-2xl md:text-3xl font-semibold tracking-tight">
          {title}
        </h3>
        <p className="text-white/60 text-sm md:text-base mt-2.5 max-w-md mx-auto leading-relaxed">
          {message}
        </p>

        {onRetry && (<motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }} onClick={onRetry} className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-medium border border-white/15 relative overflow-hidden group" style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.9), rgba(34,211,238,0.85))",
                boxShadow: "0 10px 40px -10px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}>
            <motion.span aria-hidden className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)",
            }} initial={false} animate={{ x: ["-120%", "120%"] }} transition={{
                duration: 1.4,
                repeat: Infinity,
                repeatDelay: 1.8,
                ease: "easeInOut",
            }}/>
            <RefreshCw className="w-4 h-4 relative"/>
            <span className="relative">Try again</span>
          </motion.button>)}
      </div>
    </motion.div>);
}
