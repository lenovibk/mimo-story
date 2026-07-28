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

    const favorites = await prisma.favorite.findMany({ where: { childId: child.id } });
    res.json(favorites.map((f) => f.storyId));
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const child = await assertOwnedChild(req.parentId!, req.params.childId);
    if (!child) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const storyId = String(req.body?.storyId || "");
    if (!storyId) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    await prisma.favorite.upsert({
      where: { childId_storyId: { childId: child.id, storyId } },
      update: {},
      create: { childId: child.id, storyId },
    });

    res.status(201).json({ ok: true });
  })
);

router.delete(
  "/:storyId",
  asyncHandler(async (req: AuthedRequest, res) => {
    const child = await assertOwnedChild(req.parentId!, req.params.childId);
    if (!child) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    await prisma.favorite.deleteMany({ where: { childId: child.id, storyId: req.params.storyId } });
    res.json({ ok: true });
  })
);

export default router;
