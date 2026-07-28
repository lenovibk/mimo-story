import { motion } from "framer-motion";
import { CircleButton } from "@/components/Button/Button";
import { IconCheck, IconMic } from "@/components/Icon/Icon";
import { SoundVisualizer } from "./SoundVisualizer";

interface MicIndicatorProps {
  promptText: string;
  getStream?: () => MediaStream | null;
  onStop: () => void;
}

/** Pulsing mic + prompt + sound visualizer shown while the child is being recorded. */
export function MicIndicator({ promptText, getStream, onStop }: MicIndicatorProps) {
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
        <motion.span
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#FF92C2] text-white shadow-xl"
        >
          <IconMic className="h-9 w-9" />
        </motion.span>
      </div>
      <SoundVisualizer getStream={getStream} />
      <p className="font-heading text-lg font-semibold text-white/85">Listening...</p>
      <CircleButton
        icon={<IconCheck className="h-8 w-8" />}
        color="green"
        size={64}
        ariaLabel="Done speaking"
        onClick={onStop}
      />
      <p className="-mt-3 font-heading text-sm font-semibold text-white/70">
        Nói xong rồi bấm vào đây
      </p>
    </div>
  );
}
