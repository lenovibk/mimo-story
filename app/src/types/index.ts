export interface SubtitleItem {
  start: number;
  end: number;
  text: string;
}

export type StoryCategory =
  | "animals"
  | "emotions"
  | "body"
  | "family"
  | "weather"
  | "holidays"
  | "school"
  | "activities"
  | "food"
  | "world";

export type StoryTag = "new" | "featured";

export interface Story {
  id: string;
  title: string;
  episodeLabel?: string;
  cover: string;
  video: string;
  subtitleEn: string;
  subtitleVi: string;
  category: StoryCategory;
  tags?: StoryTag[];
  accent?: "primary" | "yellow" | "pink" | "green" | "night";
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
