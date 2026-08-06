import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { GrammarPoint, Story, VocabItem } from "@/types";

interface VocabularyState {
  vocab: VocabItem[];
  grammar: GrammarPoint[];
  loading: boolean;
}

/** Fetches a story's admin-authored vocabulary/grammar lesson content once per story -
 * mirrors useSubtitles' load-on-story-change shape. */
export function useVocabulary(story: Story | undefined): VocabularyState {
  const [state, setState] = useState<VocabularyState>({ vocab: [], grammar: [], loading: true });

  useEffect(() => {
    if (!story) {
      setState({ vocab: [], grammar: [], loading: false });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    Promise.all([api.getStoryVocabulary(story.id), api.getStoryGrammar(story.id)])
      .then(([vocab, grammar]) => {
        if (cancelled) return;
        setState({ vocab, grammar, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ vocab: [], grammar: [], loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [story]);

  return state;
}

/** Finds the vocab word(s) anchored to the cue currently on screen, so the Subtitle
 * component knows which words inside the EN line to make tappable. */
export function vocabForCue(vocab: VocabItem[], cueStart: number | undefined): VocabItem[] {
  if (cueStart === undefined) return [];
  return vocab.filter((v) => v.cueStart != null && Math.abs(v.cueStart - cueStart) < 0.05);
}
