import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/services/api";

interface FavoritesState {
  // Keyed by childId -> set of storyId (stored as array for persist-friendliness).
  favoritesByChild: Record<string, string[]>;

  isFavorite: (childId: string, storyId: string) => boolean;
  loadFavorites: (childId: string) => Promise<void>;
  toggleFavorite: (childId: string, storyId: string) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoritesByChild: {},

      isFavorite: (childId, storyId) => (get().favoritesByChild[childId] ?? []).includes(storyId),

      loadFavorites: async (childId) => {
        const favorites = await api.getFavorites(childId);
        set((state) => ({ favoritesByChild: { ...state.favoritesByChild, [childId]: favorites } }));
      },

      toggleFavorite: async (childId, storyId) => {
        const current = get().favoritesByChild[childId] ?? [];
        const isFav = current.includes(storyId);
        const next = isFav ? current.filter((id) => id !== storyId) : [...current, storyId];

        // Optimistic update - the child shouldn't wait on a network round-trip to see the heart fill in.
        set((state) => ({ favoritesByChild: { ...state.favoritesByChild, [childId]: next } }));

        try {
          if (isFav) await api.removeFavorite(childId, storyId);
          else await api.addFavorite(childId, storyId);
        } catch {
          // Roll back on failure.
          set((state) => ({ favoritesByChild: { ...state.favoritesByChild, [childId]: current } }));
        }
      },
    }),
    { name: "mimokids-favorites" }
  )
);
