import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketServer } from "socket.io";
import fs from "fs";
import path from "path";
import { config } from "./config";
import { initSchema } from "./db";
import authRoutes from "./routes/auth";
import weatherRoutes from "./routes/weather";
import favoritesRoutes from "./routes/favorites";
import citiesRoutes from "./routes/cities";
import geoRoutes from "./routes/geo";
import { attachAlertStream } from "./sockets/alerts";
import { attachRooms } from "./sockets/rooms";
initSchema();
const app = express();
function maybeServeClient() {
    if (process.env.SKYCAST_SERVE_CLIENT !== "1")
        return;
    const candidates = [
        path.resolve(process.cwd(), "../client/dist"),
        path.resolve(process.cwd(), "client/dist"),
    ];
    const distPath = candidates.find((p) => fs.existsSync(p));
    if (!distPath) {
        return;
    }
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
    });
}
const TUNNEL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$|\.trycloudflare\.com$|\.ngrok-free\.app$|\.loca\.lt$|\.vercel\.app$/i;
function corsOriginResolver(origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) {
    if (!origin)
        return cb(null, true);
    if (origin === config.clientOrigin)
        return cb(null, true);
    try {
        const hostname = new URL(origin).hostname;
        if (TUNNEL_ORIGIN_RE.test(origin) || TUNNEL_ORIGIN_RE.test(hostname)) {
            return cb(null, true);
        }
    }
    catch {
    }
    cb(null, false);
}
app.use(cors({ origin: corsOriginResolver, credentials: true }));
app.use(express.json());
app.get("/api/health", (_req, res) => {
    res.json({
        ok: true,
        service: "skycast",
        demo: !config.openWeatherKey,
        time: new Date().toISOString(),
    });
});
app.use("/api/auth", authRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/cities", citiesRoutes);
app.use("/api/geo", geoRoutes);
maybeServeClient();
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: "Internal server error" });
});
const httpServer = http.createServer(app);
const io = new SocketServer(httpServer, {
    cors: {
        origin: (origin, cb) => corsOriginResolver(origin ?? undefined, (err, allow) => {
            if (err)
                return cb(err);
            cb(null, allow ?? false);
        }),
        credentials: true,
    },
});
attachAlertStream(io);
attachRooms(io);
httpServer.listen(config.port, () => {
});
