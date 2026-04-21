import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  openWeatherKey: process.env.OPENWEATHER_API_KEY || "",
  cacheTtlMs: Number(process.env.CACHE_TTL_MINUTES || 10) * 60 * 1000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  dbFile: path.resolve(process.cwd(), "skycast.sqlite"),
};
