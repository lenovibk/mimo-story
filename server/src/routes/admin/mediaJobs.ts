import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { enqueueAdImageConversion, enqueueStoryCoverConversion, enqueueStoryVideoReconversion } from "../../services/assetConversions.js";
import { enqueueConversion } from "../../services/conversionQueue.js";
import { imageToWebp, videoToWebm, writeTempFile } from "../../services/media.js";
import { resolveUploadTarget, saveUploadedFile, uploadConvertFile } from "../../services/upload.js";

const router = Router();

function serializeJob(job: {
  id: string;
  kind: string;
  status: string;
  sourceName: string;
  sourceBytes: number;
  outputBytes: number | null;
  outputUrl: string | null;
  progress: number;
  error: string | null;
  storyId: string | null;
  story: { id: string; title: string } | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}) {
  return job;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const take = Math.min(Number(req.query.take) || 50, 100);
    const skip = Number(req.query.skip) || 0;

    const [jobs, total] = await Promise.all([
      prisma.conversionJob.findMany({
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: { story: { select: { id: true, title: true } } },
      }),
      prisma.conversionJob.count(),
    ]);

    res.json({ jobs: jobs.map(serializeJob), total });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const job = await prisma.conversionJob.findUnique({
      where: { id: req.params.id },
      include: { story: { select: { id: true, title: true } } },
    });
    if (!job) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json(serializeJob(job));
  })
);

router.post(
  "/convert",
  uploadConvertFile,
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "missing_file" });
      return;
    }

    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    if (!isImage && !isVideo) {
      res.status(400).json({ error: "unsupported_type" });
      return;
    }

    const jobId = randomUUID();
    const id = await enqueueConversion({
      kind: isImage ? "IMAGE" : "VIDEO",
      sourceName: file.originalname,
      sourceBytes: file.buffer.length,
      process: async (onProgress) => {
        if (isImage) {
          const out = await imageToWebp(file.buffer);
          const url = await saveUploadedFile(out, `converted/${jobId}.webp`);
          return { outputUrl: url, outputBytes: out.length };
        }
        const tempInput = await writeTempFile(file.buffer, ".src");
        const target = await resolveUploadTarget(`converted/${jobId}.webm`);
        try {
          await videoToWebm(tempInput, target.path, onProgress);
        } finally {
          await fs.unlink(tempInput).catch(() => {});
        }
        const { size } = await fs.stat(target.path);
        return { outputUrl: target.url, outputBytes: size };
      },
    });

    res.status(202).json({ jobId: id });
  })
);

/** Re-encodes every story cover/video and ad image still in a non-webp/webm format - covers legacy seeded assets and anything uploaded before this pipeline existed. */
router.post(
  "/backfill",
  asyncHandler(async (_req, res) => {
    const [stories, ads] = await Promise.all([prisma.story.findMany(), prisma.ad.findMany()]);

    let enqueued = 0;

    for (const story of stories) {
      if (!story.coverUrl.toLowerCase().endsWith(".webp")) {
        await enqueueStoryCoverConversion(story.id, story.title, story.coverUrl);
        enqueued++;
      }
      if (story.videoUrl && !story.videoUrl.toLowerCase().endsWith(".webm")) {
        await enqueueStoryVideoReconversion(story.id, story.title, story.videoUrl);
        enqueued++;
      }
    }

    for (const ad of ads) {
      if (!ad.imageUrl.toLowerCase().endsWith(".webp")) {
        await enqueueAdImageConversion(ad.id, ad.title, ad.imageUrl);
        enqueued++;
      }
    }

    res.status(202).json({ enqueued });
  })
);

export default router;
