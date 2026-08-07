import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoryProgress {
  /** Watched fraction, 0-1. */
  ratio: number;
  updatedAt: number;
}

interface AppState {
  // Keyed by childId - each child has their own stars/progress/speaking stats.
  starsByChild: Record<string, number>;
  addStars: (childId: string, amount: number) => void;

  shadowingOn: boolean;
  toggleShadowing: () => void;

  storyProgressByChild: Record<string, Record<string, StoryProgress>>;
  setStoryProgress: (childId: string, storyId: string, ratio: number) => void;

  speakingAttemptsByChild: Record<string, number>;
  incrementSpeakingAttempts: (childId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      starsByChild: {},
      addStars: (childId, amount) =>
        set((state) => ({
          starsByChild: { ...state.starsByChild, [childId]: (state.starsByChild[childId] ?? 0) + amount },
        })),

      shadowingOn: false,
      toggleShadowing: () => set((state) => ({ shadowingOn: !state.shadowingOn })),

      storyProgressByChild: {},
      setStoryProgress: (childId, storyId, ratio) =>
        set((state) => ({
          storyProgressByChild: {
            ...state.storyProgressByChild,
            [childId]: {
              ...state.storyProgressByChild[childId],
              [storyId]: { ratio: Math.min(1, Math.max(0, ratio)), updatedAt: Date.now() },
            },
          },
        })),

      speakingAttemptsByChild: {},
      incrementSpeakingAttempts: (childId) =>
        set((state) => ({
          speakingAttemptsByChild: {
            ...state.speakingAttemptsByChild,
            [childId]: (state.speakingAttemptsByChild[childId] ?? 0) + 1,
          },
        })),
    }),
    { name: "mimokids-app" }
  )
);
