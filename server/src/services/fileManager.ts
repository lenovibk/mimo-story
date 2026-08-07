import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { toPublicUrl, uploadDir } from "./upload.js";

/** Thrown for any client-supplied path/name that's malformed or would escape `uploadDir`. */
export class InvalidPathError extends Error {}

/** Thrown for a zip that's unreadable, oversized, or contains a path-traversal ("zip slip") entry. */
export class InvalidZipError extends Error {}

export interface FileEntry {
  name: string;
  /** Slash-separated, relative to `uploadDir`. */
  path: string;
  type: "folder" | "file";
  size: number | null;
  mtime: string;
  url: string | null;
}

/** Resolves a client-supplied relative path against `uploadDir`, rejecting anything that escapes it. */
function safeJoin(relPath: string): string {
  const normalized = path.normalize(relPath ?? "").replace(/^([/\\])+/, "");
  const target = path.resolve(uploadDir, normalized);
  if (target !== uploadDir && !target.startsWith(uploadDir + path.sep)) {
    throw new InvalidPathError(relPath);
  }
  return target;
}

function toRelative(absPath: string): string {
  return path.relative(uploadDir, absPath).split(path.sep).join("/");
}

/** A single path segment (no `/`, `\`, `.`, `..`, or empty) - what a folder or a renamed/uploaded file may be called. */
function sanitizeName(name: string): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed || trimmed === "." || trimmed === ".." || /[\\/]/.test(trimmed)) {
    throw new InvalidPathError(name);
  }
  return trimmed;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Appends " (1)", " (2)", ... before the extension until `target` no longer collides with an existing file. */
async function dedupePath(target: string): Promise<string> {
  if (!(await pathExists(target))) return target;
  const dir = path.dirname(target);
  const ext = path.extname(target);
  const base = path.basename(target, ext);
  let i = 1;
  let candidate = target;
  while (await pathExists(candidate)) {
    candidate = path.join(dir, `${base} (${i})${ext}`);
    i++;
  }
  return candidate;
}

/** Same as `dedupePath` but treats the whole basename as opaque (for folder names, which may legitimately contain dots). */
async function dedupeDirPath(target: string): Promise<string> {
  if (!(await pathExists(target))) return target;
  const dir = path.dirname(target);
  const base = path.basename(target);
  let i = 1;
  let candidate = target;
  while (await pathExists(candidate)) {
    candidate = path.join(dir, `${base} (${i})`);
    i++;
  }
  return candidate;
}

async function toEntry(abs: string, dirent: { name: string; isDirectory(): boolean }): Promise<FileEntry> {
  const rel = toRelative(abs);
  const isDir = dirent.isDirectory();
  const stat = await fs.stat(abs);
  return {
    name: dirent.name,
    path: rel,
    type: isDir ? "folder" : "file",
    size: isDir ? null : stat.size,
    mtime: stat.mtime.toISOString(),
    url: isDir ? null : toPublicUrl(rel),
  };
}

export async function listDir(relPath: string): Promise<FileEntry[]> {
  const dir = safeJoin(relPath);
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const entries = await Promise.all(dirents.map((d) => toEntry(path.join(dir, d.name), d)));
  entries.sort((a, b) => (a.type !== b.type ? (a.type === "folder" ? -1 : 1) : a.name.localeCompare(b.name, "vi")));
  return entries;
}

export async function createFolder(relDir: string, name: string): Promise<FileEntry> {
  const safeName = sanitizeName(name);
  const dir = safeJoin(relDir);
  const target = path.join(dir, safeName);
  await fs.mkdir(target); // throws EEXIST rather than silently no-op-ing over an existing folder
  return toEntry(target, { name: safeName, isDirectory: () => true });
}

export async function renameEntry(relPath: string, newName: string): Promise<FileEntry> {
  const safeName = sanitizeName(newName);
  const src = safeJoin(relPath);
  if (src === uploadDir) throw new InvalidPathError(relPath);
  const dest = path.join(path.dirname(src), safeName);
  const stat = await fs.stat(src);
  await fs.rename(src, dest);
  return toEntry(dest, { name: safeName, isDirectory: () => stat.isDirectory() });
}

