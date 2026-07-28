import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get(
  "/active",
  asyncHandler(async (req, res) => {
    const placement = typeof req.query.placement === "string" && req.query.placement ? req.query.placement : "home_banner";
    const age = Number(req.query.age);
    const now = new Date();

    const ads = await prisma.ad.findMany({
      where: {
        placement,
        active: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    const filtered = Number.isFinite(age)
      ? ads.filter((ad) => (ad.minAge == null || age >= ad.minAge) && (ad.maxAge == null || age <= ad.maxAge))
      : ads;

    res.json(
      filtered.map((ad) => ({
        id: ad.id,
        title: ad.title,
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl ?? undefined,
        placement: ad.placement,
      }))
    );
  })
);

export default router;
