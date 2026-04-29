import { motion, useMotionValue, useSpring } from "framer-motion";
import { ReactNode, useMemo, useRef } from "react";
export function Magnetic({ children, strength = 0.18, radius = 120, className, }: {
    children: ReactNode;
    strength?: number;
    radius?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 240, damping: 26, mass: 0.6 });
    const sy = useSpring(y, { stiffness: 240, damping: 26, mass: 0.6 });
    const handlers = useMemo(() => {
        const onMove = (e: React.MouseEvent) => {
            const el = ref.current;
            if (!el)
                return;
            const r = el.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const d = Math.hypot(dx, dy);
            const t = 1 - Math.min(1, d / radius);
            x.set(dx * strength * t);
            y.set(dy * strength * t);
        };
        const onLeave = () => {
            x.set(0);
            y.set(0);
        };
        return { onMove, onLeave };
    }, [radius, strength, x, y]);
    return (<motion.div ref={ref} className={className} style={{ x: sx, y: sy, transform: "translateZ(0)" }} onMouseMove={handlers.onMove} onMouseLeave={handlers.onLeave}>
      {children}
    </motion.div>);
}
