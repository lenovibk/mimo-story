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

/** Standalone Media Converter tool (admin/src/pages/Media) - one arbitrary image or video, not tied to a story/ad. */
export const uploadConvertFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 },
}).single("file");

/** File Manager (admin/src/pages/Files) - arbitrary batch of files dropped/picked into a folder. */
export const uploadFilesToDir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024, files: 50 },
}).array("files", 50);

/** Public URL for a `<uploadDir>`-relative subpath, e.g. `stories/abc/cover.webp`. */
export function toPublicUrl(subpath: string): string {
  return `${publicBaseUrl}/uploads/${subpath.split(path.sep).join("/")}`;
}

/** Writes an uploaded file's buffer to `<uploadDir>/<subpath>` and returns its public URL. */
export async function saveUploadedFile(buffer: Buffer, subpath: string): Promise<string> {
  const target = path.join(uploadDir, subpath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  return toPublicUrl(subpath);
}

/**
 * Resolves `<uploadDir>/<subpath>` + its public URL without writing anything - for callers
 * that write the file themselves (ffmpeg writing its webm output straight to disk instead
 * of round-tripping through an in-memory buffer). Creates the parent directory so the
 * writer doesn't have to.
 */
export async function resolveUploadTarget(subpath: string): Promise<{ path: string; url: string }> {
  const target = path.join(uploadDir, subpath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  return { path: target, url: toPublicUrl(subpath) };
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

const YOUTUBE_ID_RE = /^[\w-]{11}$/;

/** Parses a YouTube video ID out of watch/share/embed/shorts URLs, or a bare 11-char ID. */
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  let id: string | null = null;
  if (url.hostname === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0] || null;
  } else if (url.hostname.replace(/^www\./, "") === "youtube.com" || url.hostname.replace(/^www\./, "") === "m.youtube.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const match = url.pathname.match(/^\/(embed|shorts)\/([^/]+)/);
      if (match) id = match[2];
    }
  }

  return id && YOUTUBE_ID_RE.test(id) ? id : null;
}
