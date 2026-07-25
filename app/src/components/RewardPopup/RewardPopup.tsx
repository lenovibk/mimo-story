import { motion } from "framer-motion";
import { useMemo } from "react";
import { SolidPillButton } from "@/components/Button/Button";
import type { StarRating } from "@/types";

const PRAISE = ["Excellent!", "Amazing!", "Great Job!", "Awesome!", "Let's Go!"];
const CONFETTI_COLORS = ["#5CC8FF", "#FFD54A", "#FF92C2", "#8EE28E", "#FFFFFF"];

interface RewardPopupProps {
  stars: StarRating;
  passed: boolean;
  onContinue: () => void;
  onRetry: () => void;
}

export function RewardPopup({ stars, passed, onContinue, onRetry }: RewardPopupProps) {
  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], []);
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
        <div className="flex gap-1 text-4xl sm:text-5xl">
          {Array.from({ length: 5 }, (_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 300 }}
            >
              {i < stars ? "⭐" : "☆"}
            </motion.span>
          ))}
        </div>

        <p className="font-heading text-3xl font-extrabold text-[#5CC8FF] sm:text-4xl">
          {passed ? praise : "Let's try again!"}
        </p>

        {passed ? (
          <>
            <p className="font-heading text-lg font-bold text-[#FFD54A]">+10 ⭐ Stars</p>
            <SolidPillButton
              label="Continue"
              icon="▶"
              color="green"
              ariaLabel="Continue story"
              onClick={onContinue}
              className="mt-1 px-8 py-4 text-xl"
            />
          </>
        ) : (
          <SolidPillButton
            label="Try Again"
            icon="🎤"
            color="pink"
            ariaLabel="Try again"
            onClick={onRetry}
            className="mt-1 px-8 py-4 text-xl"
          />
        )}
      </motion.div>
    </motion.div>
  );
}
