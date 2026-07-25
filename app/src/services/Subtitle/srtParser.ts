import type { SubtitleItem } from "@/types";

// "00:01:23,456" -> seconds
function timecodeToSeconds(timecode: string): number {
  const [h, m, rest] = timecode.trim().split(":");
  const [s, ms] = rest.split(",");
  return (
    Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms || 0) / 1000
  );
}

/**
 * Parses raw .srt content into an ordered list of subtitle cues.
 * Tolerant of Windows line endings and blocks missing a numeric index.
 */
export function parseSrt(raw: string): SubtitleItem[] {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n\s*\n/);
  const items: SubtitleItem[] = [];

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

export async function loadSrt(url: string): Promise<SubtitleItem[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load subtitle: ${url}`);
  const raw = await res.text();
  return parseSrt(raw);
}
