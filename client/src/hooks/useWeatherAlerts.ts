import { useEffect, useRef } from "react";
import type { WeatherResponse } from "../types/weather";
type Bucket = "calm" | "wet" | "snow" | "severe";
function bucketOf(main: string): Bucket {
    const m = main.toLowerCase();
    if (m.includes("thunder") || m.includes("tornado") || m.includes("squall"))
        return "severe";
    if (m.includes("snow"))
        return "snow";
    if (m.includes("rain") || m.includes("drizzle"))
        return "wet";
    return "calm";
}
function messageFor(prev: Bucket, next: Bucket, main: string): string {
    if (next === "severe")
        return `Severe weather alert — ${main.toLowerCase()} conditions incoming.`;
    if (next === "wet" && prev === "calm")
        return `Rain is moving in.`;
    if (next === "snow" && prev !== "snow")
        return `It's starting to snow.`;
    if (next === "calm" && prev !== "calm")
        return `The weather is clearing up.`;
    return `Weather just shifted to ${main.toLowerCase()}.`;
}
export function useWeatherAlerts(current: WeatherResponse | null) {
    const lastBucketRef = useRef<Bucket | null>(null);
    const lastCityRef = useRef<string | null>(null);
    const askedPermissionRef = useRef(false);
    useEffect(() => {
        if (!current)
            return;
        const city = current.name;
        const main = current.weather[0]?.main || "";
        const next = bucketOf(main);
        if (lastCityRef.current !== city) {
            lastCityRef.current = city;
            lastBucketRef.current = next;
            return;
        }
        const prev = lastBucketRef.current;
        lastBucketRef.current = next;
        if (prev === null || prev === next)
            return;
        const message = messageFor(prev, next, main);
        if ("Notification" in window &&
            Notification.permission === "default" &&
            !askedPermissionRef.current) {
            askedPermissionRef.current = true;
            Notification.requestPermission().catch(() => { });
        }
        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(`SkyCast · ${city}`, {
                    body: message,
                    icon: "/favicon.svg",
                    badge: "/favicon.svg",
                    tag: `skycast-${city}`,
                });
            }
            catch {
            }
        }
    }, [current]);
}
