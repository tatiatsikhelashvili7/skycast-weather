import { motion } from "framer-motion";

/**
 * High-end skeleton screens — their silhouettes intentionally mirror the
 * real components they replace (Hero, Time Slider, Stats Grid, Forecast
 * Tabs, Friends Map), so the transition from skeleton → content feels
 * like a crossfade instead of a redraw.
 *
 * Uses the `.skeleton` class (shimmer keyframes are defined in index.css).
 */
export function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-5xl mx-auto px-1 space-y-12"
    >
      {/* Hero */}
      <div className="glass-strong rounded-[2rem] p-8 md:p-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="skeleton h-5 w-40 rounded-full" />
            <div className="skeleton h-4 w-4 rounded-full" />
          </div>
          <div className="skeleton h-6 w-28 rounded-full" />
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
          <div className="skeleton h-36 w-36 rounded-3xl" />
          <div className="flex-1 w-full space-y-4">
            <div className="skeleton h-20 md:h-24 w-56 rounded-3xl" />
            <div className="skeleton h-4 w-64 rounded-full" />
            <div className="flex gap-4">
              <div className="skeleton h-3 w-14 rounded-full" />
              <div className="skeleton h-3 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <div className="skeleton h-3 w-28 rounded-full mb-2" />
        <div className="skeleton h-7 w-44 rounded-xl mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4">
              <div className="skeleton h-3 w-16 rounded-full mb-3" />
              <div className="skeleton h-7 w-24 rounded-xl mb-2" />
              <div className="skeleton h-3 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Sun cycle */}
      <div>
        <div className="skeleton h-3 w-16 rounded-full mb-2" />
        <div className="skeleton h-7 w-56 rounded-xl mb-4" />
        <div className="glass rounded-3xl p-6 flex items-center gap-6">
          <div className="skeleton h-24 w-24 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-4 w-40 rounded-full" />
            <div className="skeleton h-3 w-64 rounded-full" />
            <div className="skeleton h-3 w-48 rounded-full" />
          </div>
        </div>
      </div>

      {/* Time slider */}
      <div>
        <div className="skeleton h-3 w-16 rounded-full mb-2" />
        <div className="skeleton h-7 w-52 rounded-xl mb-4" />
        <div className="glass rounded-3xl p-5 md:p-6 space-y-4">
          <div className="skeleton h-20 w-44 rounded-2xl" />
          <div className="skeleton h-4 w-60 rounded-full" />
          <div className="flex gap-2 overflow-hidden pt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[78px] h-[104px] skeleton rounded-2xl"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Forecast tabs */}
      <div>
        <div className="skeleton h-3 w-20 rounded-full mb-2" />
        <div className="skeleton h-7 w-48 rounded-xl mb-4" />
        <div className="flex gap-2 mb-3">
          <div className="skeleton h-9 w-20 rounded-2xl" />
          <div className="skeleton h-9 w-20 rounded-2xl" />
        </div>
        <div className="glass rounded-3xl p-4 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="grid items-center gap-3 py-2.5"
              style={{
                gridTemplateColumns:
                  "minmax(88px,1fr) 44px 1fr minmax(110px,1fr) 64px",
              }}
            >
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-16 rounded-full" />
                <div className="skeleton h-2.5 w-12 rounded-full" />
              </div>
              <div className="skeleton h-7 w-7 rounded-full mx-auto" />
              <div className="skeleton h-3 w-28 rounded-full" />
              <div className="skeleton h-2 w-full rounded-full" />
              <div className="skeleton h-3 w-12 rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
