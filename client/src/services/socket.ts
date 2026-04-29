import { io, type Socket, type ManagerOptions, type SocketOptions } from "socket.io-client";
const DEFAULT_OPTS: Partial<ManagerOptions & SocketOptions> = {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 600,
    reconnectionDelayMax: 4000,
};
export function createSocket(extra?: Partial<ManagerOptions & SocketOptions>): Socket {
    return io({ ...DEFAULT_OPTS, ...extra });
}
export type { Socket } from "socket.io-client";
