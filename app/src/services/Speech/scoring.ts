import type { PronunciationResult, StarRating } from "@/types";

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Order-independent word overlap between what the child said and the target
 * sentence. Kid speech recognition is noisy, so this stays generous on purpose.
 */
export function scorePronunciation(
  expectedText: string,
  transcript: string
): PronunciationResult {
  const expectedWords = normalizeWords(expectedText);
  const saidWords = normalizeWords(transcript);

  if (expectedWords.length === 0 || saidWords.length === 0) {
    return { transcript, stars: 1, passed: false };
  }

  const remaining = [...saidWords];
  let matches = 0;
  for (const word of expectedWords) {
    const idx = remaining.indexOf(word);
    if (idx !== -1) {
      matches += 1;
      remaining.splice(idx, 1);
    }
  }

  const ratio = matches / expectedWords.length;
  const stars: StarRating =
    ratio >= 0.85 ? 5 : ratio >= 0.6 ? 4 : ratio >= 0.35 ? 3 : ratio >= 0.15 ? 2 : 1;

  return { transcript, stars, passed: stars >= 2 };
}
