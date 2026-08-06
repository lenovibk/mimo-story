import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router({ mergeParams: true });

// Public: same rule as /vocabulary - only exposed for a published story.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const story = await prisma.story.findUnique({ where: { id: req.params.storyId } });
    if (!story || !story.published) {
      res.json([]);
      return;
    }

    const items = await prisma.grammarPoint.findMany({ where: { storyId: story.id }, orderBy: { order: "asc" } });
    res.json(
      items.map((g) => ({
        id: g.id,
        cueStart: g.cueStart,
        title: g.title,
        structure: g.structure,
        explanationVi: g.explanationVi,
        exampleEn: g.exampleEn,
        exampleVi: g.exampleVi,
      }))
    );
  })
);

export default router;
