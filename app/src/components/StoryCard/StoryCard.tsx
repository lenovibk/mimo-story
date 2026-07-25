import { motion } from "framer-motion";
import type { Story } from "@/types";

interface StoryCardProps {
  story: Story;
  onSelect: (story: Story) => void;
}

export function StoryCard({ story, onSelect }: StoryCardProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(story)}
      whileTap={{ scale: 1.05 }}
      whileHover={{ y: -6 }}
      className="no-select group relative aspect-[3/4] w-[220px] shrink-0 overflow-hidden rounded-[28px] bg-slate-200 text-left shadow-lg shadow-black/10 ring-4 ring-white sm:w-[240px]"
    >
      <img
        src={story.cover}
        alt=""
        draggable={false}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10" />

      {story.isNew && (
        <span className="absolute top-3 right-3 rounded-full bg-[#FF92C2] px-3 py-1 font-heading text-xs font-bold text-white shadow-md">
          Mới
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
        <div className="font-heading text-white drop-shadow-md">
          <p className="text-lg leading-tight font-bold">{story.title}</p>
          {story.episodeLabel && (
            <p className="text-sm font-semibold text-white/85">{story.episodeLabel}</p>
          )}
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#5CC8FF] shadow-md">
          <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    </motion.button>
  );
}
