import { useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, useSpring, useTransform, } from "framer-motion";
import { Check, Copy, Share2, Users } from "lucide-react";
interface Props {
    code: string;
    members: number;
    onCopy?: (url: string) => void;
}
export function RoomCodeCard({ code, members, onCopy }: Props) {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const px = useMotionValue(0.5);
    const py = useMotionValue(0.5);
    const rotateX = useSpring(useTransform(py, [0, 1], [8, -8]), {
        stiffness: 200,
        damping: 22,
    });
    const rotateY = useSpring(useTransform(px, [0, 1], [-10, 10]), {
        stiffness: 200,
        damping: 22,
    });
    const sheenX = useTransform(px, [0, 1], ["0%", "100%"]);
    const sheenY = useTransform(py, [0, 1], ["0%", "100%"]);
    const sheenBg = useMotionTemplate `radial-gradient(420px circle at ${sheenX} ${sheenY}, rgba(165,180,252,0.22), transparent 60%)`;
    const [copied, setCopied] = useState(false);
    const [ripple, setRipple] = useState<{
        x: number;
        y: number;
        id: number;
    } | null>(null);
    function handleMove(e: React.PointerEvent<HTMLDivElement>) {
        const el = cardRef.current;
        if (!el)
            return;
        const rect = el.getBoundingClientRect();
        px.set((e.clientX - rect.left) / rect.width);
        py.set((e.clientY - rect.top) / rect.height);
    }
    function handleLeave() {
        px.set(0.5);
        py.set(0.5);
    }
    function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setRipple({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            id: Date.now(),
        });
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
        navigator.clipboard.writeText(shareUrl).catch(() => {
            navigator.clipboard.writeText(code).catch(() => { });
        });
        onCopy?.(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
        window.setTimeout(() => setRipple(null), 700);
    }
    const letters = code.split("");
    return (<div style={{ perspective: 1200 }} className="w-full">
      <motion.div ref={cardRef} onPointerMove={handleMove} onPointerLeave={handleLeave} style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
        }} className="relative mx-auto w-full max-w-md rounded-3xl p-5 sm:p-6 md:p-7 glass-active overflow-hidden select-none">
        
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl opacity-80" style={{ background: sheenBg }}/>

        
        <div aria-hidden className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full" style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.28), transparent 65%)",
            filter: "blur(40px)",
        }}/>
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -right-10 w-72 h-72 rounded-full" style={{
            background: "radial-gradient(circle, rgba(34,211,238,0.22), transparent 65%)",
            filter: "blur(40px)",
        }}/>

        
        <div className="relative flex items-center justify-between" style={{ transform: "translateZ(20px)" }}>
          <div className="text-[11px] uppercase tracking-[0.35em] text-white/55">
            Room code
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/80">
            <Users className="w-3 h-3"/>
            {members} {members === 1 ? "person" : "people"}
          </div>
        </div>

        
        <div className="relative mt-5 flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3" style={{ transform: "translateZ(50px)" }}>
          {letters.map((ch, i) => (<motion.div key={`${code}-${i}`} initial={{ opacity: 0, y: 10, rotateX: -40 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{
                delay: 0.06 * i,
                type: "spring",
                stiffness: 260,
                damping: 22,
            }} className="w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-light tracking-widest" style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 8px 24px -8px rgba(2,6,23,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}>
              <span className="text-display" style={{
                background: "linear-gradient(180deg, #ffffff 0%, #dbeafe 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 16px rgba(165,180,252,0.4)",
            }}>
                {ch}
              </span>
            </motion.div>))}
        </div>

        <p className="relative text-center text-xs text-white/55 mt-4" style={{ transform: "translateZ(30px)" }}>
          Share this code — anyone who joins shows up live on the map.
        </p>

        
        <div className="relative mt-5 flex justify-center" style={{ transform: "translateZ(40px)" }}>
          <motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }} onClick={handleCopy} className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium text-white border border-white/15 overflow-hidden" style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.85), rgba(34,211,238,0.8))",
            boxShadow: "0 10px 30px -10px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}>
            
            <AnimatePresence>
              {ripple && (<motion.span key={ripple.id} initial={{ scale: 0, opacity: 0.55 }} animate={{ scale: 18, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} style={{
                position: "absolute",
                left: ripple.x - 8,
                top: ripple.y - 8,
                width: 16,
                height: 16,
                borderRadius: 9999,
                background: "radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
                pointerEvents: "none",
            }}/>)}
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              {copied ? (<motion.span key="ok" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="inline-flex items-center gap-2 relative">
                  <Check className="w-4 h-4 text-emerald-200"/>
                  Copied!
                </motion.span>) : (<motion.span key="copy" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="inline-flex items-center gap-2 relative">
                  <Copy className="w-4 h-4"/>
                  Click to copy invite
                </motion.span>)}
            </AnimatePresence>
          </motion.button>
        </div>

        
        <div className="relative mt-3 flex justify-center text-[11px] text-white/45" style={{ transform: "translateZ(20px)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Share2 className="w-3 h-3"/> or just say "join room{" "}
            <span className="text-white/80 tracking-widest">{code}</span>"
          </span>
        </div>
      </motion.div>
    </div>);
}
