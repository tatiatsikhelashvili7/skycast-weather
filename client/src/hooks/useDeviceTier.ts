import { useEffect, useState } from "react";
export interface DeviceTier {
    isMobile: boolean;
    isLowEnd: boolean;
    reduceMotion: boolean;
    saveData: boolean;
}
const INITIAL_TIER: DeviceTier = {
    isMobile: false,
    isLowEnd: false,
    reduceMotion: false,
    saveData: false,
};
function resolve(): DeviceTier {
    if (typeof window === "undefined")
        return INITIAL_TIER;
    const mobile = window.matchMedia("(max-width: 768px)").matches ||
        window.matchMedia("(pointer: coarse)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches;
    const cores = typeof navigator !== "undefined" && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : 8;
    const memory: number | undefined = typeof navigator !== "undefined"
        ? (navigator as Navigator & {
            deviceMemory?: number;
        }).deviceMemory
        : undefined;
    const conn = (typeof navigator !== "undefined"
        ? (navigator as Navigator & {
            connection?: {
                saveData?: boolean;
            };
        })
            .connection
        : undefined);
    const saveData = conn?.saveData === true;
    const lowEnd = cores <= 4 ||
        (typeof memory === "number" && memory <= 4) ||
        saveData;
    return { isMobile: mobile, isLowEnd: lowEnd, reduceMotion, saveData };
}
export function useDeviceTier(): DeviceTier {
    const [tier, setTier] = useState<DeviceTier>(resolve);
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        const mqMobile = window.matchMedia("(max-width: 768px)");
        const mqCoarse = window.matchMedia("(pointer: coarse)");
        const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const conn = (navigator as Navigator & {
            connection?: EventTarget & {
                saveData?: boolean;
            };
        }).connection;
        const update = () => setTier(resolve());
        mqMobile.addEventListener("change", update);
        mqCoarse.addEventListener("change", update);
        mqMotion.addEventListener("change", update);
        conn?.addEventListener?.("change", update);
        return () => {
            mqMobile.removeEventListener("change", update);
            mqCoarse.removeEventListener("change", update);
            mqMotion.removeEventListener("change", update);
            conn?.removeEventListener?.("change", update);
        };
    }, []);
    return tier;
}
