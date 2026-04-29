import { memo } from "react";
import type { WeatherResponse } from "../../types/weather";
import { CelestialBody } from "./CelestialBody";
import { WeatherEffects } from "./WeatherEffects";
import { useDeviceTier } from "../../hooks/useDeviceTier";

type Category = "clear" | "cloudy" | "rain" | "thunder";

function classify(code: number | undefined): Category {
    const c = code ?? 0;
    if (c === 0 || c === 1)
        return "clear";
    if (c === 95 || c === 96 || c === 99)
        return "thunder";
    if (
        c === 2 || c === 3 ||
        c === 45 || c === 48
    )
        return "cloudy";
    if (
        c === 51 || c === 53 || c === 55 || c === 56 || c === 57 ||
        c === 61 || c === 63 || c === 65 || c === 66 || c === 67 ||
        c === 80 || c === 81 || c === 82
    )
        return "rain";
    if (c >= 71 && c <= 77)
        return "cloudy";
    if (c === 85 || c === 86)
        return "cloudy";
    return "cloudy";
}

export const WeatherAtmosphere = memo(function WeatherAtmosphere({
    current,
    isDay,
}: {
    current?: WeatherResponse | null;
    isDay?: boolean;
}) {
    const tier = useDeviceTier();
    const derivedIsDay = isDay ?? current?.is_day === 1;
    const wmoCode =
        typeof current?.weather_code === "number"
            ? current.weather_code
            : typeof (current?.weather?.[0] as any)?.id === "number"
                ? (current!.weather![0] as any).id
                : undefined;

    const category = classify(wmoCode);
    const isClear = category === "clear";
    const isNight = !derivedIsDay;
    const isRainOnly = category === "rain" || category === "thunder";

    const sunMoonOpacity = isRainOnly ? 0 : derivedIsDay ? (isClear ? 1 : 0.85) : (isClear ? 0.75 : 0.6);
    const starsOpacity = isNight ? (isClear ? 0.75 : 0.35) : 0;

    const gradientStyle = {
        backgroundImage: "linear-gradient(to bottom, var(--sky-top) 0%, var(--sky-bottom) 100%)",
    };

    const cloudsOpacity = isRainOnly ? 0 : isClear ? 0 : 1;
    const effectKind = category === "rain" || category === "thunder" ? "rain" : "none";
    const showThunder = category === "thunder";

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-[-20]" aria-hidden>
            <div
                className="absolute inset-0"
                style={{
                    ...gradientStyle,
                    transition: "opacity 700ms ease",
                    opacity: 1,
                }}
            />

            {isNight && (
                <div
                    className="absolute inset-0"
                    style={{
                        opacity: starsOpacity,
                        transition: "opacity 600ms ease",
                        backgroundImage: [
                            "radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.9), transparent 60%)",
                            "radial-gradient(1px 1px at 28% 42%, rgba(255,255,255,0.6), transparent 60%)",
                            "radial-gradient(1px 1px at 44% 12%, rgba(255,255,255,0.8), transparent 60%)",
                            "radial-gradient(1px 1px at 63% 58%, rgba(255,255,255,0.45), transparent 60%)",
                            "radial-gradient(1.5px 1.5px at 78% 26%, rgba(255,255,255,0.75), transparent 60%)",
                            "radial-gradient(1px 1px at 88% 72%, rgba(255,255,255,0.55), transparent 60%)",
                            "radial-gradient(1px 1px at 18% 78%, rgba(255,255,255,0.4), transparent 60%)",
                            "radial-gradient(1.5px 1.5px at 52% 88%, rgba(255,255,255,0.5), transparent 60%)",
                            "radial-gradient(1px 1px at 35% 65%, rgba(255,255,255,0.65), transparent 60%)",
                            "radial-gradient(1px 1px at 92% 40%, rgba(255,255,255,0.55), transparent 60%)",
                        ].join(", "),
                    }}
                />
            )}

            <div style={{ opacity: sunMoonOpacity, transition: "opacity 550ms ease" }}>
                <CelestialBody isDay={derivedIsDay ? 1 : 0} />
            </div>

            <div
                className="absolute inset-0"
                style={{
                    opacity: cloudsOpacity,
                    transition: "opacity 550ms ease",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            >
                <svg
                    className="absolute"
                    style={{
                        top: "15%",
                        left: "-140px",
                        willChange: "transform",
                        animation: "cloud-drift 60s linear infinite",
                    }}
                    width="140"
                    height="48"
                    viewBox="0 0 140 48"
                    fill="none"
                >
                    <ellipse cx="70" cy="36" rx="65" ry="16" fill="rgba(255,255,255,0.12)" />
                    <ellipse cx="52" cy="26" rx="34" ry="20" fill="rgba(255,255,255,0.10)" />
                    <ellipse cx="90" cy="28" rx="28" ry="16" fill="rgba(255,255,255,0.09)" />
                </svg>

                <svg
                    className="absolute"
                    style={{
                        top: "40%",
                        left: "-110px",
                        willChange: "transform",
                        animation: "cloud-drift 80s linear 22s infinite",
                    }}
                    width="110"
                    height="40"
                    viewBox="0 0 110 40"
                    fill="none"
                >
                    <ellipse cx="55" cy="30" rx="50" ry="13" fill="rgba(255,255,255,0.09)" />
                    <ellipse cx="40" cy="20" rx="28" ry="17" fill="rgba(255,255,255,0.08)" />
                    <ellipse cx="76" cy="22" rx="23" ry="13" fill="rgba(255,255,255,0.07)" />
                </svg>

                <svg
                    className="absolute"
                    style={{
                        top: "68%",
                        left: "-90px",
                        willChange: "transform",
                        animation: "cloud-drift 70s linear 12s infinite",
                    }}
                    width="100"
                    height="34"
                    viewBox="0 0 100 34"
                    fill="none"
                >
                    <ellipse cx="50" cy="26" rx="44" ry="11" fill="rgba(255,255,255,0.08)" />
                    <ellipse cx="36" cy="18" rx="24" ry="14" fill="rgba(255,255,255,0.07)" />
                    <ellipse cx="68" cy="19" rx="20" ry="11" fill="rgba(255,255,255,0.06)" />
                </svg>
            </div>

            <div className="absolute inset-0" style={{ zIndex: 2 }}>
                <WeatherEffects kind={effectKind} thunder={showThunder} tier={tier} />
            </div>
        </div>
    );
});
