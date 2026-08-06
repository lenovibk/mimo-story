import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const router = Router();

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
    const items = await prisma.grammarPoint.findMany({ where: { storyId }, orderBy: { order: "asc" } });
    res.json(items);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { storyId, title, explanationVi, exampleEn, exampleVi } = req.body ?? {};
    if (
      typeof storyId !== "string" ||
      !storyId ||
      typeof title !== "string" ||
      !title.trim() ||
      typeof explanationVi !== "string" ||
      !explanationVi.trim() ||
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

    const maxOrder = await prisma.grammarPoint.aggregate({ where: { storyId }, _max: { order: true } });

    const item = await prisma.grammarPoint.create({
      data: {
        storyId,
        cueStart: parseNullableFloat(req.body?.cueStart) ?? null,
        cueText: typeof req.body?.cueText === "string" && req.body.cueText.trim() ? req.body.cueText.trim() : null,
        title: title.trim(),
        structure: typeof req.body?.structure === "string" && req.body.structure.trim() ? req.body.structure.trim() : null,
        explanationVi: explanationVi.trim(),
        exampleEn: exampleEn.trim(),
        exampleVi: exampleVi.trim(),
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    res.status(201).json(item);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.grammarPoint.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const { title, structure, explanationVi, exampleEn, exampleVi, cueText, order } = req.body ?? {};

    const item = await prisma.grammarPoint.update({
      where: { id: req.params.id },
      data: {
        ...(typeof title === "string" && title.trim() ? { title: title.trim() } : {}),
        ...(req.body?.cueStart !== undefined ? { cueStart: parseNullableFloat(req.body.cueStart) } : {}),
        ...(cueText !== undefined ? { cueText: typeof cueText === "string" && cueText.trim() ? cueText.trim() : null } : {}),
        ...(structure !== undefined ? { structure: typeof structure === "string" && structure.trim() ? structure.trim() : null } : {}),
        ...(typeof explanationVi === "string" && explanationVi.trim() ? { explanationVi: explanationVi.trim() } : {}),
        ...(typeof exampleEn === "string" && exampleEn.trim() ? { exampleEn: exampleEn.trim() } : {}),
        ...(typeof exampleVi === "string" && exampleVi.trim() ? { exampleVi: exampleVi.trim() } : {}),
        ...(order !== undefined && Number.isFinite(Number(order)) ? { order: Number(order) } : {}),
      },
    });

    res.json(item);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.grammarPoint.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    await prisma.grammarPoint.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

router.put(
  "/reorder",
  asyncHandler(async (req, res) => {
    const { storyId, ids } = req.body ?? {};
    if (typeof storyId !== "string" || !storyId || !Array.isArray(ids)) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    await prisma.$transaction(
      ids.map((id: string, index: number) => prisma.grammarPoint.updateMany({ where: { id, storyId }, data: { order: index } }))
    );
    res.json({ ok: true });
  })
);

export default router;
