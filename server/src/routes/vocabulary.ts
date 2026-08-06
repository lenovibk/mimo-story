import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router({ mergeParams: true });

// Public: same "browsing never requires login" rule as /stories - only exposed for a
// published story so a hidden draft's vocab can't leak through the player.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const story = await prisma.story.findUnique({ where: { id: req.params.storyId } });
    if (!story || !story.published) {
      res.json([]);
      return;
    }

    const items = await prisma.vocabItem.findMany({ where: { storyId: story.id }, orderBy: { order: "asc" } });
    res.json(
      items.map((v) => ({
        id: v.id,
        cueStart: v.cueStart,
        word: v.word,
        phonetic: v.phonetic,
        partOfSpeech: v.partOfSpeech,
        meaningVi: v.meaningVi,
        exampleEn: v.exampleEn,
        exampleVi: v.exampleVi,
        imageUrl: v.imageUrl,
      }))
    );
  })
);

export default router;
