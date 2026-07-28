import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const router = Router();

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { stories: true } } },
    });
    res.json(
      categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        label: c.label,
        icon: c.icon,
        color: c.color,
        order: c.order,
        storyCount: c._count.stories,
      }))
    );
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { label, icon, color } = req.body ?? {};
    const slug = typeof req.body?.slug === "string" && req.body.slug.trim() ? slugify(req.body.slug) : slugify(String(label || ""));

    if (!slug || typeof label !== "string" || !label.trim() || typeof icon !== "string" || !icon.trim() || typeof color !== "string" || !color.trim()) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ error: "slug_taken" });
      return;
    }

    const order = Number(req.body?.order);
    const category = await prisma.category.create({
      data: { slug, label: label.trim(), icon: icon.trim(), color: color.trim(), order: Number.isFinite(order) ? order : 0 },
    });

    res.status(201).json({ ...category, storyCount: 0 });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const { label, icon, color, order } = req.body ?? {};

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(typeof label === "string" && label.trim() ? { label: label.trim() } : {}),
        ...(typeof icon === "string" && icon.trim() ? { icon: icon.trim() } : {}),
        ...(typeof color === "string" && color.trim() ? { color: color.trim() } : {}),
        ...(order !== undefined && Number.isFinite(Number(order)) ? { order: Number(order) } : {}),
      },
    });

    res.json(category);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { stories: true } } },
    });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    if (existing._count.stories > 0) {
      res.status(409).json({ error: "category_in_use" });
      return;
    }

    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

export default router;
