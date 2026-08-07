import type { Response } from "express";
import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { uploadFilesToDir } from "../../services/upload.js";
import { InvalidPathError, InvalidZipError, createFolder, deleteEntries, extractZip, listDir, moveEntry, renameEntry, saveFilesToDir } from "../../services/fileManager.js";

const router = Router();

/** Maps fileManager's thrown/errno errors to an HTTP response; returns false (unhandled) for anything else so asyncHandler's central 500 handler takes it. */
function handleFsError(err: unknown, res: Response): boolean {
  if (err instanceof InvalidPathError) {
    res.status(400).json({ error: "invalid_path" });
    return true;
  }
  if (err instanceof InvalidZipError) {
    res.status(400).json({ error: "invalid_zip" });
    return true;
  }
  const code = (err as NodeJS.ErrnoException)?.code;
  if (code === "ENOENT") {
    res.status(404).json({ error: "not_found" });
    return true;
  }
  if (code === "EEXIST") {
    res.status(409).json({ error: "already_exists" });
    return true;
  }
  return false;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const relPath = typeof req.query.path === "string" ? req.query.path : "";
    try {
      const entries = await listDir(relPath);
      res.json({ path: relPath, entries });
    } catch (err) {
      if (!handleFsError(err, res)) throw err;
    }
  })
);

router.post(
  "/folder",
  asyncHandler(async (req, res) => {
    const { path: dirPath, name } = req.body ?? {};
    if (typeof dirPath !== "string" || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    try {
      const entry = await createFolder(dirPath, name);
      res.status(201).json(entry);
    } catch (err) {
      if (!handleFsError(err, res)) throw err;
    }
  })
);

router.post(
  "/upload",
  uploadFilesToDir,
  asyncHandler(async (req, res) => {
    const dirPath = typeof req.body?.path === "string" ? req.body.path : "";
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) {
      res.status(400).json({ error: "missing_files" });
      return;
    }
    try {
      const entries = await saveFilesToDir(dirPath, files);
      res.status(201).json({ entries });
    } catch (err) {
      if (!handleFsError(err, res)) throw err;
    }
  })
);

router.patch(
  "/rename",
  asyncHandler(async (req, res) => {
    const { path: itemPath, name } = req.body ?? {};
    if (typeof itemPath !== "string" || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    try {
      const entry = await renameEntry(itemPath, name);
      res.json(entry);
    } catch (err) {
      if (!handleFsError(err, res)) throw err;
    }
  })
);

router.post(
  "/move",
  asyncHandler(async (req, res) => {
    const { path: itemPath, targetPath } = req.body ?? {};
    if (typeof itemPath !== "string" || typeof targetPath !== "string") {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    try {
      const entry = await moveEntry(itemPath, targetPath);
      res.json(entry);
    } catch (err) {
      if (!handleFsError(err, res)) throw err;
    }
  })
);

router.post(
  "/extract",
  asyncHandler(async (req, res) => {
    const { path: itemPath, deleteSource } = req.body ?? {};
    if (typeof itemPath !== "string") {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    try {
      const result = await extractZip(itemPath, { deleteSource: deleteSource === true });
      res.status(201).json(result);
    } catch (err) {
      if (!handleFsError(err, res)) throw err;
    }
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const paths = req.body?.paths;
    if (!Array.isArray(paths) || !paths.length || !paths.every((p) => typeof p === "string")) {
      res.status(400).json({ error: "invalid_input" });
      return;
    }
    try {
      await deleteEntries(paths);
      res.status(204).end();
    } catch (err) {
      if (!handleFsError(err, res)) throw err;
    }
  })
);

export default router;
