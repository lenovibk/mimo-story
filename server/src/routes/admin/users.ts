import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

const router = Router();

const PLANS = ["free", "premium", "family"];

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const take = Math.min(Number(req.query.take) || 50, 200);
    const skip = Number(req.query.skip) || 0;

    const where = typeof search === "string" && search ? { email: { contains: search } } : {};

    const [parents, total] = await Promise.all([
      prisma.parent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: { _count: { select: { children: true } } },
      }),
      prisma.parent.count({ where }),
    ]);

    res.json({
      users: parents.map((p) => ({
        id: p.id,
        email: p.email,
        isGuest: p.isGuest,
        plan: p.plan,
        createdAt: p.createdAt,
        childrenCount: p._count.children,
      })),
      total,
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const parent = await prisma.parent.findUnique({
      where: { id: req.params.id },
      include: { children: { include: { interests: true } } },
    });
    if (!parent) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    res.json({
      id: parent.id,
      email: parent.email,
      isGuest: parent.isGuest,
      plan: parent.plan,
      createdAt: parent.createdAt,
      children: parent.children.map((c) => ({
        id: c.id,
        name: c.name,
        gender: c.gender,
        age: c.age,
        avatarKey: c.avatarKey,
        stars: c.stars,
        interests: c.interests.map((i) => i.interest),
      })),
    });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.parent.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const { plan } = req.body ?? {};
    if (plan !== undefined && !PLANS.includes(plan)) {
      res.status(400).json({ error: "invalid_plan" });
      return;
    }

    const parent = await prisma.parent.update({
      where: { id: req.params.id },
      data: { ...(plan !== undefined ? { plan } : {}) },
    });

    res.json({ id: parent.id, email: parent.email, isGuest: parent.isGuest, plan: parent.plan, createdAt: parent.createdAt });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.parent.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    await prisma.parent.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

export default router;
