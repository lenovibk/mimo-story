import type { Child, Story } from "@/types";

/** Simple content-based score: interest match beats "featured" beats "not yet watched". */
function scoreStory(story: Story, child: Child, watchedStoryIds: Set<string>): number {
  let score = 0;
  if (child.interests.includes(story.category)) score += 3;
  if (story.tags?.includes("featured")) score += 1;
  if (!watchedStoryIds.has(story.id)) score += 1;
  return score;
}

export function recommendStories(
  stories: Story[],
  child: Child,
  storyProgress: Record<string, { ratio: number }>,
  limit = 12
): Story[] {
  const watched = new Set(Object.keys(storyProgress).filter((id) => storyProgress[id].ratio > 0.02));

  return stories
    .map((story) => ({ story, score: scoreStory(story, child, watched) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.story);
}
