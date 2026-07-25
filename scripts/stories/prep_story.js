// Usage: node prep_story.js <srtPath> <outDir>
// Parses a Little Fox karaoke .srt, merges the per-word highlight blocks into
// one cue per sentence, and writes:
//   <outDir>/subtitle_en.srt   (final, ready to use)
//   <outDir>/sentences.json    ([{start,end,text}] - fill in "vi" then run write_vi_srt.js)
const fs = require("fs");
const path = require("path");
const { convert, toSrt } = require("./merge_srt.js");

const [srtPath, outDir] = process.argv.slice(2);
if (!srtPath || !outDir) {
  console.error("Usage: node prep_story.js <srtPath> <outDir>");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const sentences = convert(srtPath);
fs.writeFileSync(path.join(outDir, "subtitle_en.srt"), toSrt(sentences), "utf8");
fs.writeFileSync(path.join(outDir, "sentences.json"), JSON.stringify(sentences, null, 2), "utf8");
console.log(`OK ${sentences.length} sentences -> ${outDir}`);
