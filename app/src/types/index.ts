export interface SubtitleItem {
  start: number;
  end: number;
  text: string;
}

/**
 * Category ids now come from the admin-managed catalog (`GET /api/categories`)
 * instead of a fixed union, so a category slug is just a string. Kept as a
 * named alias (rather than switching call sites to `string`) so intent stays
 * clear at usage sites.
 */
export type StoryCategory = string;

export type StoryTag = "new" | "featured";

export interface Category {
  /** The category's slug, e.g. "animals" - doubles as its id. */
  id: StoryCategory;
  label: string;
  /** Key into the app's fixed icon map, see data/categoryVisuals.tsx. */
  icon: string;
  /** Hex accent color, e.g. "#FF92C2". */
  color: string;
}

export interface Story {
  id: string;
  title: string;
  episodeLabel?: string;
  /** WebP cover image. */
  cover: string;
  /** VP9/Opus WebM video. Not playable on iOS/Safari. */
  video: string;
  /** Runtime in seconds, shown on the story list and as the total in the player's progress readout. */
  duration?: number;
  subtitleEn: string;
  subtitleVi: string;
  category: StoryCategory;
  tags?: StoryTag[];
  accent?: "primary" | "yellow" | "pink" | "green" | "night";
  /** Recommended age range set by admin; either bound may be open-ended. */
  minAge?: number;
  maxAge?: number;
}

export interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  placement: string;
}

export type Gender = "boy" | "girl";

export interface Parent {
  id: string;
  email: string | null;
  plan: "free" | "premium" | "family";
  isGuest: boolean;
}

export interface Child {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  avatarKey: string;
  stars: number;
  /** Reuses `StoryCategory` ids so recommendation scoring is a direct match. */
  interests: StoryCategory[];
}

export interface DashboardStats {
  stars: number;
  totalLearningSeconds: number;
  storiesCompleted: number;
  favoritesCount: number;
  weeklyActivity: { date: string; watchedSeconds: number }[];
  streakDays: number;
}

export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface WordMatch {
  word: string;
  matched: boolean;
}

export interface PronunciationResult {
  transcript: string;
  stars: StarRating;
  passed: boolean;
  /** Expected sentence, in order, flagged with whether the child said each word. */
  words: WordMatch[];
  /** Playable URL for the child's own recording, if capture succeeded. */
  audioUrl?: string;
}
