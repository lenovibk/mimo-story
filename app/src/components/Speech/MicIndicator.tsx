import { motion } from "framer-motion";

interface MicIndicatorProps {
  promptText: string;
}

/** Pulsing mic + prompt shown while the child is being recorded. */
export function MicIndicator({ promptText }: MicIndicatorProps) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/45 px-6 text-center">
      <p className="max-w-xl font-heading text-2xl font-bold text-white sm:text-3xl">
        {promptText}
      </p>
      <div className="relative flex h-28 w-28 items-center justify-center">
        <motion.span
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-[#FF92C2]"
        />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#FF92C2] text-4xl shadow-xl">
          🎤
        </span>
      </div>
      <p className="font-heading text-lg font-semibold text-white/85">Listening...</p>
    </div>
  );
}
