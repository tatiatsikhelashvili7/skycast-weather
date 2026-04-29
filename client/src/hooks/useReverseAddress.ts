import { useEffect, useMemo, useState } from "react";
type ReverseAddress = {
    displayName: string;
    short: string;
    precision: number;
};
type State = {
    status: "idle" | "loading";
    data: null;
    error: null;
} | {
    status: "success";
    data: ReverseAddress;
    error: null;
} | {
    status: "error";
    data: null;
    error: string;
};
const cache = new Map<string, ReverseAddress>();
export function useReverseAddress({ lat, lon, precision = 3, enabled = true, }: {
    lat: number;
    lon: number;
    precision?: number;
    enabled?: boolean;
}): State {
    const key = useMemo(() => `${lat.toFixed(precision)},${lon.toFixed(precision)}:${precision}`, [lat, lon, precision]);
    const [state, setState] = useState<State>(() => {
        const hit = cache.get(key);
        return hit
            ? { status: "success", data: hit, error: null }
            : { status: enabled ? "loading" : "idle", data: null, error: null };
    });
    useEffect(() => {
        if (!enabled) {
            setState({ status: "idle", data: null, error: null });
            return;
        }
        const hit = cache.get(key);
        if (hit) {
            setState({ status: "success", data: hit, error: null });
            return;
        }
        let cancelled = false;
        setState({ status: "loading", data: null, error: null });
        fetch(`/api/geo/address?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&precision=${precision}`)
            .then(async (r) => {
            if (!r.ok)
                throw new Error((await r.json()).error || "Failed to resolve address");
            return (await r.json()) as ReverseAddress;
        })
            .then((data) => {
            if (cancelled)
                return;
            cache.set(key, data);
            setState({ status: "success", data, error: null });
        })
            .catch((e: unknown) => {
            if (cancelled)
                return;
            setState({ status: "error", data: null, error: e instanceof Error ? e.message : "Failed" });
        });
        return () => {
            cancelled = true;
        };
    }, [enabled, key, lat, lon, precision]);
    return state;
}
