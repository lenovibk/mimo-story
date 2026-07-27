import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoryProgress {
  /** Watched fraction, 0-1. */
  ratio: number;
  updatedAt: number;
}

interface AppState {
  stars: number;
  addStars: (amount: number) => void;

  subtitleEnOn: boolean;
  subtitleViOn: boolean;
  shadowingOn: boolean;
  toggleSubtitleEn: () => void;
  toggleSubtitleVi: () => void;
  toggleShadowing: () => void;

  autoPlayNext: boolean;
  toggleAutoPlayNext: () => void;

  storyProgress: Record<string, StoryProgress>;
  setStoryProgress: (storyId: string, ratio: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      stars: 0,
      addStars: (amount) => set((state) => ({ stars: state.stars + amount })),

      subtitleEnOn: true,
      subtitleViOn: true,
      shadowingOn: false,
      toggleSubtitleEn: () => set((state) => ({ subtitleEnOn: !state.subtitleEnOn })),
      toggleSubtitleVi: () => set((state) => ({ subtitleViOn: !state.subtitleViOn })),
      toggleShadowing: () => set((state) => ({ shadowingOn: !state.shadowingOn })),

      autoPlayNext: false,
      toggleAutoPlayNext: () => set((state) => ({ autoPlayNext: !state.autoPlayNext })),

      storyProgress: {},
      setStoryProgress: (storyId, ratio) =>
        set((state) => ({
          storyProgress: {
            ...state.storyProgress,
            [storyId]: { ratio: Math.min(1, Math.max(0, ratio)), updatedAt: Date.now() },
          },
        })),
    }),
    { name: "mimokids-app" }
  )
);
