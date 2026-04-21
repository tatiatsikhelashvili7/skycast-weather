import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketServer } from "socket.io";

import { config } from "./config";
import { initSchema } from "./db";
import authRoutes from "./routes/auth";
import weatherRoutes from "./routes/weather";
import favoritesRoutes from "./routes/favorites";
import citiesRoutes from "./routes/cities";
import { attachAlertStream } from "./sockets/alerts";
import { attachRooms } from "./sockets/rooms";

initSchema();

const app = express();

/*
 * CORS policy.
 *
 * For the HTTP API we reflect the request origin when it matches a known
 * dev / tunnel pattern (localhost, *.trycloudflare.com, *.ngrok-free.app,
 * *.loca.lt), otherwise fall back to the configured client origin. This
 * lets friends hit the app over a quick Cloudflare tunnel without the
 * backend rejecting their fetch requests on CORS grounds, while keeping
 * production deployments locked to the explicit `CLIENT_ORIGIN`.
 */
const TUNNEL_ORIGIN_RE =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$|\.trycloudflare\.com$|\.ngrok-free\.app$|\.loca\.lt$|\.vercel\.app$/i;

function corsOriginResolver(
  origin: string | undefined,
  cb: (err: Error | null, allow?: boolean) => void
) {
  if (!origin) return cb(null, true); // same-origin / curl / SSR
  if (origin === config.clientOrigin) return cb(null, true);
  try {
    const hostname = new URL(origin).hostname;
    if (TUNNEL_ORIGIN_RE.test(origin) || TUNNEL_ORIGIN_RE.test(hostname)) {
      return cb(null, true);
    }
  } catch {
    /* malformed origin header — fall through to reject */
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

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[skycast] unhandled:", err);
  res.status(500).json({ error: "Internal server error" });
});

const httpServer = http.createServer(app);

/*
 * Socket.io CORS. The same tunnel-aware resolver is reused so live
 * alerts and the Friends-on-a-map rooms keep working through the
 * Cloudflare quick tunnel.
 */
const io = new SocketServer(httpServer, {
  cors: {
    origin: (origin, cb) =>
      corsOriginResolver(origin ?? undefined, (err, allow) => {
        if (err) return cb(err);
        cb(null, allow ?? false);
      }),
    credentials: true,
  },
});
attachAlertStream(io);
attachRooms(io);

httpServer.listen(config.port, () => {
  console.log(`SkyCast server listening on http://localhost:${config.port}`);
  console.log("  Primary data sources:");
  console.log("    · amindi.ge   (Georgian cities, scraped every 3 min)");
  console.log("    · open-meteo  (worldwide, refreshed every 10 min, no key needed)");
  if (config.openWeatherKey) {
    console.log("    · OpenWeatherMap (fallback, live key detected)");
  }
});
