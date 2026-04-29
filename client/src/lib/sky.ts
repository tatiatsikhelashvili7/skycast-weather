export interface SkyTint {
    topColor: string;
    bottomColor: string;
    nightiness: number;
    sunsetness: number;
    label: string;
}
type RGB = [
    number,
    number,
    number
];
interface Keyframe {
    h: number;
    top: RGB;
    bottom: RGB;
    night: number;
    sunset: number;
    label: string;
}
const KEYFRAMES: Keyframe[] = [
    { h: 0, top: [8, 10, 30], bottom: [2, 4, 18], night: 1, sunset: 0, label: "Night" },
    { h: 5, top: [12, 16, 44], bottom: [4, 7, 26], night: 1, sunset: 0, label: "Night" },
    { h: 10, top: [34, 120, 180], bottom: [20, 88, 132], night: 0, sunset: 0, label: "Day" },
    { h: 17, top: [34, 120, 180], bottom: [20, 88, 132], night: 0, sunset: 0, label: "Day" },
    { h: 20, top: [66, 34, 128], bottom: [188, 74, 62], night: 0.55, sunset: 1, label: "Golden Hour" },
    { h: 24, top: [8, 10, 30], bottom: [2, 4, 18], night: 1, sunset: 0, label: "Night" },
];
function clamp01(x: number): number {
    return x < 0 ? 0 : x > 1 ? 1 : x;
}
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
function lerpRGB(a: RGB, b: RGB, t: number): RGB {
    return [
        Math.round(lerp(a[0], b[0], t)),
        Math.round(lerp(a[1], b[1], t)),
        Math.round(lerp(a[2], b[2], t)),
    ];
}
function rgb(c: RGB): string {
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
export function skyTintForHour(hour: number): SkyTint {
    const h = ((hour % 24) + 24) % 24;
    for (let i = 0; i < KEYFRAMES.length - 1; i++) {
        const a = KEYFRAMES[i];
        const b = KEYFRAMES[i + 1];
        if (h >= a.h && h <= b.h) {
            const t = (h - a.h) / Math.max(0.0001, b.h - a.h);
            return {
                topColor: rgb(lerpRGB(a.top, b.top, t)),
                bottomColor: rgb(lerpRGB(a.bottom, b.bottom, t)),
                nightiness: clamp01(lerp(a.night, b.night, t)),
                sunsetness: clamp01(lerp(a.sunset, b.sunset, t)),
                label: t < 0.5 ? a.label : b.label,
            };
        }
    }
    const k = KEYFRAMES[0];
    return {
        topColor: rgb(k.top),
        bottomColor: rgb(k.bottom),
        nightiness: k.night,
        sunsetness: k.sunset,
        label: k.label,
    };
}
export function localHourFor(dt: number, sunrise?: number, sunset?: number): number {
    if (!sunrise || !sunset) {
        const d = new Date(dt * 1000);
        return d.getHours() + d.getMinutes() / 60;
    }
    const solarNoonSecondsPastMidnightUtc = ((sunrise + sunset) / 2) % 86400;
    const offsetSec = 12 * 3600 - solarNoonSecondsPastMidnightUtc;
    const localUnix = dt + offsetSec;
    const secondsPastMidnight = ((localUnix % 86400) + 86400) % 86400;
    return secondsPastMidnight / 3600;
}
