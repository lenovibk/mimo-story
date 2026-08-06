import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const router = Router();

function serializeVocab(v: {
  id: string;
  storyId: string;
  cueStart: number | null;
  cueText: string | null;
  word: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  imageUrl: string | null;
  order: number;
}) {
  return v;
}

function parseNullableFloat(input: unknown): number | null | undefined {
  if (input === undefined) return undefined;
  if (input === "" || input === null) return null;
  const n = Number(input);
  return Number.isFinite(n) ? n : null;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { storyId } = req.query;
    if (typeof storyId !== "string" || !storyId) {
      res.status(400).json({ error: "missing_story_id" });
      return;
    }
    const items = await prisma.vocabItem.findMany({ where: { storyId }, orderBy: { order: "asc" } });
    res.json(items.map(serializeVocab));
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { storyId, word, meaningVi, exampleEn, exampleVi } = req.body ?? {};
    if (
      typeof storyId !== "string" ||
      !storyId ||
      typeof word !== "string" ||
      !word.trim() ||
      typeof meaningVi !== "string" ||
      !meaningVi.trim() ||
      typeof exampleEn !== "string" ||
      !exampleEn.trim() ||
      typeof exampleVi !== "string" ||
      !exampleVi.trim()
    ) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      res.status(400).json({ error: "invalid_story" });
      return;
    }

    const maxOrder = await prisma.vocabItem.aggregate({ where: { storyId }, _max: { order: true } });

    const item = await prisma.vocabItem.create({
      data: {
        storyId,
        cueStart: parseNullableFloat(req.body?.cueStart) ?? null,
        cueText: typeof req.body?.cueText === "string" && req.body.cueText.trim() ? req.body.cueText.trim() : null,
        word: word.trim(),
        phonetic: typeof req.body?.phonetic === "string" && req.body.phonetic.trim() ? req.body.phonetic.trim() : null,
        partOfSpeech: typeof req.body?.partOfSpeech === "string" && req.body.partOfSpeech.trim() ? req.body.partOfSpeech.trim() : null,
        meaningVi: meaningVi.trim(),
        exampleEn: exampleEn.trim(),
        exampleVi: exampleVi.trim(),
        imageUrl: typeof req.body?.imageUrl === "string" && req.body.imageUrl.trim() ? req.body.imageUrl.trim() : null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    res.status(201).json(serializeVocab(item));
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.vocabItem.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const { word, phonetic, partOfSpeech, meaningVi, exampleEn, exampleVi, imageUrl, cueText, order } = req.body ?? {};

    const item = await prisma.vocabItem.update({
      where: { id: req.params.id },
      data: {
        ...(typeof word === "string" && word.trim() ? { word: word.trim() } : {}),
        ...(req.body?.cueStart !== undefined ? { cueStart: parseNullableFloat(req.body.cueStart) } : {}),
        ...(cueText !== undefined ? { cueText: typeof cueText === "string" && cueText.trim() ? cueText.trim() : null } : {}),
        ...(phonetic !== undefined ? { phonetic: typeof phonetic === "string" && phonetic.trim() ? phonetic.trim() : null } : {}),
        ...(partOfSpeech !== undefined
          ? { partOfSpeech: typeof partOfSpeech === "string" && partOfSpeech.trim() ? partOfSpeech.trim() : null }
          : {}),
        ...(typeof meaningVi === "string" && meaningVi.trim() ? { meaningVi: meaningVi.trim() } : {}),
        ...(typeof exampleEn === "string" && exampleEn.trim() ? { exampleEn: exampleEn.trim() } : {}),
        ...(typeof exampleVi === "string" && exampleVi.trim() ? { exampleVi: exampleVi.trim() } : {}),
        ...(imageUrl !== undefined ? { imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null } : {}),
        ...(order !== undefined && Number.isFinite(Number(order)) ? { order: Number(order) } : {}),
      },
    });

    res.json(serializeVocab(item));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.vocabItem.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    await prisma.vocabItem.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

/** Bulk order update after a drag/reorder in the admin list - takes the story's vocab
 * ids in their new order and writes 0..n-1 back in a single transaction. */
router.put(
  "/reorder",
  asyncHandler(async (req, res) => {
    const { storyId, ids } = req.body ?? {};
    if (typeof storyId !== "string" || !storyId || !Array.isArray(ids)) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    await prisma.$transaction(
      ids.map((id: string, index: number) => prisma.vocabItem.updateMany({ where: { id, storyId }, data: { order: index } }))
    );
    res.json({ ok: true });
  })
);

export default router;
