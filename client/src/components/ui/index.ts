/**
 * Barrel export for the `/components/ui` primitives.
 *
 * These are the shared, zero-dependency building blocks that the rest of
 * the app composes into feature cards. Adding a new primitive? Export it
 * here so consumers can `import { X, Y } from "./components/ui"` without
 * reaching into individual files.
 */

export { GlassCard } from "./GlassCard";
export type { GlassTone, GlassRadius } from "./GlassCard";
