import { motion } from "framer-motion";
import { AnimatedHeart } from "@/components/Icon/Icon";
import type { Story } from "@/types";
import { formatDuration } from "@/utils/time";

const DEFAULT_COVER = "/stories/default-cover.png";

interface StoryCardListRowProps {
  story: Story;
  onSelect: (story: Story) => void;
  progress?: number;
  favorite?: boolean;
  onToggleFavorite?: (story: Story) => void;
}

/** A compact horizontal "history" tile - small square thumbnail on the left, title/meta on
 * the right - used for the Recently Watched shelf so it reads like a watch-history list
 * rather than another rail of big cover cards. */
export function StoryCardListRow({ story, onSelect, progress, favorite, onToggleFavorite }: StoryCardListRowProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(story)}
      whileTap={{ scale: 0.97 }}
      className="no-select flex w-[236px] shrink-0 items-center gap-3 rounded-[20px] bg-white/90 p-2 text-left shadow-md ring-2 ring-white sm:w-[260px]"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-200 sm:h-16 sm:w-16">
        <img
          src={story.cover}
          alt=""
          draggable={false}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.endsWith(DEFAULT_COVER)) return;
            img.src = DEFAULT_COVER;
          }}
          className="h-full w-full object-cover"
        />
        {progress !== undefined && progress > 0 && (
          <div className="absolute inset-x-1 bottom-1 h-1 overflow-hidden rounded-full bg-white/50">
            <div
              className="h-full rounded-full bg-[#8EE28E]"
              style={{ width: `${Math.min(1, progress) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-bold text-slate-700">{story.title}</p>
        {(story.episodeLabel || story.duration !== undefined) && (
          <p className="truncate font-body text-xs font-semibold text-slate-400">
            {story.episodeLabel}
            {story.episodeLabel && story.duration !== undefined && " • "}
            {story.duration !== undefined && formatDuration(story.duration)}
          </p>
        )}
      </div>

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
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400"
        >
          <AnimatedHeart active={!!favorite} size="h-4 w-4" />
        </motion.span>
      )}
    </motion.button>
  );
}
