import { motion } from "framer-motion";
import { Navigation } from "lucide-react";
import { degreesToCompass } from "../../lib/weather";
interface Props {
    deg: number;
    speedLabel: string;
    size?: number;
}
export function WindCompass({ deg, speedLabel, size = 96 }: Props) {
    const rose = ["N", "E", "S", "W"];
    return (<motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className="relative flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04]" style={{ width: size, height: size }}>
      {rose.map((label, i) => {
            const angle = i * 90;
            return (<div key={label} className="absolute text-[10px] font-semibold text-white/50" style={{
                    transform: `rotate(${angle}deg) translateY(-${size / 2 - 10}px) rotate(-${angle}deg)`,
                }}>
            {label}
          </div>);
        })}

      
      <motion.div animate={{ rotate: deg + 180 }} transition={{ type: "spring", stiffness: 60, damping: 14 }} className="absolute inset-0 flex items-center justify-center">
        <motion.div animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
          <Navigation className="w-6 h-6 text-sky-300 drop-shadow-[0_0_8px_rgba(125,211,252,0.55)]" fill="currentColor" strokeWidth={1.25}/>
        </motion.div>
      </motion.div>
      <span className="sr-only">
        {speedLabel} from {degreesToCompass(deg)}
      </span>
    </motion.div>);
}
