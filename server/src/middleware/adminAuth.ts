import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AdminAuthedRequest extends Request {
  adminId?: string;
  adminRole?: string;
}

export function requireAdminAuth(req: AdminAuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "missing_token" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as { adminId: string; role: string };
    req.adminId = payload.adminId;
    req.adminRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
}
