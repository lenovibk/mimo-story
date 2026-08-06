export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

// "00:01:23,456" -> seconds
function timecodeToSeconds(timecode: string): number {
  const [h, m, rest] = timecode.trim().split(":");
  const [s, ms] = rest.split(",");
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms || 0) / 1000;
}

/** Same tolerant .srt parser as the app (app/src/services/Subtitle/srtParser.ts) - kept as
 * a small standalone copy here since admin and app are separate deployables with no shared
 * package. Used to build the cue picker when attaching a vocab word/grammar point to a
 * specific moment in a story's dialogue. */
export function parseSrt(raw: string): SubtitleCue[] {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n\s*\n/);
  const items: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) continue;

    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex === -1) continue;

    const [startRaw, endRaw] = lines[timeLineIndex].split("-->");
    const start = timecodeToSeconds(startRaw);
    const end = timecodeToSeconds(endRaw);
    const text = lines
      .slice(timeLineIndex + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (!text) continue;
    items.push({ start, end, text });
  }

  return items.sort((a, b) => a.start - b.start);
}

export function formatCueTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
