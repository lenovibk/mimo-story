import { motion } from "framer-motion";
import { forwardRef } from "react";
import { AnimatedHeart } from "@/components/Icon/Icon";
import { useTranslation } from "@/i18n/useTranslation";
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
  /** "square" is a smaller, near-1:1 chip used for the Favorites shelf, so it reads as its
   * own compact "collection" item instead of another full-size lesson card. */
  shape?: "portrait" | "square";
  /** Shows a heart toggle top-left when a handler is provided. */
  favorite?: boolean;
  onToggleFavorite?: (story: Story) => void;
}

export const StoryCard = forwardRef<HTMLButtonElement, StoryCardProps>(function StoryCard(
  { story, onSelect, isActive = true, progress, size = "default", shape = "portrait", favorite, onToggleFavorite },
  ref
) {
  const { t } = useTranslation();
  const isSquare = shape === "square";
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
      className={`no-select group relative shrink-0 overflow-hidden bg-slate-200 text-left shadow-lg ring-4 ${
        isSquare
          ? "aspect-square w-[112px] rounded-[20px] sm:w-[128px]"
          : `aspect-[3/4] rounded-[28px] ${
              size === "compact"
                ? "w-[148px] sm:w-[168px] landscape-compact:w-[128px]"
                : "w-[220px] sm:w-[240px] landscape-compact:w-[160px]"
            }`
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
          className={`pointer-events-none absolute inset-0 ring-4 ring-[#FFD54A]/80 ${
            isSquare ? "rounded-[16px]" : "rounded-[24px]"
          }`}
        />
      )}

      {onToggleFavorite && (
        <motion.span
          role="button"
          tabIndex={0}
          aria-label={favorite ? t("common.favoriteRemove") : t("common.favoriteAdd")}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(story);
          }}
          className={`absolute z-10 flex items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm ${
            isSquare ? "top-1.5 left-1.5 h-6 w-6" : "top-3 left-3 h-8 w-8"
          }`}
        >
          <AnimatedHeart active={!!favorite} size={isSquare ? "h-3.5 w-3.5" : "h-4.5 w-4.5"} />
        </motion.span>
      )}

      {(story.tags?.includes("new") || story.tags?.includes("featured")) && (
        <div
          className={`absolute flex flex-col items-end gap-1.5 ${isSquare ? "top-1.5 right-1.5" : "top-3 right-3"}`}
        >
          {story.tags?.includes("new") && (
            <span
              className={`rounded-full bg-[#FF92C2] font-heading font-bold text-white shadow-md ${
                isSquare ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
              }`}
            >
              {t("common.tagNew")}
            </span>
          )}
          {story.tags?.includes("featured") && (
            <span
              className={`rounded-full bg-[#FFD54A] font-heading font-bold text-white shadow-md ${
                isSquare ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
              }`}
            >
              {t("common.tagFeatured")}
            </span>
          )}
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 flex items-end ${isSquare ? "p-2" : "p-4 landscape-compact:p-2.5"} ${
          progress !== undefined && progress > 0 ? (isSquare ? "pb-[18px]" : "pb-[26px]") : ""
        }`}
      >
        <div className="font-heading text-white drop-shadow-md">
          <p
            className={
              isSquare
                ? "line-clamp-1 text-xs leading-tight font-bold"
                : "text-lg leading-tight font-bold landscape-compact:text-sm"
            }
          >
            {story.title}
          </p>
          {!isSquare && (story.episodeLabel || story.duration !== undefined) && (
            <p className="text-sm font-semibold text-white/85 landscape-compact:text-xs">
              {story.episodeLabel}
              {story.episodeLabel && story.duration !== undefined && " • "}
              {story.duration !== undefined && formatDuration(story.duration)}
            </p>
          )}
          {isSquare && story.duration !== undefined && (
            <p className="text-[10px] font-semibold text-white/85">{formatDuration(story.duration)}</p>
          )}
        </div>
      </div>

      {progress !== undefined && progress > 0 && (
        <div
          className={`absolute h-1.5 overflow-hidden rounded-full bg-white/35 ${
            isSquare ? "inset-x-2 bottom-2" : "inset-x-3 bottom-3"
          }`}
        >
          <div
            className="h-full rounded-full bg-[#8EE28E]"
            style={{ width: `${Math.min(1, progress) * 100}%` }}
          />
        </div>
      )}
    </motion.button>
  );
});
