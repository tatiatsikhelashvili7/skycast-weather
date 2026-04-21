import { motion } from "framer-motion";

/**
 * Soft anamorphic lens flare — the kind you'd see in a DSLR shot with
 * the sun just outside the frame. Four stacked gradients: hot core,
 * warm halo, horizontal streak, and two diffuse ghosts that drift
 * very slowly. Everything uses `mix-blend-mode: screen` so it brightens
 * the scene without obscuring any UI behind it.
 *
 * Rendered by `DynamicBackground` whenever the active theme is
 * "clear-day".
 */
export function LensFlare() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0.55 }}
        animate={{ opacity: [0.55, 0.8, 0.55] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute"
        style={{
          top: "-14%",
          right: "-8%",
          width: "48vw",
          height: "48vw",
          maxWidth: "720px",
          maxHeight: "720px",
          mixBlendMode: "screen",
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.75) 0%, rgba(255,220,150,0.45) 12%, rgba(253,184,77,0.25) 26%, rgba(253,184,77,0.08) 45%, transparent 70%)",
          filter: "blur(12px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute"
        style={{
          top: "14%",
          right: "-20%",
          width: "90vw",
          height: "3px",
          mixBlendMode: "screen",
          background:
            "linear-gradient(to left, rgba(255,240,200,0.9), rgba(255,200,120,0.35) 30%, transparent 70%)",
          filter: "blur(2px)",
          transform: "rotate(-4deg)",
        }}
      />

      <motion.div
        animate={{ x: ["-2%", "2%", "-2%"], y: ["0%", "-1.5%", "0%"] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute"
        style={{
          top: "32%",
          right: "18%",
          width: "14vw",
          height: "14vw",
          maxWidth: "220px",
          maxHeight: "220px",
          mixBlendMode: "screen",
          background:
            "radial-gradient(circle, rgba(147,197,253,0.35) 0%, rgba(147,197,253,0.08) 45%, transparent 70%)",
          filter: "blur(14px)",
        }}
      />

      <motion.div
        animate={{ x: ["2%", "-2%", "2%"], y: ["0%", "1%", "0%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute"
        style={{
          bottom: "20%",
          left: "18%",
          width: "9vw",
          height: "9vw",
          maxWidth: "160px",
          maxHeight: "160px",
          mixBlendMode: "screen",
          background:
            "radial-gradient(circle, rgba(253,224,71,0.3) 0%, transparent 70%)",
          filter: "blur(18px)",
        }}
      />
    </div>
  );
}
