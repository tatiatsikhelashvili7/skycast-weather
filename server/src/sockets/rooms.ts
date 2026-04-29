import { Server, Socket } from "socket.io";
export interface Pin {
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
interface RoomState {
    code: string;
    createdAt: number;
    pins: Map<string, Pin>;
}
const rooms = new Map<string, RoomState>();
const socketRoom = new Map<string, string>();
function genCode(): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    do {
        code = "";
        for (let i = 0; i < 4; i++) {
            code += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
    } while (rooms.has(code));
    return code;
}
function normalisePin(raw: any, socketId: string): Pin | null {
    if (!raw || typeof raw !== "object")
        return null;
    const lat = Number(raw.lat);
    const lon = Number(raw.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon))
        return null;
    return {
        id: socketId,
        name: String(raw.name || "Guest").slice(0, 40) || "Guest",
        city: String(raw.city || "Unknown").slice(0, 80),
        country: raw.country ? String(raw.country).slice(0, 8) : null,
        lat,
        lon,
        temp: typeof raw.temp === "number" ? raw.temp : null,
        condition: raw.condition ? String(raw.condition).slice(0, 40) : null,
        icon: raw.icon ? String(raw.icon).slice(0, 10) : null,
        updatedAt: Date.now(),
    };
}
function emitPins(io: Server, code: string) {
    const room = rooms.get(code);
    if (!room)
        return;
    const pins = Array.from(room.pins.values());
    io.to(`room:${code}`).emit("rooms:pins", { code, pins });
}
function leaveCurrent(io: Server, socket: Socket) {
    const code = socketRoom.get(socket.id);
    if (!code)
        return;
    const room = rooms.get(code);
    if (!room) {
        socketRoom.delete(socket.id);
        return;
    }
    room.pins.delete(socket.id);
    socket.leave(`room:${code}`);
    socketRoom.delete(socket.id);
    if (room.pins.size === 0) {
        rooms.delete(code);
    }
    else {
        emitPins(io, code);
    }
}
export function attachRooms(io: Server): void {
    io.on("connection", (socket) => {
        socket.on("rooms:create", (payload: any, ack?: (res: {
            code?: string;
            error?: string;
        }) => void) => {
            const pin = normalisePin(payload, socket.id);
            if (!pin) {
                ack?.({ error: "Invalid pin data" });
                return;
            }
            leaveCurrent(io, socket);
            const code = genCode();
            const room: RoomState = {
                code,
                createdAt: Date.now(),
                pins: new Map([[socket.id, pin]]),
            };
            rooms.set(code, room);
            socketRoom.set(socket.id, code);
            socket.join(`room:${code}`);
            ack?.({ code });
            emitPins(io, code);
        });
        socket.on("rooms:join", (payload: {
            code: string;
        } & Record<string, unknown>, ack?: (res: {
            ok?: boolean;
            error?: string;
            code?: string;
        }) => void) => {
            const code = String(payload?.code || "").toUpperCase();
            const room = rooms.get(code);
            if (!room) {
                ack?.({ error: "Room not found" });
                return;
            }
            const pin = normalisePin(payload, socket.id);
            if (!pin) {
                ack?.({ error: "Invalid pin data" });
                return;
            }
            leaveCurrent(io, socket);
            room.pins.set(socket.id, pin);
            socketRoom.set(socket.id, code);
            socket.join(`room:${code}`);
            ack?.({ ok: true, code });
            emitPins(io, code);
        });
        socket.on("rooms:updatePin", (payload: any) => {
            const code = socketRoom.get(socket.id);
            if (!code)
                return;
            const room = rooms.get(code);
            if (!room)
                return;
            const pin = normalisePin(payload, socket.id);
            if (!pin)
                return;
            room.pins.set(socket.id, pin);
            emitPins(io, code);
        });
        socket.on("rooms:leave", () => {
            leaveCurrent(io, socket);
        });
        socket.on("disconnect", () => {
            leaveCurrent(io, socket);
        });
    });
}
