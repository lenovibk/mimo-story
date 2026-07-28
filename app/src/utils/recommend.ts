import type { Child, Story } from "@/types";

/** +2 for a story whose admin-set age range fits the child, -2 if it clearly doesn't
 * (both bounds set and the child falls outside them), 0 when the story has no age tags. */
function ageFitScore(story: Story, child: Child): number {
  const { minAge, maxAge } = story;
  if (minAge == null && maxAge == null) return 0;
  const fits = (minAge == null || child.age >= minAge) && (maxAge == null || child.age <= maxAge);
  return fits ? 2 : -2;
}

/** Simple content-based score: interest match beats age fit beats "featured" beats "not yet watched". */
function scoreStory(story: Story, child: Child, watchedStoryIds: Set<string>): number {
  let score = 0;
  if (child.interests.includes(story.category)) score += 3;
  score += ageFitScore(story, child);
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
