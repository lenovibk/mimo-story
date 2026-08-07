import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { IconCheck } from "@/components/Icon/Icon";
import type { SubtitleItem, VocabItem } from "@/types";

interface SubtitleProps {
  enCue?: SubtitleItem;
  viCue?: SubtitleItem;
  currentTime: number;
  showEn: boolean;
  showVi: boolean;
  /** Vocab words anchored to the current EN cue - rendered as tappable highlights instead of
   * plain text (see useVocabulary's vocabForCue). Empty when the cue has no vocab attached. */
  vocabWords?: VocabItem[];
  onWordTap?: (item: VocabItem) => void;
  /** Whether a vocab word has already been marked "Đã thuộc" - drives the same green
   * checked look the VocabDeck/VocabFlashcard use, so it's visible right in the dialogue
   * too instead of only inside those panels. */
  isKnown?: (vocabId: string) => boolean;
}

function stripPunctuation(word: string): string {
  return word.replace(/[.,!?;:"'“”‘’]/g, "").toLowerCase();
}

function useActiveWordIndex(cue: SubtitleItem | undefined, time: number, wordCount: number) {
  return useMemo(() => {
    if (!cue || wordCount === 0) return -1;
    const duration = cue.end - cue.start;
    if (duration <= 0) return 0;
    const progress = Math.min(1, Math.max(0, (time - cue.start) / duration));
    return Math.min(wordCount - 1, Math.floor(progress * wordCount));
  }, [cue, time, wordCount]);
}

export function Subtitle({ enCue, viCue, currentTime, showEn, showVi, vocabWords, onWordTap, isKnown }: SubtitleProps) {
  const enWords = useMemo(() => enCue?.text.split(/\s+/).filter(Boolean) ?? [], [enCue]);
  const activeIndex = useActiveWordIndex(enCue, currentTime, enWords.length);
  const vocabByWord = useMemo(() => {
    const map = new Map<string, VocabItem>();
    for (const v of vocabWords ?? []) map.set(stripPunctuation(v.word), v);
    return map;
  }, [vocabWords]);

  if ((!enCue && !viCue) || (!showEn && !showVi)) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-3 sm:bottom-10 sm:px-4 landscape-compact:bottom-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${enCue?.start ?? "x"}-${viCue?.start ?? "x"}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="max-w-3xl rounded-2xl bg-black/55 px-4 py-2.5 text-center shadow-xl backdrop-blur-sm sm:rounded-3xl sm:px-10 sm:py-5 landscape-compact:rounded-xl landscape-compact:px-3 landscape-compact:py-1.5"
        >
          {showEn && enCue && (
            <p className="font-heading text-lg leading-snug font-bold text-white sm:text-4xl landscape-compact:text-sm">
              {enWords.map((word, i) => {
                const vocabItem = vocabByWord.get(stripPunctuation(word));
                const isActive = i === activeIndex;
                if (vocabItem && onWordTap) {
                  const known = isKnown?.(vocabItem.id) ?? false;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onWordTap(vocabItem);
                      }}
                      className="pointer-events-auto mx-1 inline-flex items-center gap-0.5 rounded-md underline decoration-2 decoration-dotted underline-offset-4 transition-colors duration-150"
                      style={{ color: isActive ? "#FFD54A" : known ? "#8EE28E" : "#5CC8FF", transform: isActive ? "scale(1.08)" : "scale(1)" }}
                    >
                      {known && <IconCheck className="h-3 w-3 sm:h-4 sm:w-4" />}
                      {word}
                    </button>
                  );
                }
                return (
                  <span
                    key={i}
                    className="mx-1 inline-block transition-colors duration-150"
                    style={{
                      color: isActive ? "#FFD54A" : "#FFFFFF",
                      transform: isActive ? "scale(1.08)" : "scale(1)",
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          )}
          {showVi && viCue && (
            <p className="mt-0.5 font-body text-sm font-semibold text-white/85 sm:mt-1 sm:text-2xl landscape-compact:mt-0 landscape-compact:text-xs">
              {viCue.text}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
