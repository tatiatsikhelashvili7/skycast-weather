import { useCallback, useEffect, useState } from "react";
export type GeoPermission = "unknown" | "prompt" | "granted" | "denied" | "unsupported";
export type GeoStatus = "idle" | "requesting" | "success" | "error";
export interface GeoPosition {
    lat: number;
    lon: number;
    accuracy: number;
}
interface UseGeolocationReturn {
    permission: GeoPermission;
    status: GeoStatus;
    position: GeoPosition | null;
    error: string | null;
    request: () => void;
}
export function useGeolocation(): UseGeolocationReturn {
    const [permission, setPermission] = useState<GeoPermission>("unknown");
    const [status, setStatus] = useState<GeoStatus>("idle");
    const [position, setPosition] = useState<GeoPosition | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
            setPermission("unsupported");
            return;
        }
        const perms = (navigator as Navigator & {
            permissions?: Permissions;
        })
            .permissions;
        if (!perms?.query) {
            setPermission("prompt");
            return;
        }
        perms
            .query({ name: "geolocation" as PermissionName })
            .then((res: PermissionStatus) => {
            setPermission(res.state as GeoPermission);
            res.onchange = () => setPermission(res.state as GeoPermission);
        })
            .catch(() => setPermission("prompt"));
    }, []);
    const request = useCallback(() => {
        if (!("geolocation" in navigator)) {
            setPermission("unsupported");
            setError("Geolocation is not supported on this device.");
            return;
        }
        setStatus("requesting");
        setError(null);

        const onSuccess = (pos: GeolocationPosition) => {
            setPosition({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
            });
            setStatus("success");
            setPermission("granted");
        };

        const onError = (err: GeolocationPositionError) => {
            if (err.code === err.PERMISSION_DENIED) {
                setStatus("error");
                setPermission("denied");
                setError("Location permission denied.");
                return;
            }

            if (err.code === err.TIMEOUT) {
                navigator.geolocation.getCurrentPosition(onSuccess, (err2) => {
                    setStatus("error");
                    if (err2.code === err2.PERMISSION_DENIED)
                        setPermission("denied");
                    setError(err2.code === err2.TIMEOUT
                        ? "Timeout expired. Turn on GPS/location services and try again."
                        : (err2.message || "Could not get location"));
                }, {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 0,
                });
                return;
            }

            setStatus("error");
            setError(err.message || "Could not get location");
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60 * 1000,
        });
    }, []);
    return { permission, status, position, error, request };
}
