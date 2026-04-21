import { Router } from "express";
import {
  getCurrentWeather,
  getForecast,
  getByCoords,
  geocodeQuery,
  reverseGeocodeCoords,
  getBundleByCoords,
} from "../services/openweather";
import { optionalAuth, AuthedRequest } from "../middleware/authGuard";
import { db } from "../db";

const router = Router();

/* ─────────── Forward geocoding: "London" → { lat, lon } ─────────── */

router.get("/geocode", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "q query param is required" });
  try {
    const geo = await geocodeQuery(q);
    res.json(geo);
  } catch (err: any) {
    // 404 — used by the client to show the friendly "city not found" toast
    res.status(404).json({ error: err.message || "City not found" });
  }
});

/* ─────────── Reverse geocoding: (lat, lon) → nearest city ─────────── */

router.get("/reverse", async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: "lat and lon query params are required" });
  }
  try {
    const geo = await reverseGeocodeCoords(lat, lon);
    if (!geo) return res.status(404).json({ error: "Could not resolve that location" });
    res.json(geo);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Upstream error" });
  }
});

/* ─────────── Unified bundle: fetch current + forecast in one shot ─────────── */

router.get("/bundle", optionalAuth, async (req: AuthedRequest, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: "lat and lon query params are required" });
  }
  try {
    const bundle = await getBundleByCoords(lat, lon);
    if (req.userId) {
      const label =
        bundle.current?.name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      db.prepare("INSERT INTO search_history (user_id, query) VALUES (?, ?)").run(
        req.userId,
        label
      );
    }
    res.json(bundle);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Upstream error" });
  }
});

/* ─────────── Legacy city-based endpoints (still used by some flows) ─────────── */

router.get("/current", optionalAuth, async (req: AuthedRequest, res) => {
  const city = String(req.query.city || "").trim();
  if (!city) return res.status(400).json({ error: "city query param is required" });
  try {
    const data = await getCurrentWeather(city);
    if (req.userId) {
      db.prepare("INSERT INTO search_history (user_id, query) VALUES (?, ?)").run(
        req.userId,
        city
      );
    }
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Upstream error" });
  }
});

router.get("/forecast", async (req, res) => {
  const city = String(req.query.city || "").trim();
  if (!city) return res.status(400).json({ error: "city query param is required" });
  try {
    const data = await getForecast(city);
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Upstream error" });
  }
});

router.get("/coords", async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: "lat and lon query params are required" });
  }
  try {
    const data = await getByCoords(lat, lon);
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Upstream error" });
  }
});

export default router;
