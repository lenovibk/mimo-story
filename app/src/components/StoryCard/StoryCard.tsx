import { motion } from "framer-motion";
import { forwardRef } from "react";
import type { Story } from "@/types";

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
      whileTap={{ scale: 1.05 }}
      animate={{
        scale: isActive ? 1 : 0.9,
        y: isActive ? -8 : 0,
        opacity: isActive ? 1 : 0.7,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`no-select group relative aspect-[3/4] w-[220px] shrink-0 overflow-hidden rounded-[28px] bg-slate-200 text-left shadow-lg ring-4 sm:w-[240px] ${
        isActive ? "shadow-black/20 ring-white" : "shadow-black/10 ring-white/70"
      }`}
    >
      <picture>
        {story.coverWebp && <source srcSet={story.coverWebp} type="image/webp" />}
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
      </picture>
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

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
        <div className="font-heading text-white drop-shadow-md">
          <p className="text-lg leading-tight font-bold">{story.title}</p>
          {story.episodeLabel && (
            <p className="text-sm font-semibold text-white/85">{story.episodeLabel}</p>
          )}
        </div>
        <motion.span
          animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={{ duration: 1.6, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#5CC8FF] shadow-md"
        >
          <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current">
            <path d="M8 5v14l11-7z" />
          </svg>
        </motion.span>
      </div>
    </motion.button>
  );
});
