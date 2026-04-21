import { ReactNode, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * `FadeOutOnScroll`
 * Wraps a section so that as the user scrolls past it, the section fades
 * out + scales down + drifts upward. Perfect for the "Sky" intro section
 * that should gently hand over to the Forecast / Trend cards.
 */
export function FadeOutOnScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    // from "section top hits viewport bottom" → "section bottom hits viewport top"
    offset: ["start end", "end start"],
  });
  // Fully visible through the middle 40% of the scroll range, then fades.
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.35, 0.7, 1],
    [0.6, 1, 1, 0]
  );
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, 0.92]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [30, 0, -80]);

  return (
    <motion.div ref={ref} style={{ opacity, scale, y }}>
      {children}
    </motion.div>
  );
}

/**
 * `SlideUpOnScroll`
 * Opposite direction: element drifts up from below while it enters the
 * viewport and "locks" in place once it reaches the centre. Used for the
 * Forecast and Trend cards.
 */
export function SlideUpOnScroll({
  children,
  stiffness = 0.6,
}: {
  children: ReactNode;
  /** 0..1 — how aggressively the element travels. 0.6 ≈ subtle. */
  stiffness?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [120 * stiffness, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.85, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.96, 1]);

  return (
    <motion.div ref={ref} style={{ y, opacity, scale }}>
      {children}
    </motion.div>
  );
}
