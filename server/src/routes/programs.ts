import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

// Public: same "browsing never requires login" rule as categories/stories.
// Only published programs are exposed - the other content types are seeded
// but hidden until the content team fills them in and flips this flag.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const programs = await prisma.program.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: {
        ages: true,
        categories: { include: { category: true } },
      },
    });

    res.json(
      programs.map((p) => ({
        id: p.slug,
        label: p.label,
        icon: p.icon,
        color: p.color,
        ages: p.ages.map((a) => a.age),
        categoryIds: p.categories.map((c) => c.category.slug),
      }))
    );
  })
);

export default router;
