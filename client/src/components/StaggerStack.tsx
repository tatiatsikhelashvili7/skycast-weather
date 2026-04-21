import { ReactNode, Children, isValidElement, cloneElement } from "react";
import { motion, Variants } from "framer-motion";

/**
 * `StaggerStack` — wrap any vertical sequence of sections and they'll
 * slide up one after another with a short, springy delay.
 *
 * The parent uses `variants`/`initial="hidden"`/`animate="show"` so each
 * child only needs to inherit. We don't *require* children to be motion
 * elements; we wrap them transparently.
 *
 * Timing defaults chosen to feel like an iOS sheet cascade:
 *   • delayBetween = 0.05s
 *   • travel = 18px
 *   • spring stiffness=260, damping=26
 */
interface Props {
  children: ReactNode;
  delayBetween?: number;
  initialDelay?: number;
  className?: string;
  travel?: number;
  /**
   * Retrigger the stagger when this key changes (e.g. new city searched).
   * Framer Motion will re-run enter animations.
   */
  replayKey?: string | number;
}

const containerVariants: Variants = {
  hidden: { opacity: 1 }, // keep container visible so child staggers are seen
  show: (stagger: number) => ({
    opacity: 1,
    transition: {
      staggerChildren: stagger,
      delayChildren: 0,
    },
  }),
};

const childVariants = (travel: number): Variants => ({
  hidden: { opacity: 0, y: travel, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
      mass: 0.9,
    },
  },
});

export function StaggerStack({
  children,
  delayBetween = 0.05,
  initialDelay = 0,
  className,
  travel = 18,
  replayKey,
}: Props) {
  const variants = childVariants(travel);

  return (
    <motion.div
      key={replayKey}
      initial="hidden"
      animate="show"
      custom={delayBetween}
      variants={{
        ...containerVariants,
        show: {
          opacity: 1,
          transition: {
            staggerChildren: delayBetween,
            delayChildren: initialDelay,
          },
        },
      }}
      className={className}
    >
      {Children.map(children, (child, i) => {
        if (!child) return null;
        // Transparently wrap non-motion children so they animate uniformly.
        if (!isValidElement(child)) {
          return (
            <motion.div key={i} variants={variants}>
              {child}
            </motion.div>
          );
        }
        // Already a motion element? Inject variants if it doesn't have them.
        if (
          child.type &&
          typeof child.type === "object" &&
          (child.props as { variants?: unknown }).variants === undefined
        ) {
          return cloneElement(child, {
            variants,
          } as Partial<typeof child.props>);
        }
        return (
          <motion.div key={i} variants={variants}>
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
