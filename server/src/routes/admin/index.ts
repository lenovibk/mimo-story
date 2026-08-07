import { Router } from "express";
import { prisma } from "../../prisma.js";
import { requireAdminAuth } from "../../middleware/adminAuth.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import authRouter from "./auth.js";
import storiesRouter from "./stories.js";
import categoriesRouter from "./categories.js";
import programsRouter from "./programs.js";
import usersRouter from "./users.js";
import adsRouter from "./ads.js";
import mediaJobsRouter from "./mediaJobs.js";
import vocabularyRouter from "./vocabulary.js";
import grammarRouter from "./grammar.js";
import filesRouter from "./files.js";

const router = Router();

router.use("/auth", authRouter);

router.use(requireAdminAuth);

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [storyCount, categoryCount, userCount, activeAdCount] = await Promise.all([
      prisma.story.count(),
      prisma.category.count(),
      prisma.parent.count(),
      prisma.ad.count({ where: { active: true } }),
    ]);
    res.json({ storyCount, categoryCount, userCount, activeAdCount });
  })
);

router.use("/stories", storiesRouter);
router.use("/categories", categoriesRouter);
router.use("/programs", programsRouter);
router.use("/users", usersRouter);
router.use("/ads", adsRouter);
router.use("/media-jobs", mediaJobsRouter);
router.use("/vocabulary", vocabularyRouter);
router.use("/grammar", grammarRouter);
router.use("/files", filesRouter);

export default router;
