import { motion } from "framer-motion";
import { SolidPillButton } from "@/components/Button/Button";
import { IconCheck, IconHome, IconPlay, IconStar } from "@/components/Icon/Icon";

interface StoryEndDialogProps {
  nextTitle: string;
  autoPlayNext: boolean;
  onToggleAutoPlay: () => void;
  onBackToList: () => void;
  onContinue: () => void;
}

export function StoryEndDialog({
  nextTitle,
  autoPlayNext,
  onToggleAutoPlay,
  onBackToList,
  onContinue,
}: StoryEndDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 px-6"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex w-full max-w-sm flex-col items-center gap-4 rounded-[32px] bg-white px-8 py-8 text-center shadow-2xl"
      >
        <IconStar className="h-10 w-10 text-[#FFD54A]" />
        <p className="font-heading text-2xl font-extrabold text-[#5CC8FF] sm:text-3xl">Xong rồi!</p>
        <p className="font-heading text-sm font-medium text-slate-500">
          Truyện tiếp theo: <span className="text-slate-700">{nextTitle}</span>
        </p>

        <div className="mt-1 flex w-full flex-col gap-3">
          <SolidPillButton
            label="Truyện tiếp theo"
            icon={<IconPlay className="h-5 w-5" />}
            color="green"
            ariaLabel="Play next story"
            onClick={onContinue}
            className="w-full justify-center px-8 py-4 text-lg"
          />
          <SolidPillButton
            label="Về danh sách"
            icon={<IconHome className="h-5 w-5" />}
            color="primary"
            ariaLabel="Back to story list"
            onClick={onBackToList}
            className="w-full justify-center px-8 py-4 text-lg"
          />
        </div>

        <button
          type="button"
          onClick={onToggleAutoPlay}
          aria-pressed={autoPlayNext}
          aria-label="Toggle autoplay next story"
          className="mt-1 flex items-center gap-2 font-heading text-sm font-semibold text-slate-500"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
              autoPlayNext ? "border-[#5CC8FF] bg-[#5CC8FF] text-white" : "border-slate-300 text-transparent"
            }`}
          >
            <IconCheck className="h-3.5 w-3.5" />
          </span>
          Tự động phát truyện tiếp theo
        </button>
      </motion.div>
    </motion.div>
  );
}
