import { useCallback, useEffect, useRef, useState } from "react";
import { createSocket, type Socket } from "../services/socket";
export interface FriendPin {
    id: string;
    name: string;
    city: string;
    country?: string | null;
    lat: number;
    lon: number;
    temp: number | null;
    condition: string | null;
    icon: string | null;
    updatedAt: number;
}
export interface RoomState {
    code: string | null;
    pins: FriendPin[];
    connected: boolean;
    lastError: string | null;
}
interface RoomAckOk {
    ok?: boolean;
    code?: string;
    error?: string;
}
interface CreateAck {
    code?: string;
    error?: string;
}
interface PinsPayload {
    code: string;
    pins: FriendPin[];
}
export function useFriendsRoom() {
    const socketRef = useRef<Socket | null>(null);
    const activeCodeRef = useRef<string | null>(null);
    const [state, setState] = useState<RoomState>({
        code: null,
        pins: [],
        connected: false,
        lastError: null,
    });
    useEffect(() => {
        const s = createSocket();
        socketRef.current = s;
        const handleConnect = () => setState((st) => ({ ...st, connected: true, lastError: null }));
        const handleDisconnect = () => {
            activeCodeRef.current = null;
            setState((st) => ({ ...st, connected: false, code: null, pins: [] }));
        };
        const handlePins = ({ code, pins }: PinsPayload) => {
            setState((st) => {
                const expected = activeCodeRef.current;
                if (expected === null) {
                    activeCodeRef.current = code;
                    return { ...st, code, pins };
                }
                if (expected !== code)
                    return st;
                return { ...st, code, pins };
            });
        };
        s.on("connect", handleConnect);
        s.on("disconnect", handleDisconnect);
        s.on("rooms:pins", handlePins);
        return () => {
            s.off("connect", handleConnect);
            s.off("disconnect", handleDisconnect);
            s.off("rooms:pins", handlePins);
            s.disconnect();
            socketRef.current = null;
            activeCodeRef.current = null;
        };
    }, []);
    const createRoom = useCallback((pin: Omit<FriendPin, "id" | "updatedAt">): Promise<string> => {
        return new Promise((resolve, reject) => {
            const s = socketRef.current;
            if (!s || !s.connected) {
                setState((st) => ({ ...st, lastError: "Still connecting. Try again in a moment." }));
                return reject(new Error("Not connected"));
            }
            s.emit("rooms:create", pin, (res: CreateAck) => {
                if (res.error || !res.code) {
                    setState((st) => ({
                        ...st,
                        lastError: res.error || "Could not create room",
                    }));
                    return reject(new Error(res.error || "Could not create room"));
                }
                activeCodeRef.current = res.code;
                setState((st) => ({
                    ...st,
                    code: res.code!,
                    pins: [
                        { ...pin, id: s.id || "me", updatedAt: Date.now() },
                    ],
                    lastError: null,
                }));
                resolve(res.code);
            });
        });
    }, []);
    const joinRoom = useCallback((code: string, pin: Omit<FriendPin, "id" | "updatedAt">): Promise<string> => {
        return new Promise((resolve, reject) => {
            const s = socketRef.current;
            if (!s || !s.connected) {
                setState((st) => ({ ...st, lastError: "Still connecting. Try again in a moment." }));
                return reject(new Error("Not connected"));
            }
            const upper = code.trim().toUpperCase();
            s.emit("rooms:join", { code: upper, ...pin }, (res: RoomAckOk) => {
                if (res.error || !res.ok) {
                    setState((st) => ({
                        ...st,
                        lastError: res.error || "Could not join room",
                    }));
                    return reject(new Error(res.error || "Could not join room"));
                }
                const finalCode = res.code || upper;
                activeCodeRef.current = finalCode;
                setState((st) => ({
                    ...st,
                    code: finalCode,
                    pins: st.pins.length
                        ? st.pins
                        : [{ ...pin, id: s.id || "me", updatedAt: Date.now() }],
                    lastError: null,
                }));
                resolve(finalCode);
            });
        });
    }, []);
    const leaveRoom = useCallback(() => {
        const s = socketRef.current;
        if (s)
            s.emit("rooms:leave");
        activeCodeRef.current = null;
        setState((st) => ({ ...st, code: null, pins: [], lastError: null }));
    }, []);
    const updatePin = useCallback((pin: Omit<FriendPin, "id" | "updatedAt">) => {
        const s = socketRef.current;
        if (!s)
            return;
        s.emit("rooms:updatePin", pin);
    }, []);
    const clearError = useCallback(() => {
        setState((st) => ({ ...st, lastError: null }));
    }, []);
    return {
        ...state,
        createRoom,
        joinRoom,
        leaveRoom,
        updatePin,
        clearError,
    };
}
