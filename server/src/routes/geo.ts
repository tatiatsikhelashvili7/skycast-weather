import { Router } from "express";
import { reverseAddress } from "../services/reverseAddress";
const router = Router();
router.get("/address", async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const precisionRaw = Number(req.query.precision);
    const precision = Number.isFinite(precisionRaw)
        ? Math.max(2, Math.min(5, Math.round(precisionRaw)))
        : 3;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ error: "lat and lon query params are required" });
    }
    const out = await reverseAddress(lat, lon, precision);
    if (!out)
        return res.status(404).json({ error: "Could not resolve address" });
    res.json({ ...out, precision });
});
export default router;
