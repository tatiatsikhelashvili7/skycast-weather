import { ReactNode, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useDeviceTier } from "../../hooks/useDeviceTier";
export function FadeOutOnScroll({ children }: {
    children: ReactNode;
}) {
    const tier = useDeviceTier();
    if (tier.isMobile || tier.isLowEnd || tier.saveData || tier.reduceMotion) {
        return <div>{children}</div>;
    }
    const ref = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });
    const opacity = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [0.6, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 0.92]);
    const y = useTransform(scrollYProgress, [0, 0.5, 1], [30, 0, -80]);
    return (<motion.div ref={ref} style={{ opacity, scale, y }}>
      {children}
    </motion.div>);
}
export function SlideUpOnScroll({ children, stiffness = 0.6, }: {
    children: ReactNode;
    stiffness?: number;
}) {
    const tier = useDeviceTier();
    if (tier.isMobile || tier.isLowEnd || tier.saveData || tier.reduceMotion) {
        return <div>{children}</div>;
    }
    const ref = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "center center"],
    });
    const y = useTransform(scrollYProgress, [0, 1], [120 * stiffness, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.85, 1]);
    const scale = useTransform(scrollYProgress, [0, 1], [0.96, 1]);
    return (<motion.div ref={ref} style={{ y, opacity, scale }}>
      {children}
    </motion.div>);
}
