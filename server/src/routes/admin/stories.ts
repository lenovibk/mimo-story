import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { enqueueStoryCoverConversion, enqueueStoryVideoReconversion } from "../../services/assetConversions.js";
import { enqueueConversion } from "../../services/conversionQueue.js";
import { imageToWebp, videoToWebm, writeTempFile } from "../../services/media.js";
import {
  extractYoutubeId,
  fileExt,
  resolveAssetUrl,
  resolveUploadTarget,
  saveUploadedFile,
  uploadDir,
  uploadStoryFiles,
} from "../../services/upload.js";

const router = Router();

function serializeStory(story: {
  id: string;
  title: string;
  episodeLabel: string | null;
  coverUrl: string;
  videoUrl: string | null;
  videoSourceType: string;
  youtubeId: string | null;
  subtitleEnUrl: string | null;
  subtitleViUrl: string | null;
  audioUrl: string | null;
  mediaType: string;
  duration: number | null;
  accent: string | null;
  minAge: number | null;
  maxAge: number | null;
  published: boolean;
  categoryId: string;
  category: { slug: string; label: string };
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: string }[];
  programs: { program: { id: string; slug: string; label: string } }[];
}, convertingIds: Set<string> = new Set()) {
  return {
    id: story.id,
    title: story.title,
    episodeLabel: story.episodeLabel,
    coverUrl: resolveAssetUrl(story.coverUrl),
    videoUrl: story.videoUrl ? resolveAssetUrl(story.videoUrl) : null,
    videoSourceType: story.videoSourceType,
    youtubeId: story.youtubeId,
    subtitleEnUrl: story.subtitleEnUrl ? resolveAssetUrl(story.subtitleEnUrl) : null,
    subtitleViUrl: story.subtitleViUrl ? resolveAssetUrl(story.subtitleViUrl) : null,
    audioUrl: story.audioUrl ? resolveAssetUrl(story.audioUrl) : null,
    mediaType: story.mediaType,
    duration: story.duration,
    accent: story.accent,
    minAge: story.minAge,
    maxAge: story.maxAge,
    published: story.published,
    categoryId: story.categoryId,
    categorySlug: story.category.slug,
    categoryLabel: story.category.label,
    programIds: story.programs.map((p) => p.program.id),
    programLabels: story.programs.map((p) => p.program.label),
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
    tags: story.tags.map((t) => t.tag),
    /** True while a background ConversionJob is still re-encoding this story's video - see Stories List/Form badges. */
    videoConverting: convertingIds.has(story.id),
  };
}

function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  if (typeof input === "string" && input.trim()) return input.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

function parseNullableInt(input: unknown): number | null | undefined {
  if (input === undefined) return undefined;
  if (input === "" || input === null) return null;
  const n = Number(input);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/**
 * Video transcoding takes real time, so it never blocks the story save response. The
 * raw upload is saved immediately (under `video<ext>`) so the story is watchable right
 * away, and a ConversionJob is enqueued to re-encode it to `video.webm` in the
 * background; Story.videoUrl flips over to the compressed file once that finishes and
 * the raw original is deleted. The admin UI shows a "converting" badge (Stories
 * List/Form) by polling this job's status.
 */
async function enqueueStoryVideoConversion(storyId: string, video: Express.Multer.File, rawSubpath: string): Promise<string> {
  const tempInput = await writeTempFile(video.buffer, fileExt(video) || ".mp4");
  const webmSubpath = `stories/${storyId}/video.webm`;
  return enqueueConversion({
    kind: "VIDEO",
    sourceName: video.originalname,
    sourceBytes: video.buffer.length,
    storyId,
    process: async (onProgress) => {
      const target = await resolveUploadTarget(webmSubpath);
      try {
        await videoToWebm(tempInput, target.path, onProgress);
      } finally {
        await fs.unlink(tempInput).catch(() => {});
      }
      const { size } = await fs.stat(target.path);
      await prisma.story.update({ where: { id: storyId }, data: { videoUrl: target.url } });
      if (rawSubpath !== webmSubpath) {
        await fs.unlink(path.join(uploadDir, rawSubpath)).catch(() => {});
      }
      return { outputUrl: target.url, outputBytes: size };
    },
  });
}

function parseIds(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : input !== undefined ? [input] : [];
  const ids = raw.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  return [...new Set(ids)];
}

const include = { category: true, tags: true, programs: { include: { program: true } } } as const;

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, program, published, search } = req.query;
    const take = Math.min(Number(req.query.take) || 50, 200);
    const skip = Number(req.query.skip) || 0;

    const where = {
      ...(typeof category === "string" && category ? { category: { slug: category } } : {}),
      ...(typeof program === "string" && program ? { programs: { some: { program: { slug: program } } } } : {}),
      ...(published === "true" ? { published: true } : published === "false" ? { published: false } : {}),
      ...(typeof search === "string" && search ? { title: { contains: search } } : {}),
    };

    const [stories, total, activeJobs] = await Promise.all([
      prisma.story.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.story.count({ where }),
      prisma.conversionJob.findMany({
        where: { kind: "VIDEO", status: { in: ["QUEUED", "PROCESSING"] }, storyId: { not: null } },
        select: { storyId: true },
      }),
    ]);

    const convertingIds = new Set(activeJobs.map((j) => j.storyId!));
    res.json({ stories: stories.map((s) => serializeStory(s, convertingIds)), total });
  })
);

