import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/services/api";

interface VocabProgressState {
  // Keyed by childId -> vocabId -> "known" | "new".
  statusByChild: Record<string, Record<string, "known" | "new">>;

  isKnown: (childId: string, vocabId: string) => boolean;
  loadProgress: (childId: string) => Promise<void>;
  setKnown: (childId: string, vocabId: string, known: boolean) => Promise<void>;
}

/** A child's per-word flashcard self-check ("Đã thuộc" / "Cần ôn thêm") - same
 * load-once + optimistic-toggle shape as useFavoritesStore. */
export const useVocabProgressStore = create<VocabProgressState>()(
  persist(
    (set, get) => ({
      statusByChild: {},

      isKnown: (childId, vocabId) => get().statusByChild[childId]?.[vocabId] === "known",

      loadProgress: async (childId) => {
        const progress = await api.getVocabProgress(childId);
        const map: Record<string, "known" | "new"> = {};
        for (const p of progress) map[p.vocabId] = p.status === "known" ? "known" : "new";
        set((state) => ({ statusByChild: { ...state.statusByChild, [childId]: map } }));
      },

      setKnown: async (childId, vocabId, known) => {
        const current = get().statusByChild[childId] ?? {};
        const previous = current[vocabId];
        const next = { ...current, [vocabId]: known ? ("known" as const) : ("new" as const) };

        set((state) => ({ statusByChild: { ...state.statusByChild, [childId]: next } }));

        try {
          await api.setVocabProgress(childId, vocabId, known ? "known" : "new");
        } catch {
          // Roll back on failure.
          set((state) => ({
            statusByChild: { ...state.statusByChild, [childId]: { ...next, [vocabId]: previous ?? "new" } },
          }));
        }
      },
    }),
    { name: "mimokids-vocab-progress" }
  )
);
