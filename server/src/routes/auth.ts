import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../db";
import { config } from "../config";

const router = Router();

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

function issueToken(userId: number): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: "7d" });
}

router.post("/register", (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password" });
  }
  const { email, password } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .run(email, hash);

  const userId = Number(info.lastInsertRowid);
  return res.json({ token: issueToken(userId), user: { id: userId, email } });
});

router.post("/login", (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password" });
  }
  const { email, password } = parsed.data;

  const row = db
    .prepare("SELECT id, password_hash FROM users WHERE email = ?")
    .get(email) as { id: number; password_hash: string } | undefined;

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  return res.json({ token: issueToken(row.id), user: { id: row.id, email } });
});

router.get("/me", (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
  try {
    // jsonwebtoken widens `verify()` to `string | JwtPayload` so the
    // conversion needs to go through `unknown` first. At runtime we
    // always issue payloads of the form `{ sub: number }` via
    // `issueToken`, so this narrowing is safe.
    const payload = jwt.verify(
      header.slice(7),
      config.jwtSecret
    ) as unknown as { sub: number };
    const user = db
      .prepare("SELECT id, email FROM users WHERE id = ?")
      .get(payload.sub) as { id: number; email: string } | undefined;
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
