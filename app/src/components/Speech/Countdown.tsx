import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface CountdownProps {
  seconds?: number;
  onComplete: () => void;
}

/** Big 3-2-1 countdown shown right before the mic starts listening. */
export function Countdown({ seconds = 3, onComplete }: CountdownProps) {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45">
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.35, ease: "backOut" }}
          className="font-heading text-[10rem] leading-none font-extrabold text-white drop-shadow-lg"
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
