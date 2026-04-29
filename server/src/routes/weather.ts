import { Router } from "express";
import { geocodeCity, reverseGeocode, openMeteoByCoords, openMeteoForecastByCoords } from "../services/openMeteo";
import { amindiGetCurrent, isGeorgianCity } from "../services/amindi";
import { optionalAuth, AuthedRequest } from "../middleware/authGuard";
import { db } from "../db";
const router = Router();
router.get("/geocode", async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q)
        return res.status(400).json({ error: "q query param is required" });
    try {
        const geo = await geocodeCity(q);
        if (!geo)
            return res.status(404).json({ error: "City not found" });
        res.json(geo);
    }
    catch (err: any) {
        res.status(404).json({ error: err.message || "City not found" });
    }
});
router.get("/reverse", async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ error: "lat and lon query params are required" });
    }
    try {
        const geo = await reverseGeocode(lat, lon);
        if (!geo)
            return res.status(404).json({ error: "Could not resolve that location" });
        res.json(geo);
    }
    catch (err: any) {
        res.status(502).json({ error: err.message || "Upstream error" });
    }
});
router.get("/bundle", optionalAuth, async (req: AuthedRequest, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ error: "lat and lon query params are required" });
    }
    try {
        const [current, forecast] = await Promise.all([
            openMeteoByCoords(lat, lon),
            openMeteoForecastByCoords(lat, lon),
        ]);
        if (!current || !forecast)
            return res.status(502).json({ error: "Upstream error" });

        if (current?.sys?.country === "GE" && typeof current?.name === "string" && isGeorgianCity(current.name)) {
            try {
                const amindiCur = await amindiGetCurrent(current.name);
                if (amindiCur?.weather?.[0]) {
                    current.weather_code = amindiCur.weather_code ?? current.weather_code;
                    current.weather = amindiCur.weather;
                    current.main = { ...current.main, ...amindiCur.main };
                    current.wind = amindiCur.wind ?? current.wind;
                    current.visibility = amindiCur.visibility ?? current.visibility;
                    current.clouds = amindiCur.clouds ?? current.clouds;
                    current.source = "amindi.ge";
                    current.updatedAt = new Date().toISOString();
                }
            }
            catch {
            }
        }
        const bundle = {
            current_weather: {
                is_day: current.is_day === 1 ? 1 : 0,
            },
            current,
            forecast,
        };
        if (req.userId) {
            const label = bundle.current?.name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
            db.prepare("INSERT INTO search_history (user_id, query) VALUES (?, ?)").run(req.userId, label);
        }
        res.json(bundle);
    }
    catch (err: any) {
        res.status(502).json({ error: err.message || "Upstream error" });
    }
});
export default router;
