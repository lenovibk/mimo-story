import { motion } from "framer-motion";
import { forwardRef } from "react";
import type { Story } from "@/types";
import { formatDuration } from "@/utils/time";

const DEFAULT_COVER = "/stories/default-cover.png";

interface StoryCardProps {
  story: Story;
  onSelect: (story: Story) => void;
  /** Whether this card is the one currently centered/focused in the rail. */
  isActive?: boolean;
}

export const StoryCard = forwardRef<HTMLButtonElement, StoryCardProps>(function StoryCard(
  { story, onSelect, isActive = true },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={() => onSelect(story)}
      whileTap={{ scale: 1.05, rotate: -1.5 }}
      whileHover={{ rotate: isActive ? [0, -1.5, 1.5, 0] : 0 }}
      animate={{
        scale: isActive ? 1 : 0.9,
        opacity: isActive ? 1 : 0.7,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`no-select group relative aspect-[3/4] w-[220px] shrink-0 overflow-hidden rounded-[28px] bg-slate-200 text-left shadow-lg ring-4 sm:w-[240px] landscape-compact:w-[160px] ${
        isActive ? "shadow-black/20 ring-white" : "shadow-black/10 ring-white/70"
      }`}
    >
      <img
        src={story.cover}
        alt=""
        draggable={false}
        onError={(e) => {
          const img = e.currentTarget;
          if (img.src.endsWith(DEFAULT_COVER)) return;
          img.src = DEFAULT_COVER;
        }}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10" />

      {isActive && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0 rounded-[24px] ring-4 ring-[#FFD54A]/80"
        />
      )}

      {(story.tags?.includes("new") || story.tags?.includes("featured")) && (
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {story.tags?.includes("new") && (
            <span className="rounded-full bg-[#FF92C2] px-3 py-1 font-heading text-xs font-bold text-white shadow-md">
              Mới
            </span>
          )}
          {story.tags?.includes("featured") && (
            <span className="rounded-full bg-[#FFD54A] px-3 py-1 font-heading text-xs font-bold text-white shadow-md">
              Đặc sắc
            </span>
          )}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end p-4 landscape-compact:p-2.5">
        <div className="font-heading text-white drop-shadow-md">
          <p className="text-lg leading-tight font-bold landscape-compact:text-sm">{story.title}</p>
          {(story.episodeLabel || story.duration !== undefined) && (
            <p className="text-sm font-semibold text-white/85 landscape-compact:text-xs">
              {story.episodeLabel}
              {story.episodeLabel && story.duration !== undefined && " • "}
              {story.duration !== undefined && formatDuration(story.duration)}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
});
