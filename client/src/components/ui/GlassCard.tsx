import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

/**
 * Visual surface tiers available on a `<GlassCard>`.
 *  • `glass`         — default frosted card used across the dashboard.
 *  • `glass-strong`  — higher contrast, used for hero / modal surfaces.
 *  • `glass-active`  — elevated, slightly brighter — used while a card is
 *                      being interacted with (e.g. room code tilt card).
 */
export type GlassTone = "glass" | "glass-strong" | "glass-active";

/**
 * Corner rounding presets. Maps to the existing Tailwind radius tokens so
 * the look matches the current design language exactly.
 */
export type GlassRadius = "2xl" | "3xl" | "hero";

const RADIUS_CLASS: Record<GlassRadius, string> = {
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  hero: "rounded-[1.75rem] sm:rounded-[2rem]",
};

interface GlassCardBaseProps {
  /** Visual tier (default: `glass`). */
  tone?: GlassTone;
  /** Corner radius preset (default: `3xl`). */
  radius?: GlassRadius;
  /**
   * If true, wrap the output in `framer-motion`'s `motion.div` and enable
   * passing animation props (`initial`, `animate`, etc). Defaults to `false`
   * so the component stays cheap to render when animations aren't needed.
   */
  animated?: boolean;
  children?: ReactNode;
  className?: string;
}

type DivProps = GlassCardBaseProps & HTMLAttributes<HTMLDivElement>;
type MotionProps = GlassCardBaseProps & HTMLMotionProps<"div"> & { animated: true };

/**
 * Shared class-name builder. Split out so Storybook / tests can assert on
 * the exact Tailwind token combination without inspecting the DOM.
 */
function glassClassName(
  tone: GlassTone = "glass",
  radius: GlassRadius = "3xl",
  extra = ""
) {
  return [tone, RADIUS_CLASS[radius], "relative overflow-hidden", extra]
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * `<GlassCard>` — the single source of truth for SkyCast's signature
 * frosted-glass surface.
 *
 * Historically the class stack (`glass rounded-3xl p-6 …`) was copy-pasted
 * across ~15 components; centralising it here means any future visual
 * tweak (e.g. bumping blur radius for a premium tier) happens once.
 *
 * The component forwards a ref so it composes cleanly with Framer Motion's
 * `layout` prop and IntersectionObserver-based hooks.
 *
 * Usage:
 *   <GlassCard tone="glass-strong" radius="hero" className="p-6 md:p-8">…</GlassCard>
 *   <GlassCard animated initial={{ opacity: 0 }} animate={{ opacity: 1 }}>…</GlassCard>
 */
export const GlassCard = forwardRef<HTMLDivElement, DivProps | MotionProps>(
  function GlassCard(props, ref) {
    const {
      tone = "glass",
      radius = "3xl",
      animated = false,
      className,
      children,
      ...rest
    } = props as MotionProps;

    const composed = glassClassName(tone, radius, className ?? "");

    if (animated) {
      return (
        <motion.div ref={ref} className={composed} {...rest}>
          {children}
        </motion.div>
      );
    }
    return (
      <div
        ref={ref}
        className={composed}
        {...(rest as HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  }
);
