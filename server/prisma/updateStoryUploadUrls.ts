/**
 * One-time migration: repoints story001-070's coverUrl/videoUrl/subtitleEnUrl/subtitleViUrl
 * from the old app-relative /stories/storyNNN/... paths (served statically by the mimokids
 * app container) to absolute URLs served by the server's /uploads/stories/storyNNN/... route
 * (files copied to server/uploads/stories/ by prisma/updateStoryUploadUrls's sibling copy
 * step - see conversation). Matches the same "stories/<id>/<file>" subpath convention the
 * admin upload routes use (see services/upload.ts, routes/admin/stories.ts).
 *
 * Uses the PRODUCTION upload host regardless of which .env is active locally, since the DB
 * is shared between dev and prod - the URLs only resolve once the files are copied into the
 * production server's uploads volume.
 *
 * Idempotent: safe to re-run.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROD_UPLOAD_BASE_URL = "https://api-mimokids.vietapp.info";

async function main() {
  const ids = Array.from({ length: 70 }, (_, i) => `story${String(i + 1).padStart(3, "0")}`);

  let updated = 0;
  for (const id of ids) {
    const base = `${PROD_UPLOAD_BASE_URL}/uploads/stories/${id}`;
    const result = await prisma.story.updateMany({
      where: { id },
      data: {
        coverUrl: `${base}/cover.webp`,
        videoUrl: `${base}/video.webm`,
        subtitleEnUrl: `${base}/subtitle_en.srt`,
        subtitleViUrl: `${base}/subtitle_vi.srt`,
        videoSourceType: "UPLOAD",
      },
    });
    updated += result.count;
    if (result.count === 0) console.warn(`WARNING: story ${id} not found in DB, skipped.`);
  }

  console.log(`Updated ${updated}/${ids.length} stories to point at ${PROD_UPLOAD_BASE_URL}/uploads/stories/<id>/...`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
