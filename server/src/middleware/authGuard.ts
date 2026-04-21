import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

/**
 * Express request shape augmented with the authenticated user id.
 *
 * We attach `userId` on the request object so downstream handlers can
 * read it directly without re-verifying the JWT.
 */
export interface AuthedRequest extends Request {
  userId?: number;
}

/**
 * Shape of the JWT payload produced by `issueToken` in `routes/auth.ts`.
 *
 * `jsonwebtoken` intentionally types `verify()` broadly as
 * `string | JwtPayload` — we narrow to our known shape through
 * `as unknown as` to avoid an unchecked cast that would otherwise trip
 * TypeScript's overlap check.
 */
interface SkycastJwtPayload {
  sub: number;
}

/** Safely narrow the verifier result to our known payload shape. */
function verifyPayload(token: string): SkycastJwtPayload {
  return jwt.verify(token, config.jwtSecret) as unknown as SkycastJwtPayload;
}

/**
 * Strict authentication middleware — returns 401 when the caller isn't
 * logged in. Mount this on routes that need a user context.
 */
export function authGuard(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const payload = verifyPayload(header.slice(7));
    req.userId = Number(payload.sub);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Optional authentication — lets the request through either way but
 * attaches `userId` when a valid token is present. Used on public
 * endpoints that behave slightly differently for signed-in users.
 */
export function optionalAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const payload = verifyPayload(header.slice(7));
      req.userId = Number(payload.sub);
    } catch {
      /* Token missing or invalid — leave request unauthenticated. */
    }
  }
  next();
}
