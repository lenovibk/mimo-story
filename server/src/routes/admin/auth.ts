import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const router = Router();

function signAdminToken(adminId: string, role: string): string {
  return jwt.sign({ adminId, role }, process.env.ADMIN_JWT_SECRET!, { expiresIn: "7d" });
}

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }

    res.json({
      token: signAdminToken(admin.id, admin.role),
      admin: { id: admin.id, email: admin.email, role: admin.role },
    });
  })
);

export default router;
