import { create } from "zustand";
import { api } from "@/services/api";
import type { Category, Program, Story } from "@/types";

interface CatalogState {
  stories: Story[];
  categories: Category[];
  programs: Program[];
  loaded: boolean;
  loading: boolean;

  load: () => Promise<void>;
  getStoryById: (id: string) => Story | undefined;
}

/** Stories/categories/programs used to be hardcoded arrays; now they come from the
 * admin-managed catalog API. Fetched once per app session and shared from
 * here instead of every page re-fetching. */
export const useCatalogStore = create<CatalogState>()((set, get) => ({
  stories: [],
  categories: [],
  programs: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const [stories, categories, programs] = await Promise.all([api.getStories(), api.getCategories(), api.getPrograms()]);
      set({ stories, categories, programs, loaded: true });
    } catch {
      // Leave `loaded: false` so a later mount/hook call retries.
    } finally {
      set({ loading: false });
    }
  },

  getStoryById: (id) => get().stories.find((s) => s.id === id),
}));
