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
export function useSocket(city: string | undefined, condition: string | undefined) {
    const [alerts, setAlerts] = useState<LiveAlert[]>([]);
    const [fact, setFact] = useState<LiveAlert | null>(null);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const subRef = useRef<Subscription>({});
    const dismissTimersRef = useRef<Map<string, number>>(new Map());
    useEffect(() => {
        const s = createSocket();
        socketRef.current = s;
        const handleConnect = () => {
            setConnected(true);
            const { city, condition } = subRef.current;
            if (city)
                s.emit("alerts:subscribe", { city, condition });
        };
        const handleDisconnect = () => setConnected(false);
        const handleAlert = (alert: LiveAlert) => {
            setAlerts((prev) => [{ ...alert, kind: "alert" as const }, ...prev].slice(0, 6));
            const timers = dismissTimersRef.current;
            const existing = timers.get(alert.id);
            if (existing)
                window.clearTimeout(existing);
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
            dismissTimersRef.current.forEach((handle) => window.clearTimeout(handle));
            dismissTimersRef.current.clear();
            s.removeAllListeners();
            s.disconnect();
            socketRef.current = null;
        };
    }, []);
    useEffect(() => {
        subRef.current = { city, condition };
        const s = socketRef.current;
        if (!s || !city)
            return;
        if (s.connected)
            s.emit("alerts:subscribe", { city, condition });
        const prevCity = city;
        return () => {
            const live = socketRef.current;
            if (live && live.connected) {
                live.emit("alerts:unsubscribe", { city: prevCity });
            }
        };
    }, [city, condition]);
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
