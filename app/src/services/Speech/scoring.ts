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

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = new Array<number>(b.length + 1);
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * STT frequently mishears a single phoneme ("cat" -> "cap"). Treating that as
 * a full miss is especially harsh on short targets, where one word is a huge
 * share of the score. Allow a small edit-distance slack scaled to word length.
 */
function isCloseMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 3) return false;
  const allowed = maxLen <= 4 ? 1 : Math.floor(maxLen * 0.3);
  return levenshtein(a, b) <= allowed;
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
    if (!norm) return { word: token, matched: false };
    let idx = remaining.indexOf(norm);
    if (idx === -1) idx = remaining.findIndex((said) => isCloseMatch(norm, said));
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
