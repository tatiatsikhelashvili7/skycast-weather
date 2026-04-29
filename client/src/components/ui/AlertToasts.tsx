import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Info, Zap, X } from "lucide-react";
import { LiveAlert } from "../../hooks/useSocket";
import { useDeviceTier } from "../../hooks/useDeviceTier";
interface Props {
    alerts: LiveAlert[];
    onDismiss: (id: string) => void;
}
const levelStyles: Record<LiveAlert["level"], string> = {
    info: "from-sky-500/30 to-sky-600/10 border-sky-300/30",
    warning: "from-amber-500/30 to-amber-600/10 border-amber-300/30",
    danger: "from-rose-500/40 to-rose-600/20 border-rose-300/40",
};
function iconFor(level: LiveAlert["level"]) {
    if (level === "danger")
        return Zap;
    if (level === "warning")
        return AlertTriangle;
    return Info;
}
export function AlertToasts({ alerts, onDismiss }: Props) {
    const tier = useDeviceTier();
    const disableLayout = tier.isMobile || tier.isLowEnd || tier.saveData;
    return (<div className="fixed top-16 md:top-20 right-3 md:right-6 z-50 flex flex-col gap-3 w-[min(92vw,22rem)] pointer-events-none">
      <AnimatePresence initial={false}>
        {alerts.map((a) => {
            const Icon = iconFor(a.level);
            return (<motion.div key={a.id} layout={disableLayout ? undefined : true} initial={{ opacity: 0, x: 80, scale: 0.92 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 80, scale: 0.92 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className={`pointer-events-auto relative rounded-2xl p-4 pr-8 backdrop-blur-md border bg-gradient-to-br ${levelStyles[a.level]} shadow-2xl`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white/15 shrink-0">
                  <Icon className="w-4 h-4"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-white/80 mt-1 leading-relaxed">
                    {a.message}
                  </div>
                  <div className="text-[10px] text-white/50 mt-2">
                    {new Date(a.ts).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <button onClick={() => onDismiss(a.id)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Dismiss">
                <X className="w-3.5 h-3.5"/>
              </button>
              {a.level === "danger" && (<span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-rose-400 animate-pulse"/>)}
            </motion.div>);
        })}
      </AnimatePresence>
    </div>);
}
