import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { assertOwnedChild } from "./children.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const child = await assertOwnedChild(req.parentId!, req.params.childId);
    if (!child) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const progress = await prisma.vocabProgress.findMany({ where: { childId: child.id } });
    res.json(progress.map((p) => ({ vocabId: p.vocabId, status: p.status, updatedAt: p.updatedAt })));
  })
);

router.put(
  "/:vocabId",
  asyncHandler(async (req: AuthedRequest, res) => {
    const child = await assertOwnedChild(req.parentId!, req.params.childId);
    if (!child) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const status = req.body?.status === "known" ? "known" : "new";

    const vocab = await prisma.vocabItem.findUnique({ where: { id: req.params.vocabId } });
    if (!vocab) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    await prisma.vocabProgress.upsert({
      where: { childId_vocabId: { childId: child.id, vocabId: req.params.vocabId } },
      update: { status },
      create: { childId: child.id, vocabId: req.params.vocabId, status },
    });

    res.json({ ok: true });
  })
);

export default router;
