import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
export type GlassTone = "glass" | "glass-strong" | "glass-active";
export type GlassRadius = "2xl" | "3xl" | "hero";
const RADIUS_CLASS: Record<GlassRadius, string> = {
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    hero: "rounded-[1.75rem] sm:rounded-[2rem]",
};
interface GlassCardBaseProps {
    tone?: GlassTone;
    radius?: GlassRadius;
    animated?: boolean;
    children?: ReactNode;
    className?: string;
}
type DivProps = GlassCardBaseProps & HTMLAttributes<HTMLDivElement>;
type MotionProps = GlassCardBaseProps & HTMLMotionProps<"div"> & {
    animated: true;
};
function glassClassName(tone: GlassTone = "glass", radius: GlassRadius = "3xl", extra = "") {
    return [
        tone,
        RADIUS_CLASS[radius],
        "relative overflow-hidden transition-transform will-change-transform hover:scale-[1.02]",
        extra,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();
}
export const GlassCard = forwardRef<HTMLDivElement, DivProps | MotionProps>(function GlassCard(props, ref) {
    const { tone = "glass", radius = "3xl", animated = false, className, children, ...rest } = props as MotionProps;
    const composed = glassClassName(tone, radius, className ?? "");
    if (animated) {
        return (<motion.div ref={ref} className={composed} whileHover={{ scale: 1.02 }} {...rest}>
          {children}
        </motion.div>);
    }
    return (<div ref={ref} className={composed} {...(rest as HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>);
});
