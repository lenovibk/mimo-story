import { randomUUID } from "node:crypto";
import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { enqueueAdImageConversion } from "../../services/assetConversions.js";
import { imageToWebp } from "../../services/media.js";
import { saveUploadedFile, uploadAdImage } from "../../services/upload.js";

const router = Router();

function parseNullableInt(input: unknown): number | null | undefined {
  if (input === undefined) return undefined;
  if (input === "" || input === null) return null;
  const n = Number(input);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseNullableDate(input: unknown): Date | null | undefined {
  if (input === undefined) return undefined;
  if (input === "" || input === null) return null;
  const d = new Date(String(input));
  return Number.isNaN(d.getTime()) ? null : d;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { placement, active } = req.query;
    const where = {
      ...(typeof placement === "string" && placement ? { placement } : {}),
      ...(active === "true" ? { active: true } : active === "false" ? { active: false } : {}),
    };

    const ads = await prisma.ad.findMany({ where, orderBy: [{ priority: "desc" }, { createdAt: "desc" }] });
    res.json(ads);
  })
);

router.post(
  "/",
  uploadAdImage,
  asyncHandler(async (req, res) => {
    const { title, linkUrl, placement } = req.body ?? {};
    const image = req.file;

    if (typeof title !== "string" || !title.trim() || !image) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    const id = randomUUID();
    const imageUrl = await saveUploadedFile(await imageToWebp(image.buffer), `ads/${id}/image.webp`);

    const ad = await prisma.ad.create({
      data: {
        id,
        title: title.trim(),
        imageUrl,
        linkUrl: typeof linkUrl === "string" && linkUrl.trim() ? linkUrl.trim() : null,
        placement: typeof placement === "string" && placement.trim() ? placement.trim() : "home_banner",
        minAge: parseNullableInt(req.body?.minAge) ?? null,
        maxAge: parseNullableInt(req.body?.maxAge) ?? null,
        active: req.body?.active === "false" ? false : true,
        startAt: parseNullableDate(req.body?.startAt) ?? null,
        endAt: parseNullableDate(req.body?.endAt) ?? null,
        priority: parseNullableInt(req.body?.priority) ?? 0,
      },
    });

    res.status(201).json(ad);
  })
);

router.patch(
  "/:id",
  uploadAdImage,
  asyncHandler(async (req, res) => {
    const existing = await prisma.ad.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const image = req.file;
    const imageUrl = image ? await saveUploadedFile(await imageToWebp(image.buffer), `ads/${existing.id}/image.webp`) : undefined;

    const { title, linkUrl, placement, active } = req.body ?? {};

    const ad = await prisma.ad.update({
      where: { id: req.params.id },
      data: {
        ...(typeof title === "string" && title.trim() ? { title: title.trim() } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        ...(linkUrl !== undefined ? { linkUrl: linkUrl?.trim() || null } : {}),
        ...(typeof placement === "string" && placement.trim() ? { placement: placement.trim() } : {}),
        ...(req.body?.minAge !== undefined ? { minAge: parseNullableInt(req.body.minAge) } : {}),
        ...(req.body?.maxAge !== undefined ? { maxAge: parseNullableInt(req.body.maxAge) } : {}),
        ...(active !== undefined ? { active: active !== "false" } : {}),
        ...(req.body?.startAt !== undefined ? { startAt: parseNullableDate(req.body.startAt) } : {}),
        ...(req.body?.endAt !== undefined ? { endAt: parseNullableDate(req.body.endAt) } : {}),
        ...(req.body?.priority !== undefined ? { priority: parseNullableInt(req.body.priority) ?? 0 } : {}),
      },
    });

    res.json(ad);
  })
);

/** Manual "Convert" action (Ads List) - re-encodes the ad's currently saved image, regardless of its current format. */
router.post(
  "/:id/convert",
  asyncHandler(async (req, res) => {
    const ad = await prisma.ad.findUnique({ where: { id: req.params.id } });
    if (!ad) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    const jobId = await enqueueAdImageConversion(ad.id, ad.title, ad.imageUrl);
    res.status(202).json({ jobId });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.ad.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    await prisma.ad.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

export default router;
