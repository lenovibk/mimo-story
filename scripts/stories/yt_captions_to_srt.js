// Usage: node yt_captions_to_srt.js <vttPath> <outDir>
// Parses a YouTube auto-generated "rolling" caption .vtt (2-line scrolling
// window, inline <hh:mm:ss.mmm><c> word</c> per-word timestamps) into a
// clean sentence-per-cue transcript, and writes:
//   <outDir>/subtitle_en.srt   (final, ready to use)
//   <outDir>/sentences.json    ([{start,end,text}] - fill in "vi" then run write_vi_srt.js)
const fs = require("fs");
const path = require("path");

function timecodeToSeconds(tc) {
  const [h, m, rest] = tc.trim().split(":");
  const [s, ms] = rest.split(".");
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

function decodeEntities(str) {
  return str.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

// Extract [{word, start}] from a cue's last line, which looks like:
//   "One<00:00:04.799><c> day,</c><00:00:05.359><c> a</c>..."
// The leading word (before the first tag) has no timestamp of its own -
// it starts at the cue's own start time.
function extractWords(lastLine, cueStart) {
  const words = [];
  const tagRe = /<(\d\d:\d\d:\d\d\.\d\d\d)><c>([^<]*)<\/c>/g;
  let idx = 0;
  let match;
  const firstTagIdx = lastLine.search(/<\d\d:\d\d:\d\d\.\d\d\d>/);
  const leading = (firstTagIdx === -1 ? lastLine : lastLine.slice(0, firstTagIdx)).trim();
  if (leading) words.push({ word: leading, start: cueStart });
  while ((match = tagRe.exec(lastLine))) {
    const w = match[2].trim();
    if (w) words.push({ word: w, start: timecodeToSeconds(match[1]) });
  }
  return words;
}

function parseVtt(raw) {
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  const blocks = normalized.split(/\n\n+/).slice(1); // drop WEBVTT header block
  const words = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;
    const [startRaw, endRaw] = timeLine.split("-->");
    const cueStart = timecodeToSeconds(startRaw);
    const cueEnd = timecodeToSeconds(endRaw.trim().split(" ")[0]);
    const textLines = lines.slice(lines.indexOf(timeLine) + 1);
    const lastLine = decodeEntities((textLines[textLines.length - 1] || "").trim());
    if (!lastLine) continue;
    const plain = lastLine.replace(/<[^>]+>/g, "").trim();
    if (!plain) continue;
    const cueWords = extractWords(lastLine, cueStart);
    for (const w of cueWords) words.push({ ...w, cueEnd });
  }
  return words;
}

const BRACKET_RE = /^\[.*\]$/;

function wordsToSentences(words) {
  const sentences = [];
  let buf = [];
  let start = null;
  for (let i = 0; i < words.length; i++) {
    const raw = words[i].word.replace(/^>>\s*/, "").trim();
    if (!raw || BRACKET_RE.test(raw)) continue;
    if (start === null) start = words[i].start;
    buf.push(raw);
    const isSentenceEnd = /[.!?]["')\]]?$/.test(raw);
    const next = words[i + 1];
    if (isSentenceEnd || !next) {
      const end = next ? next.start : words[i].cueEnd;
      sentences.push({ start, end, text: buf.join(" ") });
      buf = [];
      start = null;
    }
  }
  if (buf.length) {
    sentences.push({ start, end: words[words.length - 1].cueEnd, text: buf.join(" ") });
  }
  return sentences;
}

function toSrt(items) {
  return items
    .map((item, i) => `${i + 1}\n${secondsToTimecode(item.start)} --> ${secondsToTimecode(item.end)}\n${item.text}\n`)
    .join("\n");
}

const [vttPath, outDir] = process.argv.slice(2);
if (!vttPath || !outDir) {
  console.error("Usage: node yt_captions_to_srt.js <vttPath> <outDir>");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const raw = fs.readFileSync(vttPath, "utf8");
const words = parseVtt(raw);
const sentences = wordsToSentences(words);
fs.writeFileSync(path.join(outDir, "subtitle_en.srt"), toSrt(sentences), "utf8");
fs.writeFileSync(path.join(outDir, "sentences.json"), JSON.stringify(sentences, null, 2), "utf8");
console.log(`OK ${sentences.length} sentences -> ${outDir}`);
