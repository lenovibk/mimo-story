import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { slugify } from "../../services/slugify.js";

const router = Router();

const VALID_AGES = [3, 4, 5, 6, 7];

function serializeProgram(program: {
  id: string;
  slug: string;
  label: string;
  icon: string;
  color: string;
  order: number;
  published: boolean;
  _count: { stories: number };
  ages: { age: number }[];
  categories: { categoryId: string }[];
}) {
  return {
    id: program.id,
    slug: program.slug,
    label: program.label,
    icon: program.icon,
    color: program.color,
    order: program.order,
    published: program.published,
    storyCount: program._count.stories,
    ages: program.ages.map((a) => a.age),
    categoryIds: program.categories.map((c) => c.categoryId),
  };
}

const include = {
  _count: { select: { stories: true } },
  ages: true,
  categories: true,
} as const;

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const programs = await prisma.program.findMany({ orderBy: { order: "asc" }, include });
    res.json(programs.map(serializeProgram));
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

    const existing = await prisma.program.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ error: "slug_taken" });
      return;
    }

    const order = Number(req.body?.order);
    const program = await prisma.program.create({
      data: {
        slug,
        label: label.trim(),
        icon: icon.trim(),
        color: color.trim(),
        order: Number.isFinite(order) ? order : 0,
        published: req.body?.published === false || req.body?.published === "false" ? false : true,
      },
      include,
    });

    res.status(201).json(serializeProgram(program));
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.program.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const { label, icon, color, order, published } = req.body ?? {};

    const program = await prisma.program.update({
      where: { id: req.params.id },
      data: {
        ...(typeof label === "string" && label.trim() ? { label: label.trim() } : {}),
        ...(typeof icon === "string" && icon.trim() ? { icon: icon.trim() } : {}),
        ...(typeof color === "string" && color.trim() ? { color: color.trim() } : {}),
        ...(order !== undefined && Number.isFinite(Number(order)) ? { order: Number(order) } : {}),
        ...(published !== undefined ? { published: published !== false && published !== "false" } : {}),
      },
      include,
    });

    res.json(serializeProgram(program));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.program.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { stories: true } } },
    });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    if (existing._count.stories > 0) {
      res.status(409).json({ error: "program_in_use" });
      return;
    }

    await prisma.program.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

router.put(
  "/:id/ages",
  asyncHandler(async (req, res) => {
    const existing = await prisma.program.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const ages = req.body?.ages;
    if (!Array.isArray(ages) || ages.some((a) => !VALID_AGES.includes(a))) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    const uniqueAges = [...new Set(ages as number[])];
    await prisma.$transaction([
      prisma.programAgeLink.deleteMany({ where: { programId: req.params.id } }),
      prisma.programAgeLink.createMany({
        data: uniqueAges.map((age) => ({ programId: req.params.id, age })),
      }),
    ]);

    res.json({ ages: uniqueAges });
  })
);

router.put(
  "/:id/categories",
  asyncHandler(async (req, res) => {
    const existing = await prisma.program.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const categoryIds = req.body?.categoryIds;
    if (!Array.isArray(categoryIds) || categoryIds.some((c) => typeof c !== "string")) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    const uniqueIds = [...new Set(categoryIds as string[])];
    const count = await prisma.category.count({ where: { id: { in: uniqueIds } } });
    if (count !== uniqueIds.length) {
      res.status(400).json({ error: "invalid_category" });
      return;
    }

    await prisma.$transaction([
      prisma.programCategoryLink.deleteMany({ where: { programId: req.params.id } }),
      prisma.programCategoryLink.createMany({
        data: uniqueIds.map((categoryId) => ({ programId: req.params.id, categoryId })),
      }),
    ]);

    res.json({ categoryIds: uniqueIds });
  })
);

export default router;
