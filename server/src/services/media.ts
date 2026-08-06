import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";

/** Downscale cap for admin-uploaded cover/ad images - never upscale a smaller source. */
const DEFAULT_MAX_WIDTH = 1600;

/** Converts an in-memory image buffer to webp, capping width so oversized uploads don't bloat storage. */
export async function imageToWebp(buffer: Buffer, opts: { maxWidth?: number } = {}): Promise<Buffer> {
  const maxWidth = opts.maxWidth ?? DEFAULT_MAX_WIDTH;
  return sharp(buffer)
    .rotate() // apply EXIF orientation before stripping metadata
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Transcodes a video file on disk to VP9/Opus webm. Runs via a real ffmpeg process
 * (not in-memory - videos are too large to buffer), so both input and output are paths.
 * Reports 0-1 progress via onProgress, derived from fluent-ffmpeg's own percent
 * tracking (it probes the input's duration internally since it's a file, not a stream).
 */
export function videoToWebm(inputPath: string, outputPath: string, onProgress?: (ratio: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec("libvpx-vp9")
      .audioCodec("libopus")
      .outputOptions(["-crf 32", "-b:v 0", "-b:a 96k", "-row-mt 1"])
      // Cap resolution at 1080p without upscaling smaller sources.
      .videoFilters("scale='min(1920,iw)':'-2'")
      .on("progress", (p) => {
        if (typeof p.percent === "number" && Number.isFinite(p.percent)) {
          onProgress?.(Math.min(1, Math.max(0, p.percent / 100)));
        }
      })
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

/** ffmpeg needs a real file path for its input - writes a multer buffer to a scratch file, cleaned up by the caller. */
export async function writeTempFile(buffer: Buffer, ext: string): Promise<string> {
  const target = path.join(os.tmpdir(), `mimokids-${randomUUID()}${ext}`);
  await fs.writeFile(target, buffer);
  return target;
}

/** Downloads a legacy/seeded asset (served over HTTP, possibly by another origin - see resolveAssetUrl) so it can be re-encoded. */
export async function fetchAssetBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch_failed_${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
