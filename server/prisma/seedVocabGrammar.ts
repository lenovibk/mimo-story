/**
 * Loads the 7 batch JSON files produced by the content-generation subagents
 * (vocab_grammar_batch1.json .. batch7.json, one per story001-070 chunk of 10)
 * and upserts them as VocabItem / GrammarPoint rows.
 *
 * Idempotent per story: for every story present in the merged data, existing
 * VocabItem/GrammarPoint rows for that story are deleted first, then the
 * fresh set is inserted. Safe to re-run after regenerating a batch file.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const SCRATCHPAD =
  "C:\\Users\\lenovi\\AppData\\Local\\Temp\\claude\\d--VinhLe-MimoKids2\\f229ae20-1ec6-40ce-a907-c923289789e3\\scratchpad";

type VocabIn = {
  cueStart?: number | null;
  cueText?: string | null;
  word: string;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  order: number;
};

type GrammarIn = {
  cueStart?: number | null;
  cueText?: string | null;
  title: string;
  structure?: string | null;
  explanationVi: string;
  exampleEn: string;
  exampleVi: string;
  order: number;
};

type StoryIn = {
  storyId: string;
  vocab: VocabIn[];
  grammar: GrammarIn[];
};

type BatchFile = { stories: StoryIn[] };

const VALID_POS = new Set(["noun", "verb", "adjective", "adverb", "phrase"]);

async function main() {
  const merged = new Map<string, StoryIn>();

  for (let i = 1; i <= 7; i++) {
    const file = path.join(SCRATCHPAD, `vocab_grammar_batch${i}.json`);
    let raw: string;
    try {
      raw = readFileSync(file, "utf-8");
    } catch {
      throw new Error(`Missing batch file: ${file}`);
    }
    let parsed: BatchFile;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Invalid JSON in ${file}: ${(e as Error).message}`);
    }
    for (const s of parsed.stories) {
      if (merged.has(s.storyId)) {
        throw new Error(`Duplicate storyId ${s.storyId} (batch ${i})`);
      }
      merged.set(s.storyId, s);
    }
  }

  console.log(`Loaded ${merged.size} stories from 7 batch files.`);

  // Sanity check against the 70 expected story ids.
  const expected = Array.from({ length: 70 }, (_, i) => `story${String(i + 1).padStart(3, "0")}`);
  const missing = expected.filter((id) => !merged.has(id));
  if (missing.length) {
    console.warn(`WARNING: missing stories (no data generated): ${missing.join(", ")}`);
  }

  // Validate stories exist in DB.
  const dbStoryIds = new Set((await prisma.story.findMany({ select: { id: true } })).map((s) => s.id));

  let totalVocab = 0;
  let totalGrammar = 0;
  let skipped = 0;

  for (const [storyId, data] of merged) {
    if (!dbStoryIds.has(storyId)) {
      console.warn(`SKIP ${storyId}: not found in DB`);
      skipped++;
      continue;
    }

    for (const v of data.vocab) {
      if (v.partOfSpeech && !VALID_POS.has(v.partOfSpeech)) {
        throw new Error(`${storyId}: invalid partOfSpeech "${v.partOfSpeech}" on word "${v.word}"`);
      }
      if (!v.word || !v.meaningVi || !v.exampleEn || !v.exampleVi) {
        throw new Error(`${storyId}: incomplete vocab item ${JSON.stringify(v)}`);
      }
    }
    for (const g of data.grammar) {
      if (!g.title || !g.explanationVi || !g.exampleEn || !g.exampleVi) {
        throw new Error(`${storyId}: incomplete grammar item ${JSON.stringify(g)}`);
      }
    }

    await prisma.vocabItem.deleteMany({ where: { storyId } });
    await prisma.grammarPoint.deleteMany({ where: { storyId } });

    if (data.vocab.length) {
      await prisma.vocabItem.createMany({
        data: data.vocab.map((v) => ({
          storyId,
          cueStart: v.cueStart ?? null,
          cueText: v.cueText ?? null,
          word: v.word,
          phonetic: v.phonetic ?? null,
          partOfSpeech: v.partOfSpeech ?? null,
          meaningVi: v.meaningVi,
          exampleEn: v.exampleEn,
          exampleVi: v.exampleVi,
          order: v.order,
        })),
      });
      totalVocab += data.vocab.length;
    }

    if (data.grammar.length) {
      await prisma.grammarPoint.createMany({
        data: data.grammar.map((g) => ({
          storyId,
          cueStart: g.cueStart ?? null,
          cueText: g.cueText ?? null,
          title: g.title,
          structure: g.structure ?? null,
          explanationVi: g.explanationVi,
          exampleEn: g.exampleEn,
          exampleVi: g.exampleVi,
          order: g.order,
        })),
      });
      totalGrammar += data.grammar.length;
    }
  }

  console.log(
    `Done. Inserted ${totalVocab} vocab items and ${totalGrammar} grammar points across ${merged.size - skipped} stories (${skipped} skipped).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
