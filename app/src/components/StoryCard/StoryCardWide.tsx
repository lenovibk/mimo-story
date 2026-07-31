import { motion } from "framer-motion";
import { AnimatedHeart } from "@/components/Icon/Icon";
import type { Story } from "@/types";
import { formatDuration } from "@/utils/time";

const DEFAULT_COVER = "/stories/default-cover.png";

interface StoryCardWideProps {
  story: Story;
  onSelect: (story: Story) => void;
  favorite?: boolean;
  onToggleFavorite?: (story: Story) => void;
}

/** A wide, "editorial pick" card - landscape cover on top, title below instead of overlaid -
 * used for the Recommended shelf so a suggestion visually reads as a different kind of item
 * than a regular lesson card, more like a featured pick than a rail of interchangeable covers. */
export function StoryCardWide({ story, onSelect, favorite, onToggleFavorite }: StoryCardWideProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(story)}
      whileTap={{ scale: 1.03 }}
      whileHover={{ y: -2 }}
      className="no-select group w-[200px] shrink-0 overflow-hidden rounded-[22px] bg-white text-left shadow-lg ring-4 ring-white sm:w-[220px]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
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
            className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm"
          >
            <AnimatedHeart active={!!favorite} size="h-4 w-4" />
          </motion.span>
        )}

        {(story.tags?.includes("new") || story.tags?.includes("featured")) && (
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            {story.tags?.includes("new") && (
              <span className="rounded-full bg-[#FF92C2] px-2.5 py-0.5 font-heading text-[10px] font-bold text-white shadow-md">
                Mới
              </span>
            )}
            {story.tags?.includes("featured") && (
              <span className="rounded-full bg-[#FFD54A] px-2.5 py-0.5 font-heading text-[10px] font-bold text-white shadow-md">
                Đặc sắc
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-2.5">
        <p className="line-clamp-1 font-heading text-sm font-bold text-slate-700">{story.title}</p>
        {(story.episodeLabel || story.duration !== undefined) && (
          <p className="mt-0.5 truncate font-body text-xs font-semibold text-slate-400">
            {story.episodeLabel}
            {story.episodeLabel && story.duration !== undefined && " • "}
            {story.duration !== undefined && formatDuration(story.duration)}
          </p>
        )}
      </div>
    </motion.button>
  );
}
