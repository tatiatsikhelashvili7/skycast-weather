import { memo } from "react";
import { motion } from "framer-motion";
import { Sunrise, Sunset, Moon } from "lucide-react";
import type { WeatherResponse } from "../../types/weather";

interface Props {
    weather: WeatherResponse;
}

function formatTime(ts: number, timeZone?: string): string {
    if (!ts)
        return "—";
    try {
        if (timeZone) {
            return new Intl.DateTimeFormat(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                timeZone,
            }).format(new Date(ts * 1000));
        }
    }
    catch {
    }
    return new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds: number): string {
    if (seconds <= 0)
        return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function SunCycleCardInner({ weather }: Props) {
    const sunrise = weather.sys.sunrise;
    const sunset = weather.sys.sunset;
    const tz = weather.sys.timezone;
    const isDaytime = weather.is_day === 1;
    const hasSolarTimes = sunrise > 0 && sunset > 0 && sunset > sunrise;
    const dayLength = hasSolarTimes ? Math.max(0, sunset - sunrise) : 0;
    const progress = isDaytime ? 0.5 : 0.08;
    const cx = 150;
    const cy = 110;
    const r = 100;
    const angleDeg = 180 - progress * 180;
    const angleRad = (angleDeg * Math.PI) / 180;
    const sunX = cx + r * Math.cos(angleRad);
    const sunY = cy - r * Math.sin(angleRad);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto glass rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden"
        >
            <div
                aria-hidden
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-[70%] h-40 pointer-events-none"
                style={{
                    background: isDaytime
                        ? "radial-gradient(ellipse, rgba(251,191,36,0.25), transparent 65%)"
                        : "radial-gradient(ellipse, rgba(129,140,248,0.22), transparent 65%)",
                    filter: "blur(35px)",
                }}
            />

            <div className="relative flex items-center justify-between gap-4 flex-wrap mb-4">
                <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/50">Sun</div>
                    <h4 className="text-display text-xl md:text-2xl font-light tracking-wide mt-1">Today's path</h4>
                </div>
                <div className="text-right">
                    <div className="text-[11px] uppercase tracking-widest text-white/45">From API</div>
                    <div className="text-display text-lg font-light text-white/90">{isDaytime ? "Day" : "Night"}</div>
                </div>
            </div>

            <div className="relative w-full flex justify-center">
                <svg viewBox="0 0 300 140" className="w-full max-w-xl" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#fde68a" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#fb7185" stopOpacity="0.8" />
                        </linearGradient>
                        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
                            <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    <line
                        x1="25"
                        y1={cy + 1}
                        x2="275"
                        y2={cy + 1}
                        stroke="rgba(255,255,255,0.18)"
                        strokeDasharray="3 5"
                        strokeWidth="1"
                    />

                    <motion.path
                        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                        fill="none"
                        stroke="url(#arcGrad)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.6, ease: "easeOut" }}
                    />

                    <motion.path
                        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.65)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: progress }}
                        transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
                    />

                    <circle cx={cx - r} cy={cy} r="4" fill="#fb923c" className="drop-shadow-[0_0_6px_rgba(251,146,60,0.9)]" />
                    <circle cx={cx + r} cy={cy} r="4" fill="#a78bfa" className="drop-shadow-[0_0_6px_rgba(167,139,250,0.9)]" />

                    {isDaytime && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
                            <circle cx={sunX} cy={sunY} r="22" fill="url(#sunGlow)" />
                            <circle cx={sunX} cy={sunY} r="7" fill="#fffbeb" className="drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                        </motion.g>
                    )}

                    {!isDaytime && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
                            <circle cx={cx} cy={cy - 60} r="10" fill="#e0e7ff" className="drop-shadow-[0_0_12px_rgba(199,210,254,0.8)]" />
                            <circle cx={cx + 3} cy={cy - 63} r="9" fill="#1e1b4b" />
                        </motion.g>
                    )}
                </svg>
            </div>

            <div className="relative grid grid-cols-3 gap-2 sm:gap-3 mt-1">
                <div className="text-center min-w-0">
                    <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest text-amber-200/70">
                        <Sunrise className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span className="truncate">Sunrise</span>
                    </div>
                    <div className="text-display text-base sm:text-lg md:text-xl font-light mt-1 tabular-nums">{formatTime(sunrise, tz)}</div>
                </div>

                <div className="text-center border-x border-white/10 px-1 min-w-0">
                    <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest text-white/50">
                        {isDaytime ? (
                            <Sunrise className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        ) : (
                            <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        )}
                        <span className="truncate">Day length</span>
                    </div>
                    <div className="text-display text-base sm:text-lg md:text-xl font-light mt-1 tabular-nums">{formatDuration(dayLength)}</div>
                </div>

                <div className="text-center min-w-0">
                    <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest text-violet-200/70">
                        <Sunset className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span className="truncate">Sunset</span>
                    </div>
                    <div className="text-display text-base sm:text-lg md:text-xl font-light mt-1 tabular-nums">{formatTime(sunset, tz)}</div>
                </div>
            </div>
        </motion.div>
    );
}

export const SunCycleCard = memo(SunCycleCardInner);
