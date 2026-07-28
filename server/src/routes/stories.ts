import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

// Public: browsing the catalog never requires login (see docs/design.md - no
// login to use the app). Only published stories are exposed here.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const stories = await prisma.story.findMany({
      where: { published: true },
      include: { category: true, tags: true },
      orderBy: { createdAt: "asc" },
    });

    res.json(
      stories.map((s) => ({
        id: s.id,
        title: s.title,
        episodeLabel: s.episodeLabel ?? undefined,
        cover: s.coverUrl,
        video: s.videoUrl,
        subtitleEn: s.subtitleEnUrl,
        subtitleVi: s.subtitleViUrl,
        duration: s.duration ?? undefined,
        category: s.category.slug,
        tags: s.tags.map((t) => t.tag),
        accent: s.accent ?? undefined,
        minAge: s.minAge ?? undefined,
        maxAge: s.maxAge ?? undefined,
      }))
    );
  })
);

export default router;