router.post(
  "/",
  uploadStoryFiles,
  asyncHandler(async (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const cover = files?.cover?.[0];
    const video = files?.video?.[0];
    const subtitleEn = files?.subtitleEn?.[0];
    const subtitleVi = files?.subtitleVi?.[0];
    const audio = files?.audio?.[0];

    const { title, episodeLabel, categoryId, accent } = req.body ?? {};
    const mediaType = req.body?.mediaType === "AUDIO" ? "AUDIO" : "VIDEO";
    const programIds = parseIds(req.body?.programIds);
    const videoSourceType = req.body?.videoSourceType === "YOUTUBE" ? "YOUTUBE" : "UPLOAD";
    const youtubeId = videoSourceType === "YOUTUBE" && typeof req.body?.youtubeUrl === "string"
      ? extractYoutubeId(req.body.youtubeUrl)
      : null;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof categoryId !== "string" ||
      !categoryId ||
      programIds.length === 0
    ) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    if (!cover) {
      res.status(400).json({ error: "missing_files" });
      return;
    }
    const published = req.body?.published === "false" ? false : true;
    if (mediaType === "VIDEO" && videoSourceType === "YOUTUBE" && !youtubeId) {
      res.status(400).json({ error: "invalid_youtube_url" });
      return;
    }
    // A hidden draft can be created metadata-first with no video/subtitles yet -
    // only enforce completeness when the story would actually be visible in the app.
    if (published) {
      if (mediaType === "VIDEO" && videoSourceType === "UPLOAD" && (!video || !subtitleEn || !subtitleVi)) {
        res.status(400).json({ error: "missing_files" });
        return;
      }
      if (mediaType === "VIDEO" && videoSourceType === "YOUTUBE" && (!subtitleEn || !subtitleVi)) {
        res.status(400).json({ error: "missing_files" });
        return;
      }
      if (mediaType === "AUDIO" && !audio) {
        res.status(400).json({ error: "missing_files" });
        return;
      }
    }

    const [category, programCount] = await Promise.all([
      prisma.category.findUnique({ where: { id: categoryId } }),
      prisma.program.count({ where: { id: { in: programIds } } }),
    ]);
    if (!category) {
      res.status(400).json({ error: "invalid_category" });
      return;
    }
    if (programCount !== programIds.length) {
      res.status(400).json({ error: "invalid_program" });
      return;
    }

    const id = randomUUID();
    const useUploadedVideo = video && videoSourceType === "UPLOAD";
    const rawVideoSubpath = useUploadedVideo ? `stories/${id}/video${fileExt(video) || ".mp4"}` : null;
    const [coverUrl, videoUrl, subtitleEnUrl, subtitleViUrl, audioUrl] = await Promise.all([
      saveUploadedFile(await imageToWebp(cover.buffer), `stories/${id}/cover.webp`),
      useUploadedVideo && rawVideoSubpath ? saveUploadedFile(video!.buffer, rawVideoSubpath) : Promise.resolve(null),
      subtitleEn
        ? saveUploadedFile(subtitleEn.buffer, `stories/${id}/subtitle_en${fileExt(subtitleEn) || ".srt"}`)
        : Promise.resolve(null),
      subtitleVi
        ? saveUploadedFile(subtitleVi.buffer, `stories/${id}/subtitle_vi${fileExt(subtitleVi) || ".srt"}`)
        : Promise.resolve(null),
      audio ? saveUploadedFile(audio.buffer, `stories/${id}/audio${fileExt(audio) || ".mp3"}`) : Promise.resolve(null),
    ]);

    const story = await prisma.story.create({
      data: {
        id,
        title: title.trim(),
        episodeLabel: typeof episodeLabel === "string" && episodeLabel.trim() ? episodeLabel.trim() : null,
        coverUrl,
        videoUrl,
        videoSourceType,
        youtubeId,
        subtitleEnUrl,
        subtitleViUrl,
        audioUrl,
        mediaType,
        duration: parseNullableInt(req.body?.duration) ?? null,
        accent: typeof accent === "string" && accent ? accent : null,
        minAge: parseNullableInt(req.body?.minAge) ?? null,
        maxAge: parseNullableInt(req.body?.maxAge) ?? null,
        published,
        categoryId,
        tags: { create: parseTags(req.body?.tags).map((tag) => ({ tag })) },
        programs: { create: programIds.map((programId) => ({ programId })) },
      },
      include,
    });

    if (useUploadedVideo && rawVideoSubpath) {
      const jobId = await enqueueStoryVideoConversion(id, video!, rawVideoSubpath);
      res.status(201).json({ ...serializeStory(story), videoConverting: true, pendingVideoJobId: jobId });
      return;
    }

    res.status(201).json(serializeStory(story));
  })
);

