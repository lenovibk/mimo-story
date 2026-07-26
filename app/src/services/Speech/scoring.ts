import type { PronunciationResult, StarRating, WordMatch } from "@/types";

function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Order-independent word overlap between what the child said and the target
 * sentence. Kid speech recognition is noisy, so this stays generous on purpose.
 * Returns the expected sentence annotated per-word so the UI can highlight
 * exactly what matched vs. what was missed.
 */
export function scorePronunciation(
  expectedText: string,
  transcript: string
): PronunciationResult {
  const expectedTokens = splitWords(expectedText);
  const saidWords = splitWords(transcript).map(normalizeWord).filter(Boolean);

  const remaining = [...saidWords];
  const words: WordMatch[] = expectedTokens.map((token) => {
    const norm = normalizeWord(token);
    const idx = norm ? remaining.indexOf(norm) : -1;
    if (idx !== -1) remaining.splice(idx, 1);
    return { word: token, matched: idx !== -1 };
  });

  if (expectedTokens.length === 0 || saidWords.length === 0) {
    return { transcript, stars: 1, passed: false, words };
  }

  const matches = words.filter((w) => w.matched).length;
  const ratio = matches / expectedTokens.length;
  const stars: StarRating =
    ratio >= 0.85 ? 5 : ratio >= 0.6 ? 4 : ratio >= 0.35 ? 3 : ratio >= 0.15 ? 2 : 1;

  return { transcript, stars, passed: stars >= 2, words };
}
