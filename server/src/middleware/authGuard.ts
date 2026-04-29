import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
export interface AuthedRequest extends Request {
    userId?: number;
}
interface SkycastJwtPayload {
    sub: number;
}
function verifyPayload(token: string): SkycastJwtPayload {
    return jwt.verify(token, config.jwtSecret) as unknown as SkycastJwtPayload;
}
export function authGuard(req: AuthedRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing token" });
    }
    try {
        const payload = verifyPayload(header.slice(7));
        req.userId = Number(payload.sub);
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
        try {
            const payload = verifyPayload(header.slice(7));
            req.userId = Number(payload.sub);
        }
        catch {
        }
    }
    next();
}