export async function moveEntry(relPath: string, targetDirRel: string): Promise<FileEntry> {
  const src = safeJoin(relPath);
  if (src === uploadDir) throw new InvalidPathError(relPath);
  const targetDir = safeJoin(targetDirRel);
  const stat = await fs.stat(src);
  if (stat.isDirectory() && (targetDir === src || targetDir.startsWith(src + path.sep))) {
    throw new InvalidPathError("cannot move a folder into itself");
  }
  const name = path.basename(src);
  let dest = path.join(targetDir, name);
  if (dest === src) return toEntry(src, { name, isDirectory: () => stat.isDirectory() }); // dropped back onto its own parent - no-op
  dest = await dedupePath(dest);
  await fs.rename(src, dest);
  return toEntry(dest, { name: path.basename(dest), isDirectory: () => stat.isDirectory() });
}

export async function deleteEntries(relPaths: string[]): Promise<void> {
  for (const relPath of relPaths) {
    const target = safeJoin(relPath);
    if (target === uploadDir) throw new InvalidPathError(relPath);
    await fs.rm(target, { recursive: true, force: true });
  }
}

export async function saveFilesToDir(relDir: string, files: Express.Multer.File[]): Promise<FileEntry[]> {
  const dir = safeJoin(relDir);
  await fs.mkdir(dir, { recursive: true });
  const saved: FileEntry[] = [];
  for (const file of files) {
    const safeName = sanitizeName(file.originalname);
    const dest = await dedupePath(path.join(dir, safeName));
    await fs.writeFile(dest, file.buffer);
    saved.push(await toEntry(dest, { name: path.basename(dest), isDirectory: () => false }));
  }
  return saved;
}

const ZIP_MAX_ENTRIES = 5000;
const ZIP_MAX_UNCOMPRESSED_BYTES = 500 * 1024 * 1024;

/**
 * Splits a zip entry's internal path into safe segments, rejecting `..` traversal ("zip slip"),
 * absolute paths, and null bytes. Backslash-separated entries (zips built on Windows) are
 * normalized to forward slashes first. Returns `null` for an entry that sanitizes to nothing
 * (e.g. a bare "/" entry) so the caller can skip it instead of failing the whole archive.
 */
function sanitizeZipEntryPath(entryName: string): string[] | null {
  if (entryName.includes("\0")) throw new InvalidZipError(entryName);
  const segments = entryName
    .replace(/\\/g, "/")
    .split("/")
    .filter((seg) => seg !== "" && seg !== ".");
  if (segments.some((seg) => seg === "..")) throw new InvalidZipError(entryName);
  return segments.length ? segments : null;
}

export interface ExtractResult {
  folder: FileEntry;
  fileCount: number;
}

/** Extracts a `.zip` into a new sibling folder named after it (deduped if that name is taken). */
export async function extractZip(relZipPath: string, opts: { deleteSource?: boolean } = {}): Promise<ExtractResult> {
  const zipPath = safeJoin(relZipPath);
  const stat = await fs.stat(zipPath); // throws ENOENT if missing - propagates to the route's 404 handling
  if (!stat.isFile() || path.extname(zipPath).toLowerCase() !== ".zip") {
    throw new InvalidPathError(relZipPath);
  }

  let zip: AdmZip;
  let entries: AdmZip.IZipEntry[];
  try {
    zip = new AdmZip(zipPath);
    entries = zip.getEntries();
  } catch {
    throw new InvalidZipError(relZipPath);
  }

  if (entries.length > ZIP_MAX_ENTRIES) throw new InvalidZipError(relZipPath);
  const totalSize = entries.reduce((sum, e) => sum + e.header.size, 0);
  if (totalSize > ZIP_MAX_UNCOMPRESSED_BYTES) throw new InvalidZipError(relZipPath);

  const parentDir = path.dirname(zipPath);
  const baseName = path.basename(zipPath, path.extname(zipPath)).trim() || "archive";
  const targetDir = await dedupeDirPath(path.join(parentDir, baseName));
  await fs.mkdir(targetDir, { recursive: true });

  let fileCount = 0;
  for (const entry of entries) {
    const segments = sanitizeZipEntryPath(entry.entryName);
    if (!segments) continue;
    const dest = path.join(targetDir, ...segments);
    if (dest !== targetDir && !dest.startsWith(targetDir + path.sep)) throw new InvalidZipError(entry.entryName);

    if (entry.isDirectory) {
      await fs.mkdir(dest, { recursive: true });
      continue;
    }
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, entry.getData());
    fileCount++;
  }

  if (opts.deleteSource) await fs.rm(zipPath, { force: true });

  const folder = await toEntry(targetDir, { name: path.basename(targetDir), isDirectory: () => true });
  return { folder, fileCount };
}
