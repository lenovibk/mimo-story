import fs from "node:fs/promises";
import { prisma } from "../prisma.js";
import { enqueueConversion } from "./conversionQueue.js";
import { fetchAssetBuffer, imageToWebp, videoToWebm, writeTempFile } from "./media.js";
import { resolveAssetUrl, resolveUploadTarget, saveUploadedFile } from "./upload.js";

/**
 * Re-encodes a story's *currently saved* cover/video (downloaded over HTTP via its
 * resolved URL, since legacy seeded assets don't live on this server's disk - see
 * resolveAssetUrl) and swaps the story's URL over on success. Shared by the
 * single-story "Convert" action (Stories List/Form) and the bulk backfill tool.
 */
export async function enqueueStoryCoverConversion(storyId: string, title: string, coverUrl: string): Promise<string> {
  const sourceUrl = resolveAssetUrl(coverUrl);
  return enqueueConversion({
    kind: "IMAGE",
    sourceName: `${title} - cover`,
    sourceBytes: 0,
    storyId,
    process: async () => {
      const buffer = await fetchAssetBuffer(sourceUrl);
      const out = await imageToWebp(buffer);
      const url = await saveUploadedFile(out, `stories/${storyId}/cover.webp`);
      await prisma.story.update({ where: { id: storyId }, data: { coverUrl: url } });
      return { outputUrl: url, outputBytes: out.length };
    },
  });
}

export async function enqueueStoryVideoReconversion(storyId: string, title: string, videoUrl: string): Promise<string> {
  const sourceUrl = resolveAssetUrl(videoUrl);
  return enqueueConversion({
    kind: "VIDEO",
    sourceName: `${title} - video`,
    sourceBytes: 0,
    storyId,
    process: async (onProgress) => {
      const buffer = await fetchAssetBuffer(sourceUrl);
      const tempInput = await writeTempFile(buffer, ".src");
      const target = await resolveUploadTarget(`stories/${storyId}/video.webm`);
      try {
        await videoToWebm(tempInput, target.path, onProgress);
      } finally {
        await fs.unlink(tempInput).catch(() => {});
      }
      const { size } = await fs.stat(target.path);
      await prisma.story.update({ where: { id: storyId }, data: { videoUrl: target.url } });
      return { outputUrl: target.url, outputBytes: size };
    },
  });
}

export async function enqueueAdImageConversion(adId: string, title: string, imageUrl: string): Promise<string> {
  const sourceUrl = resolveAssetUrl(imageUrl);
  return enqueueConversion({
    kind: "IMAGE",
    sourceName: `${title} - image`,
    sourceBytes: 0,
    process: async () => {
      const buffer = await fetchAssetBuffer(sourceUrl);
      const out = await imageToWebp(buffer);
      const url = await saveUploadedFile(out, `ads/${adId}/image.webp`);
      await prisma.ad.update({ where: { id: adId }, data: { imageUrl: url } });
      return { outputUrl: url, outputBytes: out.length };
    },
  });
}
