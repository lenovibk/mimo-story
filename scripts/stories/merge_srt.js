const fs = require("fs");

function timecodeToSeconds(tc) {
  const [h, m, rest] = tc.trim().split(":");
  const [s, ms] = rest.split(",");
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms || 0) / 1000;
}

function secondsToTimecode(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function parseBlocks(raw) {
  const normalized = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];
  const blocks = normalized.split(/\n\s*\n/);
  const items = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;
    const timeIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeIdx === -1) continue;
    const [startRaw, endRaw] = lines[timeIdx].split("-->");
    const start = timecodeToSeconds(startRaw);
    const end = timecodeToSeconds(endRaw);
    const text = lines.slice(timeIdx + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    if (!text) continue;
    items.push({ start, end, text });
  }
  return items.sort((a, b) => a.start - b.start);
}

// Merge consecutive blocks that share identical stripped text into one sentence cue.
// Little Fox karaoke .srt files repeat each sentence once per word-highlight frame
// (same text, one word wrapped in <font color="#ffff00">); this collapses those runs
// into a single cue spanning from the first frame's start to the last frame's end.
function mergeSentences(items) {
  const merged = [];
  for (const item of items) {
    const last = merged[merged.length - 1];
    if (last && last.text === item.text) {
      last.end = item.end;
    } else {
      merged.push({ start: item.start, end: item.end, text: item.text });
    }
  }
  return merged;
}

function toSrt(items) {
  return items
    .map((item, i) => `${i + 1}\n${secondsToTimecode(item.start)} --> ${secondsToTimecode(item.end)}\n${item.text}\n`)
    .join("\n");
}

function convert(inputPath) {
  const raw = fs.readFileSync(inputPath, "utf8");
  const blocks = parseBlocks(raw);
  const sentences = mergeSentences(blocks);
  return sentences;
}

module.exports = { convert, toSrt, parseBlocks, mergeSentences };

if (require.main === module) {
  const inputPath = process.argv[2];
  const sentences = convert(inputPath);
  console.log(`Blocks parsed -> sentences merged: ${sentences.length}`);
  console.log(toSrt(sentences.slice(0, 8)));
}
