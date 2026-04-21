import { useCallback, useEffect, useState } from "react";

export type GeoPermission =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported";

export type GeoStatus =
  | "idle"
  | "requesting"
  | "success"
  | "error";

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

  // Probe initial permission state (where supported)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setPermission("unsupported");
      return;
    }
    const perms = (navigator as Navigator & { permissions?: Permissions })
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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStatus("success");
        setPermission("granted");
      },
      (err) => {
        setStatus("error");
        setError(err.message || "Could not get location");
        if (err.code === err.PERMISSION_DENIED) setPermission("denied");
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 5 * 60 * 1000, // OK to reuse a cached fix <5 min old
      }
    );
  }, []);

  return { permission, status, position, error, request };
}
