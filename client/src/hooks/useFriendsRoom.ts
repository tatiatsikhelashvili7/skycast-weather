import { useCallback, useEffect, useRef, useState } from "react";
import { createSocket, type Socket } from "../services/socket";

/**
 * One entry on the shared "friends on a map" view. Mirrors the server-side
 * `Pin` shape in `server/src/sockets/rooms.ts` one-to-one.
 */
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

/* ── Wire protocol types ────────────────────────────────────────────── */

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

/**
 * Dedicated socket connection for the "Weather together" feature.
 *
 * Intentionally owns a *separate* socket from `useSocket` (alerts, facts).
 * socket.io multiplexes cheaply over a single TCP connection, and keeping
 * concerns split means a disconnect on one channel never silently kills
 * the other.
 *
 * Critical correctness notes:
 *  • The server emits `rooms:pins` immediately after sending the
 *    join/create ack. Those two packets can be delivered in either order
 *    on the client — so the `rooms:pins` handler must be tolerant of
 *    "pins arrive before we've stored the code locally" by syncing the
 *    code from the first legitimate pins payload. That fixes the
 *    "joined but map stays empty" bug.
 *  • Every listener is removed on unmount to avoid React StrictMode
 *    double-registration and memory leaks during HMR.
 */
export function useFriendsRoom() {
  const socketRef = useRef<Socket | null>(null);
  /**
   * The room we *think* we're in. Kept in a ref alongside state so the
   * `rooms:pins` handler can distinguish "legit update for my room" from
   * "leftover event for a room I already left" without React state
   * closure staleness.
   */
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

    const handleConnect = () =>
      setState((st) => ({ ...st, connected: true, lastError: null }));
    const handleDisconnect = () => {
      activeCodeRef.current = null;
      setState((st) => ({ ...st, connected: false, code: null, pins: [] }));
    };
    const handlePins = ({ code, pins }: PinsPayload) => {
      setState((st) => {
        /*
         * Gate against stale pins for a room we've explicitly left.
         * `activeCodeRef` is authoritative — it's updated synchronously
         * on create/join/leave, so it doesn't miss race windows the way
         * `st.code` can (React batches the ack's setState).
         */
        const expected = activeCodeRef.current;
        if (expected === null) {
          // We haven't locally committed to any room yet — but the server
          // only emits to rooms we've joined, so this must be the ack's
          // own room. Adopt it so pins aren't silently dropped.
          activeCodeRef.current = code;
          return { ...st, code, pins };
        }
        if (expected !== code) return st;
        return { ...st, code, pins };
      });
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("rooms:pins", handlePins);

    return () => {
      // Be explicit rather than `removeAllListeners` so hot-reload doesn't
      // accidentally nuke listeners a parent component still cares about.
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("rooms:pins", handlePins);
      s.disconnect();
      socketRef.current = null;
      activeCodeRef.current = null;
    };
  }, []);

  const createRoom = useCallback(
    (pin: Omit<FriendPin, "id" | "updatedAt">): Promise<string> => {
      return new Promise((resolve, reject) => {
        const s = socketRef.current;
        if (!s) return reject(new Error("Not connected"));
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
    },
    []
  );

  const joinRoom = useCallback(
    (
      code: string,
      pin: Omit<FriendPin, "id" | "updatedAt">
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const s = socketRef.current;
        if (!s) return reject(new Error("Not connected"));
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
            // Optimistically seed our own pin; the server will send the
            // full list via `rooms:pins` a microtask later.
            pins: st.pins.length
              ? st.pins
              : [{ ...pin, id: s.id || "me", updatedAt: Date.now() }],
            lastError: null,
          }));
          resolve(finalCode);
        });
      });
    },
    []
  );

  const leaveRoom = useCallback(() => {
    const s = socketRef.current;
    if (s) s.emit("rooms:leave");
    activeCodeRef.current = null;
    setState((st) => ({ ...st, code: null, pins: [], lastError: null }));
  }, []);

  const updatePin = useCallback(
    (pin: Omit<FriendPin, "id" | "updatedAt">) => {
      const s = socketRef.current;
      if (!s) return;
      s.emit("rooms:updatePin", pin);
    },
    []
  );

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
