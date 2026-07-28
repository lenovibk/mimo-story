import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.use(requireAuth);

function serializeChild(c: {
  id: string;
  name: string;
  gender: string;
  age: number;
  avatarKey: string;
  stars: number;
  interests: { interest: string }[];
}) {
  return {
    id: c.id,
    name: c.name,
    gender: c.gender,
    age: c.age,
    avatarKey: c.avatarKey,
    stars: c.stars,
    interests: c.interests.map((i) => i.interest),
  };
}

async function assertOwnedChild(parentId: string, childId: string) {
  const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
  return child;
}

router.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const children = await prisma.child.findMany({
    where: { parentId: req.parentId! },
    include: { interests: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(children.map(serializeChild));
}));

router.post("/", asyncHandler(async (req: AuthedRequest, res) => {
  const { name, gender, age, avatarKey, interests } = req.body ?? {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    (gender !== "boy" && gender !== "girl") ||
    typeof age !== "number" ||
    !Array.isArray(interests)
  ) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const child = await prisma.child.create({
    data: {
      parentId: req.parentId!,
      name: name.trim(),
      gender,
      age,
      avatarKey: typeof avatarKey === "string" && avatarKey ? avatarKey : gender === "boy" ? "boy-1" : "girl-1",
      interests: { create: interests.filter((i: unknown) => typeof i === "string").map((interest: string) => ({ interest })) },
    },
    include: { interests: true },
  });

  res.status(201).json(serializeChild(child));
}));

router.patch("/:childId", asyncHandler(async (req: AuthedRequest, res) => {
  const child = await assertOwnedChild(req.parentId!, req.params.childId);
  if (!child) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const { name, age, avatarKey, interests } = req.body ?? {};

  const updated = await prisma.child.update({
    where: { id: child.id },
    data: {
      ...(typeof name === "string" && name.trim() ? { name: name.trim() } : {}),
      ...(typeof age === "number" ? { age } : {}),
      ...(typeof avatarKey === "string" && avatarKey ? { avatarKey } : {}),
      ...(Array.isArray(interests)
        ? {
            interests: {
              deleteMany: {},
              create: interests.filter((i: unknown) => typeof i === "string").map((interest: string) => ({ interest })),
            },
          }
        : {}),
    },
    include: { interests: true },
  });

  res.json(serializeChild(updated));
}));

export default router;
export { assertOwnedChild };
