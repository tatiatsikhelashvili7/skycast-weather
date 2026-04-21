import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { authGuard, AuthedRequest } from "../middleware/authGuard";

const router = Router();

router.use(authGuard);

router.get("/", (req: AuthedRequest, res) => {
  const rows = db
    .prepare("SELECT id, city, country, lat, lon, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.userId);
  res.json({ favorites: rows });
});

const addSchema = z.object({
  city: z.string().min(1).max(120),
  country: z.string().max(60).optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

router.post("/", (req: AuthedRequest, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const { city, country, lat, lon } = parsed.data;
  try {
    const info = db
      .prepare(
        "INSERT INTO favorites (user_id, city, country, lat, lon) VALUES (?, ?, ?, ?, ?)"
      )
      .run(req.userId, city, country ?? null, lat ?? null, lon ?? null);
    res.json({ id: Number(info.lastInsertRowid), city, country, lat, lon });
  } catch (err: any) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "City already favorited" });
    }
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

router.delete("/:id", (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
  const info = db
    .prepare("DELETE FROM favorites WHERE id = ? AND user_id = ?")
    .run(id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

export default router;
