import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { assertOwnedChild } from "./children.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeStreak(activeDateKeys: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  // Nếu hôm nay chưa học, streak được tính tới hôm qua.
  if (!activeDateKeys.has(dateKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (activeDateKeys.has(dateKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
  const child = await assertOwnedChild(req.parentId!, req.params.childId);
  if (!child) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const [progress, favoritesCount, activity] = await Promise.all([
    prisma.storyProgress.findMany({ where: { childId: child.id } }),
    prisma.favorite.count({ where: { childId: child.id } }),
    prisma.dailyActivity.findMany({ where: { childId: child.id }, orderBy: { date: "desc" }, take: 60 }),
  ]);

  const totalLearningSeconds = activity.reduce((sum, a) => sum + a.watchedSeconds, 0);
  const storiesCompleted = progress.filter((p) => p.ratio >= 0.97).length;

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    const key = dateKey(d);
    const found = activity.find((a) => dateKey(a.date) === key);
    return { date: key, watchedSeconds: found?.watchedSeconds ?? 0 };
  });

  const activeDateKeys = new Set(activity.filter((a) => a.watchedSeconds > 0).map((a) => dateKey(a.date)));

  res.json({
    stars: child.stars,
    totalLearningSeconds,
    storiesCompleted,
    favoritesCount,
    weeklyActivity: last7,
    streakDays: computeStreak(activeDateKeys),
  });
  })
);

export default router;
