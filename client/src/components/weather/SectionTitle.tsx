import { memo } from "react";
import { motion } from "framer-motion";
export const SectionTitle = memo(function SectionTitle({ kicker, title, staticReveal = false, }: {
    kicker: string;
    title: string;
    staticReveal?: boolean;
}) {
    if (staticReveal) {
        return (<div className="max-w-5xl mx-auto mb-5 px-1">
        <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)]">
          {kicker}
        </div>
        <h3 className="text-display text-2xl md:text-3xl font-semibold mt-1 text-[var(--text-heading)]">
          {title}
        </h3>
      </div>);
    }
    return (<motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.35 }} className="max-w-5xl mx-auto mb-5 px-1">
      <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)]">
        {kicker}
      </div>
      <h3 className="text-display text-2xl md:text-3xl font-semibold mt-1 text-[var(--text-heading)]">
        {title}
      </h3>
    </motion.div>);
});
