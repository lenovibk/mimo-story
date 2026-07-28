import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.use(requireAuth);

const PLANS = ["free", "premium", "family"];

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const parent = await prisma.parent.findUniqueOrThrow({ where: { id: req.parentId! } });
    res.json({ plan: parent.plan, isGuest: parent.isGuest });
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const plan = String(req.body?.plan || "");
    if (!PLANS.includes(plan)) {
      res.status(400).json({ error: "invalid_plan" });
      return;
    }

    const parent = await prisma.parent.findUniqueOrThrow({ where: { id: req.parentId! } });
    if (plan !== "free" && parent.isGuest) {
      res.status(403).json({ error: "email_required" });
      return;
    }

    // Mock: chưa tích hợp cổng thanh toán thật, chỉ gán trực tiếp gói.
    const updated = await prisma.parent.update({ where: { id: req.parentId! }, data: { plan } });
    res.json({ plan: updated.plan });
  })
);

export default router;
