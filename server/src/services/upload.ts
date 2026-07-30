import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";

/** Root directory files are written under; also what express.static("/uploads") serves. */
export const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");

const publicBaseUrl = (process.env.PUBLIC_UPLOAD_BASE_URL || `http://localhost:${process.env.PORT || 3002}`).replace(/\/$/, "");

/** Buffers files in memory so routes can pick the final filename/id before writing to disk. */
export const uploadStoryFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 },
}).fields([
  { name: "cover", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "subtitleEn", maxCount: 1 },
  { name: "subtitleVi", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]);

export const uploadAdImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("image");

/** Writes an uploaded file's buffer to `<uploadDir>/<subpath>` and returns its public URL. */
export async function saveUploadedFile(buffer: Buffer, subpath: string): Promise<string> {
  const target = path.join(uploadDir, subpath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  return `${publicBaseUrl}/uploads/${subpath.split(path.sep).join("/")}`;
}

const appBaseUrl = (process.env.PUBLIC_APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

/**
 * Seeded stories store cover/video/subtitle URLs as app-relative paths
 * (`/stories/story001/...`), which only resolve when the *kids app's* own
 * origin serves them. Any other client (the admin app, a future API
 * consumer) needs an absolute URL - resolve relative paths against the kids
 * app's origin so `Story.coverUrl` etc. always work regardless of caller.
 * Admin-uploaded assets already come back absolute from saveUploadedFile
 * above, so this is a no-op for those.
 */
export function resolveAssetUrl(url: string): string {
  return url.startsWith("/") ? `${appBaseUrl}${url}` : url;
}

function extFromOriginalName(originalname: string): string {
  const ext = path.extname(originalname);
  return ext || "";
}

export function fileExt(file: Express.Multer.File | undefined): string {
  return file ? extFromOriginalName(file.originalname) : "";
}
