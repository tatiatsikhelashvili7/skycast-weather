import { ReactNode, Children, isValidElement, cloneElement } from "react";
import { motion, Variants } from "framer-motion";
interface Props {
    children: ReactNode;
    delayBetween?: number;
    initialDelay?: number;
    className?: string;
    travel?: number;
    replayKey?: string | number;
}
const containerVariants: Variants = {
    hidden: { opacity: 1 },
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
export function StaggerStack({ children, delayBetween = 0.05, initialDelay = 0, className, travel = 18, replayKey, }: Props) {
    const variants = childVariants(travel);
    return (<motion.div key={replayKey} initial="hidden" animate="show" custom={delayBetween} variants={{
            ...containerVariants,
            show: {
                opacity: 1,
                transition: {
                    staggerChildren: delayBetween,
                    delayChildren: initialDelay,
                },
            },
        }} className={className}>
      {Children.map(children, (child, i) => {
            if (!child)
                return null;
            if (!isValidElement(child)) {
                return (<motion.div key={i} variants={variants}>
              {child}
            </motion.div>);
            }
            if (child.type &&
                typeof child.type === "object" &&
                (child.props as {
                    variants?: unknown;
                }).variants === undefined) {
                return cloneElement(child, {
                    variants,
                } as Partial<typeof child.props>);
            }
            return (<motion.div key={i} variants={variants}>
            {child}
          </motion.div>);
        })}
    </motion.div>);
}
