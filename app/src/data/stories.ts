import type { Story } from "@/types";

/**
 * Each entry points at a folder under /public/stories/<id>/ containing
 * cover.jpg, video.mp4, subtitle_en.srt and subtitle_vi.srt (see design/design.md).
 * Add a new story by dropping in a folder with those four files and one entry here.
 */
export const stories: Story[] = [
  {
    id: "story001",
    title: "Bat and Friends",
    episodeLabel: "Tập 01",
    cover: "/stories/story001/cover.jpg",
    video: "/stories/story001/video.mp4",
    subtitleEn: "/stories/story001/subtitle_en.srt",
    subtitleVi: "/stories/story001/subtitle_vi.srt",
    isNew: true,
    accent: "primary",
  },
];

export function getStoryById(id: string): Story | undefined {
  return stories.find((story) => story.id === id);
}
