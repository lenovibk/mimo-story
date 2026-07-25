// Usage: node write_vi_srt.js <sentencesJsonPath-with-vi-field> <outDir>
// Reads sentences.json (after each item has been given a "vi" string field)
// and writes <outDir>/subtitle_vi.srt using the same timings as English.
const fs = require("fs");
const path = require("path");

function secondsToTimecode(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

const [jsonPath, outDir] = process.argv.slice(2);
if (!jsonPath || !outDir) {
  console.error("Usage: node write_vi_srt.js <sentencesJsonPath> <outDir>");
  process.exit(1);
}

const sentences = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const missing = sentences.findIndex((s) => !s.vi || !s.vi.trim());
if (missing !== -1) {
  console.error(`Missing "vi" translation at index ${missing}:`, sentences[missing]);
  process.exit(1);
}

const srt = sentences
  .map((s, i) => `${i + 1}\n${secondsToTimecode(s.start)} --> ${secondsToTimecode(s.end)}\n${s.vi}\n`)
  .join("\n");

fs.writeFileSync(path.join(outDir, "subtitle_vi.srt"), srt, "utf8");
console.log(`OK ${sentences.length} vi cues -> ${outDir}/subtitle_vi.srt`);
