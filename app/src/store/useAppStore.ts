import { create } from "zustand";
import { persist } from "zustand/middleware";

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
    }),
    { name: "mimokids-app" }
  )
);
