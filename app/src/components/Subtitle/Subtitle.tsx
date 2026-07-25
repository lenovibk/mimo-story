import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import type { SubtitleItem } from "@/types";

interface SubtitleProps {
  enCue?: SubtitleItem;
  viCue?: SubtitleItem;
  currentTime: number;
  showEn: boolean;
  showVi: boolean;
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

export function Subtitle({ enCue, viCue, currentTime, showEn, showVi }: SubtitleProps) {
  const enWords = useMemo(() => enCue?.text.split(/\s+/).filter(Boolean) ?? [], [enCue]);
  const activeIndex = useActiveWordIndex(enCue, currentTime, enWords.length);

  if ((!enCue && !viCue) || (!showEn && !showVi)) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 flex justify-center px-4 sm:bottom-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${enCue?.start ?? "x"}-${viCue?.start ?? "x"}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="max-w-3xl rounded-3xl bg-black/55 px-6 py-4 text-center shadow-xl backdrop-blur-sm sm:px-10 sm:py-5"
        >
          {showEn && enCue && (
            <p className="font-heading text-2xl leading-snug font-bold text-white sm:text-4xl">
              {enWords.map((word, i) => (
                <span
                  key={i}
                  className="mx-1 inline-block transition-colors duration-150"
                  style={{
                    color: i === activeIndex ? "#FFD54A" : "#FFFFFF",
                    transform: i === activeIndex ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  {word}
                </span>
              ))}
            </p>
          )}
          {showVi && viCue && (
            <p className="mt-1 font-body text-lg font-semibold text-white/85 sm:text-2xl">
              {viCue.text}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
