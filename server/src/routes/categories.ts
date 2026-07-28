import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
    res.json(
      categories.map((c) => ({
        id: c.slug,
        label: c.label,
        icon: c.icon,
        color: c.color,
      }))
    );
  })
);

export default router;
