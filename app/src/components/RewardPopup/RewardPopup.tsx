import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { SolidPillButton } from "@/components/Button/Button";
import { IconMic, IconPause, IconPlay, IconStar, IconStarOutline } from "@/components/Icon/Icon";
import type { StarRating, WordMatch } from "@/types";

const PRAISE = ["Excellent!", "Amazing!", "Great Job!", "Awesome!", "Let's Go!"];
const CONFETTI_COLORS = ["#5CC8FF", "#FFD54A", "#FF92C2", "#8EE28E", "#FFFFFF"];

interface RewardPopupProps {
  stars: StarRating;
  passed: boolean;
  words: WordMatch[];
  audioUrl?: string;
  onContinue: () => void;
  onRetry: () => void;
}

export function RewardPopup({ stars, passed, words, audioUrl, onContinue, onRetry }: RewardPopupProps) {
  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], []);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play();
    }
  };
  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.4 + Math.random() * 0.8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
      })),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/40"
    >
      {passed &&
        confetti.map((c) => (
          <motion.span
            key={c.id}
            initial={{ y: -40, x: `${c.left}vw`, opacity: 1, rotate: 0 }}
            animate={{ y: "100vh", rotate: c.rotate }}
            transition={{ duration: c.duration, delay: c.delay, ease: "easeIn" }}
            className="pointer-events-none absolute top-0 h-3 w-3 rounded-sm"
            style={{ backgroundColor: c.color }}
          />
        ))}

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mx-6 flex flex-col items-center gap-4 rounded-[32px] bg-white px-8 py-8 text-center shadow-2xl sm:px-14 sm:py-10"
      >
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 300 }}
            >
              {i < stars ? (
                <IconStar className="h-9 w-9 text-[#FFD54A] sm:h-11 sm:w-11" />
              ) : (
                <IconStarOutline className="h-9 w-9 text-slate-300 sm:h-11 sm:w-11" />
              )}
            </motion.span>
          ))}
        </div>

        <p className="font-heading text-3xl font-extrabold text-[#5CC8FF] sm:text-4xl">
          {passed ? praise : "Let's try again!"}
        </p>

        {words.length > 0 && (
          <div className="flex max-w-sm flex-wrap items-center justify-center gap-1.5">
            {words.map((w, i) => (
              <span
                key={i}
                className={`rounded-full px-2.5 py-1 font-heading text-sm font-bold ${
                  w.matched
                    ? "bg-[#8EE28E]/25 text-[#3F9142]"
                    : "bg-slate-100 text-slate-400 line-through decoration-2"
                }`}
              >
                {w.word}
              </span>
            ))}
          </div>
        )}

        {audioUrl && (
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={playing ? "Pause your recording" : "Play back your recording"}
            className="flex items-center gap-2 rounded-full bg-[#5CC8FF]/15 py-2 pr-4 pl-2 font-heading text-sm font-bold text-[#2E93C4]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5CC8FF] text-white">
              {playing ? <IconPause className="h-4 w-4" /> : <IconPlay className="h-4 w-4" />}
            </span>
            Hear yourself
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              className="hidden"
            />
          </button>
        )}

        {passed ? (
          <>
            <p className="flex items-center gap-1 font-heading text-lg font-bold text-[#FFD54A]">
              +10 <IconStar className="h-5 w-5" /> Stars
            </p>
            <SolidPillButton
              label="Continue"
              icon={<IconPlay className="h-5 w-5" />}
              color="green"
              ariaLabel="Continue story"
              onClick={onContinue}
              className="mt-1 px-8 py-4 text-xl"
            />
            <button
              type="button"
              onClick={onRetry}
              aria-label="Try again"
              className="font-heading text-sm font-semibold text-slate-400 underline-offset-2 hover:underline"
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <SolidPillButton
              label="Try Again"
              icon={<IconMic className="h-5 w-5" />}
              color="pink"
              ariaLabel="Try again"
              onClick={onRetry}
              className="mt-1 px-8 py-4 text-xl"
            />
            <button
              type="button"
              onClick={onContinue}
              aria-label="Skip practice and continue story"
              className="font-heading text-sm font-semibold text-slate-400 underline-offset-2 hover:underline"
            >
              Skip
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
