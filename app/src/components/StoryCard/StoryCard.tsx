import { motion } from "framer-motion";
import { forwardRef } from "react";
import { AnimatedHeart } from "@/components/Icon/Icon";
import type { Story } from "@/types";
import { formatDuration } from "@/utils/time";

const DEFAULT_COVER = "/stories/default-cover.png";

interface StoryCardProps {
  story: Story;
  onSelect: (story: Story) => void;
  /** Whether this card is the one currently centered/focused in the rail. */
  isActive?: boolean;
  /** Watched fraction (0-1). When set, renders a thin progress bar over the cover. */
  progress?: number;
  /** Shrinks the card for dense rails (Continue Learning / New Stories). */
  size?: "default" | "compact";
  /** Shows a heart toggle top-left when a handler is provided. */
  favorite?: boolean;
  onToggleFavorite?: (story: Story) => void;
}

export const StoryCard = forwardRef<HTMLButtonElement, StoryCardProps>(function StoryCard(
  { story, onSelect, isActive = true, progress, size = "default", favorite, onToggleFavorite },
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
      className={`no-select group relative aspect-[3/4] shrink-0 overflow-hidden rounded-[28px] bg-slate-200 text-left shadow-lg ring-4 ${
        size === "compact"
          ? "w-[148px] sm:w-[168px] landscape-compact:w-[128px]"
          : "w-[220px] sm:w-[240px] landscape-compact:w-[160px]"
      } ${isActive ? "shadow-black/20 ring-white" : "shadow-black/10 ring-white/70"}`}
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

      {onToggleFavorite && (
        <motion.span
          role="button"
          tabIndex={0}
          aria-label={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(story);
          }}
          className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm"
        >
          <AnimatedHeart active={!!favorite} size="h-4.5 w-4.5" />
        </motion.span>
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

      <div
        className={`absolute inset-x-0 bottom-0 flex items-end p-4 landscape-compact:p-2.5 ${
          progress !== undefined && progress > 0 ? "pb-[26px]" : ""
        }`}
      >
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

      {progress !== undefined && progress > 0 && (
        <div className="absolute inset-x-3 bottom-3 h-1.5 overflow-hidden rounded-full bg-white/35">
          <div
            className="h-full rounded-full bg-[#8EE28E]"
            style={{ width: `${Math.min(1, progress) * 100}%` }}
          />
        </div>
      )}
    </motion.button>
  );
});