router.patch(
  "/:id",
  uploadStoryFiles,
  asyncHandler(async (req, res) => {
    const existing = await prisma.story.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const cover = files?.cover?.[0];
    const video = files?.video?.[0];
    const subtitleEn = files?.subtitleEn?.[0];
    const subtitleVi = files?.subtitleVi?.[0];
    const audio = files?.audio?.[0];
    const id = existing.id;

    const { title, episodeLabel, categoryId, mediaType, accent, published, tags } = req.body ?? {};
    const programIds = parseIds(req.body?.programIds);
    const effectiveMediaType = mediaType === "AUDIO" || mediaType === "VIDEO" ? mediaType : existing.mediaType;
    const videoSourceType =
      req.body?.videoSourceType === "YOUTUBE"
        ? "YOUTUBE"
        : req.body?.videoSourceType === "UPLOAD"
          ? "UPLOAD"
          : existing.videoSourceType;

    let youtubeId: string | null = null;
    if (videoSourceType === "YOUTUBE") {
      const rawUrl = typeof req.body?.youtubeUrl === "string" ? req.body.youtubeUrl.trim() : "";
      youtubeId = rawUrl ? extractYoutubeId(rawUrl) : existing.youtubeId;
      if (!youtubeId) {
        res.status(400).json({ error: "invalid_youtube_url" });
        return;
      }
    }
    const useUploadedVideo = video && videoSourceType === "UPLOAD";
    const effectivePublished = published !== undefined ? published !== "false" : existing.published;
    // Only enforce "must have a video" when the save would make the story visible in the
    // app - a hidden draft can be saved metadata-first and have its video added later.
    if (
      effectivePublished &&
      effectiveMediaType === "VIDEO" &&
      videoSourceType === "UPLOAD" &&
      !useUploadedVideo &&
      !(existing.videoSourceType === "UPLOAD" && existing.videoUrl)
    ) {
      res.status(400).json({ error: "missing_files" });
      return;
    }

    const rawVideoSubpath = useUploadedVideo ? `stories/${id}/video${fileExt(video) || ".mp4"}` : null;

    const [coverUrl, uploadedVideoUrl, subtitleEnUrl, subtitleViUrl, audioUrl] = await Promise.all([
      cover ? saveUploadedFile(await imageToWebp(cover.buffer), `stories/${id}/cover.webp`) : Promise.resolve(undefined),
      useUploadedVideo && rawVideoSubpath ? saveUploadedFile(video!.buffer, rawVideoSubpath) : Promise.resolve(undefined),
      subtitleEn
        ? saveUploadedFile(subtitleEn.buffer, `stories/${id}/subtitle_en${fileExt(subtitleEn) || ".srt"}`)
        : Promise.resolve(undefined),
      subtitleVi
        ? saveUploadedFile(subtitleVi.buffer, `stories/${id}/subtitle_vi${fileExt(subtitleVi) || ".srt"}`)
        : Promise.resolve(undefined),
      audio ? saveUploadedFile(audio.buffer, `stories/${id}/audio${fileExt(audio) || ".mp3"}`) : Promise.resolve(undefined),
    ]);

    if (typeof categoryId === "string" && categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        res.status(400).json({ error: "invalid_category" });
        return;
      }
    }
    if (programIds.length > 0) {
      const programCount = await prisma.program.count({ where: { id: { in: programIds } } });
      if (programCount !== programIds.length) {
        res.status(400).json({ error: "invalid_program" });
        return;
      }
    }

    const story = await prisma.story.update({
      where: { id },
      data: {
        ...(typeof title === "string" && title.trim() ? { title: title.trim() } : {}),
        ...(episodeLabel !== undefined ? { episodeLabel: episodeLabel?.trim() || null } : {}),
        ...(coverUrl ? { coverUrl } : {}),
        videoSourceType,
        youtubeId: videoSourceType === "YOUTUBE" ? youtubeId : null,
        videoUrl: videoSourceType === "YOUTUBE" ? null : (uploadedVideoUrl ?? undefined),
        ...(subtitleEnUrl ? { subtitleEnUrl } : {}),
        ...(subtitleViUrl ? { subtitleViUrl } : {}),
        ...(audioUrl ? { audioUrl } : {}),
        ...(mediaType === "AUDIO" || mediaType === "VIDEO" ? { mediaType } : {}),
        ...(req.body?.duration !== undefined ? { duration: parseNullableInt(req.body.duration) } : {}),
        ...(typeof accent === "string" ? { accent: accent || null } : {}),
        ...(req.body?.minAge !== undefined ? { minAge: parseNullableInt(req.body.minAge) } : {}),
        ...(req.body?.maxAge !== undefined ? { maxAge: parseNullableInt(req.body.maxAge) } : {}),
        ...(published !== undefined ? { published: published !== "false" } : {}),
        ...(typeof categoryId === "string" && categoryId ? { categoryId } : {}),
        ...(tags !== undefined ? { tags: { deleteMany: {}, create: parseTags(tags).map((tag) => ({ tag })) } } : {}),
        ...(programIds.length > 0
          ? { programs: { deleteMany: {}, create: programIds.map((programId) => ({ programId })) } }
          : {}),
      },
      include,
    });

    if (useUploadedVideo && rawVideoSubpath) {
      const jobId = await enqueueStoryVideoConversion(id, video!, rawVideoSubpath);
      res.json({ ...serializeStory(story), videoConverting: true, pendingVideoJobId: jobId });
      return;
    }

    res.json(serializeStory(story));
  })
);

