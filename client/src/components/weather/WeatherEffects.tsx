import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DeviceTier } from "../../hooks/useDeviceTier";
export type WeatherEffectKind = "rain" | "drizzle" | "snow" | "none";
interface Props {
    kind: WeatherEffectKind;
    thunder?: boolean;
    tier?: DeviceTier;
}
export function WeatherEffects({ kind, thunder = false, tier }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
        if (kind === "none")
            return;
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        const isMobile = tier?.isMobile ??
            (window.matchMedia("(max-width: 768px)").matches ||
                window.matchMedia("(pointer: coarse)").matches);
        const isLowEnd = tier?.isLowEnd ?? false;
        const reduceMotion = tier?.reduceMotion ??
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const dprCap = isMobile ? 1 : isLowEnd ? 1 : 1.25;
        const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
        let width = 0;
        let height = 0;
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            width = Math.round(rect.width) || window.innerWidth;
            height = Math.round(rect.height) || window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        type Particle = {
            x: number;
            y: number;
            len: number;
            speed: number;
            drift: number;
            size: number;
            alpha: number;
        };
        const scale = reduceMotion
            ? 0.22
            : isMobile
                ? isLowEnd
                    ? 0.35
                    : 0.42
                : isLowEnd
                    ? 0.5
                    : 0.62;
        const baseCount = kind === "rain" ? 150 : kind === "drizzle" ? 72 : kind === "snow" ? 72 : 0;
        const count = Math.max(12, Math.round(baseCount * scale));
        const particles: Particle[] = Array.from({ length: count }, () => spawn(kind, width, height, true));
        let rafId = 0;
        let running = true;
        const step = () => {
            if (!running)
                return;
            ctx.clearRect(0, 0, width, height);
            if (kind === "rain" || kind === "drizzle") {
                ctx.strokeStyle =
                    kind === "rain" ? "rgba(200,220,255,0.7)" : "rgba(200,220,255,0.35)";
                ctx.lineWidth = kind === "rain" ? 1.7 : 0.8;
                ctx.beginPath();
                for (const p of particles) {
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.drift * 0.4, p.y + p.len);
                    p.y += p.speed;
                    p.x += p.drift;
                    if (p.x > width)
                        p.x = -10;
                    if (p.x < -10)
                        p.x = width;
                    if (p.y > height)
                        Object.assign(p, spawn(kind, width, height, false));
                }
                ctx.stroke();
            }
            else if (kind === "snow") {
                ctx.fillStyle = "rgba(255,255,255,0.85)";
                for (const p of particles) {
                    ctx.globalAlpha = p.alpha;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    p.y += p.speed;
                    p.x += Math.sin((p.y + p.drift) * 0.01) * 0.6;
                    if (p.x > width + 10)
                        p.x = -10;
                    if (p.x < -10)
                        p.x = width + 10;
                    if (p.y > height)
                        Object.assign(p, spawn(kind, width, height, false));
                }
                ctx.globalAlpha = 1;
            }
            rafId = requestAnimationFrame(step);
        };
        const onVisibility = () => {
            if (document.hidden) {
                running = false;
                cancelAnimationFrame(rafId);
            }
            else if (!running) {
                running = true;
                rafId = requestAnimationFrame(step);
            }
        };
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("orientationchange", resize);
        rafId = requestAnimationFrame(step);
        return () => {
            running = false;
            cancelAnimationFrame(rafId);
            ro.disconnect();
            window.removeEventListener("orientationchange", resize);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [kind, tier?.isMobile, tier?.isLowEnd, tier?.reduceMotion]);
    return (<>
      {kind !== "none" && (<canvas ref={canvasRef} aria-hidden className="absolute inset-0 w-full h-full pointer-events-none"/>)}
      {thunder && !tier?.reduceMotion && <ThunderFlash />}
    </>);
}
function spawn(kind: WeatherEffectKind, width: number, height: number, initial: boolean) {
    const y = initial ? Math.random() * height : -20 - Math.random() * 120;
    if (kind === "rain") {
        return {
            x: Math.random() * width,
            y,
            len: 22 + Math.random() * 26,
            speed: 13 + Math.random() * 11,
            drift: 1.2 + Math.random() * 0.8,
            size: 0,
            alpha: 0.75,
        };
    }
    if (kind === "drizzle") {
        return {
            x: Math.random() * width,
            y,
            len: 6 + Math.random() * 8,
            speed: 3.5 + Math.random() * 2.5,
            drift: 0.4 + Math.random() * 0.6,
            size: 0,
            alpha: 0.4,
        };
    }
    return {
        x: Math.random() * width,
        y,
        len: 0,
        speed: 0.6 + Math.random() * 1.4,
        drift: Math.random() * 200,
        size: 1 + Math.random() * 2.5,
        alpha: 0.5 + Math.random() * 0.5,
    };
}
function ThunderFlash() {
    const [strikeId, setStrikeId] = useState(0);
    useEffect(() => {
        let cancelled = false;
        const fire = () => {
            if (cancelled)
                return;
            setStrikeId((n) => n + 1);
            const next = 10000 + Math.random() * 5000;
            timer = window.setTimeout(fire, next);
        };
        let timer = window.setTimeout(fire, 4000 + Math.random() * 3000);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, []);
    return (<AnimatePresence>
      <motion.div key={strikeId} aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "white", mixBlendMode: "screen" }} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.85, 0, 0.45, 0] }} transition={{ duration: 0.9, times: [0, 0.12, 0.35, 0.55, 1] }}/>
    </AnimatePresence>);
}
