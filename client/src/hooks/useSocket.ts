import { useEffect, useRef, useState } from "react";
import { createSocket, type Socket } from "../services/socket";
import { ALERT_AUTO_DISMISS_MS } from "../utils/constants";

export interface LiveAlert {
  id: string;
  ts: number;
  level: "info" | "warning" | "danger";
  title: string;
  message: string;
  kind?: "alert" | "fact";
}

interface Subscription {
  city?: string;
  condition?: string;
}

/**
 * `useSocket` — the connection that powers the "Weather Together" live
 * facts and the server-pushed alert toasts.
 *
 * Lifecycle:
 *   • ONE socket per hook mount (disconnected on unmount).
 *   • The current `(city, condition)` subscription is mirrored into a
 *     ref so the `connect` handler can re-send it on every reconnect —
 *     otherwise an intermittent network blip would silently drop the
 *     user's live feed until their next city switch.
 *   • Every listener is registered through a typed helper and removed
 *     via `removeAllListeners()` in the cleanup to guarantee no
 *     callbacks survive unmount (no leak, no "setState on unmounted
 *     component" warnings in StrictMode dev).
 *   • When the subscription itself changes we emit `alerts:unsubscribe`
 *     for the old city so the server stops pushing events we no longer
 *     display.
 */
export function useSocket(
  city: string | undefined,
  condition: string | undefined
) {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [fact, setFact] = useState<LiveAlert | null>(null);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const subRef = useRef<Subscription>({});

  /**
   * Per-alert auto-dismiss timers. Each incoming alert gets its own
   * 15-second timeout keyed by `alert.id`, so alerts fall off the stack
   * individually instead of disappearing all at once. If the user
   * manually dismisses an alert we cancel its timer to avoid leaks.
   */
  const dismissTimersRef = useRef<Map<string, number>>(new Map());

  /* ─────────── Socket lifecycle (runs once per mount) ─────────── */
  useEffect(() => {
    const s = createSocket();
    socketRef.current = s;

    const handleConnect = () => {
      setConnected(true);
      // Re-play the last subscription on every reconnect so the server
      // knows which room to push to even after a transient drop.
      const { city, condition } = subRef.current;
      if (city) s.emit("alerts:subscribe", { city, condition });
    };

    const handleDisconnect = () => setConnected(false);

    const handleAlert = (alert: LiveAlert) => {
      setAlerts((prev) =>
        [{ ...alert, kind: "alert" as const }, ...prev].slice(0, 6)
      );

      // Schedule this specific alert to fade out on its own after 15s.
      // Guard against duplicate IDs (e.g. server re-emitting the same
      // alert) by clearing any existing timer for the same id first.
      const timers = dismissTimersRef.current;
      const existing = timers.get(alert.id);
      if (existing) window.clearTimeout(existing);
      const handle = window.setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
        timers.delete(alert.id);
      }, ALERT_AUTO_DISMISS_MS);
      timers.set(alert.id, handle);
    };

    const handleFact = (f: LiveAlert) => {
      setFact({ ...f, kind: "fact" as const });
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("alerts:new", handleAlert);
    s.on("alerts:fact", handleFact);

    return () => {
      // Cancel every pending auto-dismiss so timers don't fire on an
      // unmounted component (React StrictMode would scream otherwise).
      dismissTimersRef.current.forEach((handle) => window.clearTimeout(handle));
      dismissTimersRef.current.clear();

      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  /* ─────────── Subscription effect (runs when city / condition change) ─── */
  useEffect(() => {
    subRef.current = { city, condition };
    const s = socketRef.current;
    if (!s || !city) return;

    if (s.connected) s.emit("alerts:subscribe", { city, condition });

    // When switching cities (or unmounting) tell the server to stop
    // pushing events for the old room. If the server doesn't handle
    // the message it's a cheap no-op.
    const prevCity = city;
    return () => {
      const live = socketRef.current;
      if (live && live.connected) {
        live.emit("alerts:unsubscribe", { city: prevCity });
      }
    };
  }, [city, condition]);

  /**
   * Remove an alert immediately (user tapped the × button). We also
   * cancel its pending auto-dismiss so the timer doesn't fire later
   * against a stale id.
   */
  function dismiss(id: string) {
    const timers = dismissTimersRef.current;
    const handle = timers.get(id);
    if (handle) {
      window.clearTimeout(handle);
      timers.delete(id);
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  return { alerts, fact, connected, dismiss };
}