/** Manual "Convert" action (Stories List/Form) - re-encodes the story's *currently saved* cover/video, regardless of their current format. Unlike the upload flow this re-downloads the existing asset instead of using a fresh multer buffer. */
router.post(
  "/:id/convert",
  asyncHandler(async (req, res) => {
    const story = await prisma.story.findUnique({ where: { id: req.params.id } });
    if (!story) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const [coverJobId, videoJobId] = await Promise.all([
      enqueueStoryCoverConversion(story.id, story.title, story.coverUrl),
      story.videoUrl ? enqueueStoryVideoReconversion(story.id, story.title, story.videoUrl) : Promise.resolve(null),
    ]);

    res.status(202).json({ coverJobId, videoJobId });
  })
);

const SUBTITLE_FIELD = { en: "subtitleEnUrl", vi: "subtitleViUrl" } as const;
type SubtitleLang = keyof typeof SUBTITLE_FIELD;

function isSubtitleLang(value: string): value is SubtitleLang {
  return value === "en" || value === "vi";
}

// Quick-edit: read/write a story's .srt content directly instead of forcing a
// re-upload for a one-line fix. Legacy stories' subtitles live as static
// files inside the app project (not on this server's disk), so reads fetch
// the file over HTTP via its resolved URL, and writes always land under this
// server's own uploads/ (re-pointing the story's subtitle URL there) rather
// than trying to write into a path this process doesn't own.
router.get(
  "/:id/subtitle/:lang",
  asyncHandler(async (req, res) => {
    const { lang } = req.params;
    if (!isSubtitleLang(lang)) {
      res.status(400).json({ error: "invalid_lang" });
      return;
    }

    const story = await prisma.story.findUnique({ where: { id: req.params.id } });
    if (!story) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const subtitleUrl = story[SUBTITLE_FIELD[lang]];
    if (!subtitleUrl) {
      res.status(404).json({ error: "no_subtitle" });
      return;
    }

    const url = resolveAssetUrl(subtitleUrl);
    try {
      const upstream = await fetch(url);
      if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
      res.json({ content: await upstream.text() });
    } catch {
      res.status(502).json({ error: "subtitle_fetch_failed" });
    }
  })
);

router.put(
  "/:id/subtitle/:lang",
  asyncHandler(async (req, res) => {
    const { lang } = req.params;
    if (!isSubtitleLang(lang)) {
      res.status(400).json({ error: "invalid_lang" });
      return;
    }

    const content = req.body?.content;
    if (typeof content !== "string" || !content.trim()) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }

    const story = await prisma.story.findUnique({ where: { id: req.params.id } });
    if (!story) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const url = await saveUploadedFile(Buffer.from(content, "utf-8"), `stories/${story.id}/subtitle_${lang}.srt`);
    const updated = await prisma.story.update({
      where: { id: story.id },
      data: { [SUBTITLE_FIELD[lang]]: url },
      include,
    });

    res.json(serializeStory(updated));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.story.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    await prisma.story.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

export default router;
