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

/** A "chương trình học" (curriculum track), e.g. Truyện / Bài hát / Podcast. */
export interface Program {
  /** The program's slug, e.g. "truyen" - doubles as its id. */
  id: string;
  label: string;
  /** Key into the app's fixed icon map, see data/programVisuals.tsx. */
  icon: string;
  color: string;
  /** Discrete ages this program applies to (3,4,5,6,7 - 7 meaning "7+"). */
  ages: number[];
  /** Category slugs this program's content is drawn from. */
  categoryIds: StoryCategory[];
}

export interface Story {
  id: string;
  title: string;
  episodeLabel?: string;
  /** WebP cover image. */
  cover: string;
  /** VP9/Opus WebM video. Not playable on iOS/Safari. Absent for audio-only content. */
  video?: string;
  /** "UPLOAD" | "YOUTUBE" - when YOUTUBE, `video` is absent and `youtubeId` drives playback instead. */
  videoSourceType: string;
  youtubeId?: string;
  /** Runtime in seconds, shown on the story list and as the total in the player's progress readout. */
  duration?: number;
  subtitleEn?: string;
  subtitleVi?: string;
  /** Present when mediaType is "AUDIO" (songs/podcasts). */
  audio?: string;
  /** "VIDEO" | "AUDIO" */
  mediaType: string;
  category: StoryCategory;
  /** Program slugs this content belongs to - a story can be shared across multiple programs. */
  programs: string[];
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

/** One vocabulary word for a story's lesson panel - optionally anchored to the EN subtitle
 * cue it's spoken in (cueStart matches SubtitleItem.start) so the player can highlight/tap
 * it at the right moment. Admin-managed, see server VocabItem model. */
export interface VocabItem {
  id: string;
  cueStart: number | null;
  word: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  imageUrl: string | null;
}

export interface GrammarPoint {
  id: string;
  cueStart: number | null;
  title: string;
  structure: string | null;
  explanationVi: string;
  exampleEn: string;
  exampleVi: string;
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
