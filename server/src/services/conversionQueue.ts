import { randomUUID } from "node:crypto";
import { prisma } from "../prisma.js";

export type JobKind = "IMAGE" | "VIDEO";
export type JobStatus = "QUEUED" | "PROCESSING" | "DONE" | "FAILED";

interface EnqueueParams {
  kind: JobKind;
  sourceName: string;
  sourceBytes: number;
  storyId?: string;
  /** Does the actual conversion (and any DB side-effects, e.g. updating Story.videoUrl); returns where the result landed. */
  process: (onProgress: (ratio: number) => void) => Promise<{ outputUrl: string; outputBytes: number }>;
}

interface QueuedJob extends EnqueueParams {
  id: string;
}

const pending: QueuedJob[] = [];
let running = false;

/** Throttles DB writes for progress updates so a fast-ticking ffmpeg progress event doesn't hammer the DB. */
function throttle(fn: (ratio: number) => void, ms: number) {
  let last = 0;
  return (ratio: number) => {
    const now = Date.now();
    if (now - last >= ms || ratio >= 1) {
      last = now;
      fn(ratio);
    }
  };
}

async function pump() {
  if (running) return;
  const job = pending.shift();
  if (!job) return;
  running = true;

  await prisma.conversionJob.update({
    where: { id: job.id },
    data: { status: "PROCESSING", startedAt: new Date() },
  });

  const onProgress = throttle((ratio) => {
    prisma.conversionJob.update({ where: { id: job.id }, data: { progress: ratio } }).catch(() => {});
  }, 1000);

  try {
    const { outputUrl, outputBytes } = await job.process(onProgress);
    await prisma.conversionJob.update({
      where: { id: job.id },
      data: { status: "DONE", progress: 1, outputUrl, outputBytes, finishedAt: new Date() },
    });
  } catch (err) {
    await prisma.conversionJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: err instanceof Error ? err.message : "conversion_failed", finishedAt: new Date() },
    });
  } finally {
    running = false;
    void pump();
  }
}

/** Creates the DB record immediately (so it shows up in the monitor right away) and queues the actual work. */
export async function enqueueConversion(params: EnqueueParams): Promise<string> {
  const id = randomUUID();
  await prisma.conversionJob.create({
    data: {
      id,
      kind: params.kind,
      sourceName: params.sourceName,
      sourceBytes: params.sourceBytes,
      storyId: params.storyId,
    },
  });
  pending.push({ ...params, id });
  void pump();
  return id;
}

/** Jobs left PROCESSING from a previous process (crashed/killed mid-conversion) can never finish - fail them so the monitor doesn't show a stuck spinner forever. */
export async function recoverStaleJobs(): Promise<void> {
  await prisma.conversionJob.updateMany({
    where: { status: "PROCESSING" },
    data: { status: "FAILED", error: "server_restarted", finishedAt: new Date() },
  });
}
