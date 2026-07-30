import { useEffect, useState } from "react";
import { loadSrt } from "@/services/Subtitle/srtParser";
import type { SubtitleItem, Story } from "@/types";

interface SubtitleState {
  en: SubtitleItem[];
  vi: SubtitleItem[];
  loading: boolean;
}

export function useSubtitles(story: Story | undefined): SubtitleState {
  const [state, setState] = useState<SubtitleState>({ en: [], vi: [], loading: true });

  useEffect(() => {
    if (!story) {
      setState({ en: [], vi: [], loading: false });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    Promise.all([
      story.subtitleEn ? loadSrt(story.subtitleEn) : Promise.resolve([]),
      story.subtitleVi ? loadSrt(story.subtitleVi) : Promise.resolve([]),
    ]).then(([en, vi]) => {
      if (cancelled) return;
      setState({ en, vi, loading: false });
    });

    return () => {
      cancelled = true;
    };
  }, [story]);

  return state;
}

export function findActiveCue(cues: SubtitleItem[], time: number): SubtitleItem | undefined {
  return cues.find((cue) => time >= cue.start && time <= cue.end);
}

export function findNearestCue(cues: SubtitleItem[], time: number): SubtitleItem | undefined {
  const active = findActiveCue(cues, time);
  if (active) return active;
  let nearest: SubtitleItem | undefined;
  for (const cue of cues) {
    if (cue.start <= time) nearest = cue;
    else break;
  }
  return nearest ?? cues[0];
}
