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
            <p className="mt-0.5 font-body text-sm font-semibold text-white/85 sm:mt-1 sm:text-2xl landscape-compact:mt-0 landscape-compact:text-xs">
              {viCue.text}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
