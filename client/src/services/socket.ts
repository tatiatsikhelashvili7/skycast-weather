import { io, type Socket, type ManagerOptions, type SocketOptions } from "socket.io-client";

/**
 * Socket service layer.
 *
 * A tiny factory that centralises the socket.io connection parameters so
 * every hook (`useSocket`, `useFriendsRoom`) connects with consistent
 * transport settings. If we ever need to switch to a named namespace or
 * change the upgrade strategy it happens here exactly once.
 */

const DEFAULT_OPTS: Partial<ManagerOptions & SocketOptions> = {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  // Reconnect aggressively so flaky mobile networks recover fast; the
  // hook layer is already idempotent about re-subscribing on `connect`.
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 600,
  reconnectionDelayMax: 4_000,
};

/**
 * Create a new socket.io client instance pointed at the same origin as
 * the page. Each hook owns its socket; socket.io multiplexes cheaply so
 * two sockets is fine and keeps concerns decoupled.
 */
export function createSocket(extra?: Partial<ManagerOptions & SocketOptions>): Socket {
  return io({ ...DEFAULT_OPTS, ...extra });
}

export type { Socket } from "socket.io-client";
