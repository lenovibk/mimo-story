import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { assertOwnedChild } from "./children.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

function todayDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const child = await assertOwnedChild(req.parentId!, req.params.childId);
    if (!child) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const progress = await prisma.storyProgress.findMany({ where: { childId: child.id } });
    res.json(progress.map((p) => ({ storyId: p.storyId, ratio: p.ratio, updatedAt: p.updatedAt })));
  })
);

router.put(
  "/:storyId",
  asyncHandler(async (req: AuthedRequest, res) => {
    const child = await assertOwnedChild(req.parentId!, req.params.childId);
    if (!child) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const ratio = Number(req.body?.ratio);
    const deltaSeconds = Number(req.body?.deltaSeconds) || 0;

    if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    await prisma.storyProgress.upsert({
      where: { childId_storyId: { childId: child.id, storyId: req.params.storyId } },
      update: { ratio },
      create: { childId: child.id, storyId: req.params.storyId, ratio },
    });

    if (deltaSeconds > 0) {
      const date = todayDateOnly();
      await prisma.dailyActivity.upsert({
        where: { childId_date: { childId: child.id, date } },
        update: { watchedSeconds: { increment: Math.round(deltaSeconds) } },
        create: { childId: child.id, date, watchedSeconds: Math.round(deltaSeconds) },
      });
    }

    res.json({ ok: true });
  })
);

export default router;
