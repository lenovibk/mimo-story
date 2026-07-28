import { randomUUID } from "node:crypto";
import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { fileExt, resolveAssetUrl, saveUploadedFile, uploadStoryFiles } from "../../services/upload.js";

const router = Router();

function serializeStory(story: {
  id: string;
  title: string;
  episodeLabel: string | null;
  coverUrl: string;
  videoUrl: string;
  subtitleEnUrl: string;
  subtitleViUrl: string;
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
}) {
  return {
    id: story.id,
    title: story.title,
    episodeLabel: story.episodeLabel,
    coverUrl: resolveAssetUrl(story.coverUrl),
    videoUrl: resolveAssetUrl(story.videoUrl),
    subtitleEnUrl: resolveAssetUrl(story.subtitleEnUrl),
    subtitleViUrl: resolveAssetUrl(story.subtitleViUrl),
    duration: story.duration,
    accent: story.accent,
    minAge: story.minAge,
    maxAge: story.maxAge,
    published: story.published,
    categoryId: story.categoryId,
    categorySlug: story.category.slug,
    categoryLabel: story.category.label,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
    tags: story.tags.map((t) => t.tag),
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

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, published, search } = req.query;
    const take = Math.min(Number(req.query.take) || 50, 200);
    const skip = Number(req.query.skip) || 0;

    const where = {
      ...(typeof category === "string" && category ? { category: { slug: category } } : {}),
      ...(published === "true" ? { published: true } : published === "false" ? { published: false } : {}),
      ...(typeof search === "string" && search ? { title: { contains: search } } : {}),
    };

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: { category: true, tags: true },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.story.count({ where }),
    ]);

    res.json({ stories: stories.map(serializeStory), total });
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

    const { title, episodeLabel, categoryId, accent } = req.body ?? {};

    if (typeof title !== "string" || !title.trim() || typeof categoryId !== "string" || !categoryId) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    if (!cover || !video || !subtitleEn || !subtitleVi) {
      res.status(400).json({ error: "missing_files" });
      return;
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      res.status(400).json({ error: "invalid_category" });
      return;
    }

    const id = randomUUID();
    const [coverUrl, videoUrl, subtitleEnUrl, subtitleViUrl] = await Promise.all([
      saveUploadedFile(cover.buffer, `stories/${id}/cover${fileExt(cover) || ".webp"}`),
      saveUploadedFile(video.buffer, `stories/${id}/video${fileExt(video) || ".webm"}`),
      saveUploadedFile(subtitleEn.buffer, `stories/${id}/subtitle_en${fileExt(subtitleEn) || ".srt"}`),
      saveUploadedFile(subtitleVi.buffer, `stories/${id}/subtitle_vi${fileExt(subtitleVi) || ".srt"}`),
    ]);

    const story = await prisma.story.create({
      data: {
        id,
        title: title.trim(),
        episodeLabel: typeof episodeLabel === "string" && episodeLabel.trim() ? episodeLabel.trim() : null,
        coverUrl,
        videoUrl,
        subtitleEnUrl,
        subtitleViUrl,
        duration: parseNullableInt(req.body?.duration) ?? null,
        accent: typeof accent === "string" && accent ? accent : null,
        minAge: parseNullableInt(req.body?.minAge) ?? null,
        maxAge: parseNullableInt(req.body?.maxAge) ?? null,
        published: req.body?.published === "false" ? false : true,
        categoryId,
        tags: { create: parseTags(req.body?.tags).map((tag) => ({ tag })) },
      },
      include: { category: true, tags: true },
    });

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
    const id = existing.id;

    const [coverUrl, videoUrl, subtitleEnUrl, subtitleViUrl] = await Promise.all([
      cover ? saveUploadedFile(cover.buffer, `stories/${id}/cover${fileExt(cover) || ".webp"}`) : Promise.resolve(undefined),
      video ? saveUploadedFile(video.buffer, `stories/${id}/video${fileExt(video) || ".webm"}`) : Promise.resolve(undefined),
      subtitleEn
        ? saveUploadedFile(subtitleEn.buffer, `stories/${id}/subtitle_en${fileExt(subtitleEn) || ".srt"}`)
        : Promise.resolve(undefined),
      subtitleVi
        ? saveUploadedFile(subtitleVi.buffer, `stories/${id}/subtitle_vi${fileExt(subtitleVi) || ".srt"}`)
        : Promise.resolve(undefined),
    ]);

    const { title, episodeLabel, categoryId, accent, published, tags } = req.body ?? {};

    if (typeof categoryId === "string" && categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        res.status(400).json({ error: "invalid_category" });
        return;
      }
    }

    const story = await prisma.story.update({
      where: { id },
      data: {
        ...(typeof title === "string" && title.trim() ? { title: title.trim() } : {}),
        ...(episodeLabel !== undefined ? { episodeLabel: episodeLabel?.trim() || null } : {}),
        ...(coverUrl ? { coverUrl } : {}),
        ...(videoUrl ? { videoUrl } : {}),
        ...(subtitleEnUrl ? { subtitleEnUrl } : {}),
        ...(subtitleViUrl ? { subtitleViUrl } : {}),
        ...(req.body?.duration !== undefined ? { duration: parseNullableInt(req.body.duration) } : {}),
        ...(typeof accent === "string" ? { accent: accent || null } : {}),
        ...(req.body?.minAge !== undefined ? { minAge: parseNullableInt(req.body.minAge) } : {}),
        ...(req.body?.maxAge !== undefined ? { maxAge: parseNullableInt(req.body.maxAge) } : {}),
        ...(published !== undefined ? { published: published !== "false" } : {}),
        ...(typeof categoryId === "string" && categoryId ? { categoryId } : {}),
        ...(tags !== undefined ? { tags: { deleteMany: {}, create: parseTags(tags).map((tag) => ({ tag })) } } : {}),
      },
      include: { category: true, tags: true },
    });

    res.json(serializeStory(story));
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

    const url = resolveAssetUrl(story[SUBTITLE_FIELD[lang]]);
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
      include: { category: true, tags: true },
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
