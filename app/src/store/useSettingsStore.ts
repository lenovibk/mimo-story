import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "vi" | "en";
export type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5;

export interface ChildSettings {
  language: Language;
  subtitleEnOn: boolean;
  subtitleViOn: boolean;
  autoPlayNext: boolean;
  playbackSpeed: PlaybackSpeed;
  soundEffectsOn: boolean;
  /** 0-1 */
  soundEffectsVolume: number;
  /** null = no daily limit. */
  dailyLimitMinutes: number | null;
}

const DEFAULT_SETTINGS_BASE: Omit<ChildSettings, "language"> = {
  subtitleEnOn: true,
  subtitleViOn: true,
  autoPlayNext: false,
  playbackSpeed: 1,
  soundEffectsOn: true,
  soundEffectsVolume: 1,
  dailyLimitMinutes: null,
};

// `getSettings` returns one of these two fixed objects (never a fresh literal) when a child has
// no saved settings yet. Zustand v5's subscription is built on useSyncExternalStore, which requires
// getSnapshot to return a referentially stable value for an unchanged state slice - a selector like
// `useSettingsStore((s) => s.getSettings(childId))` that built `{ ...DEFAULT_SETTINGS, ... }` fresh on
// every call broke that contract and produced a render loop (React error #185 - blank screen) for
// every child that hadn't customized any setting yet, i.e. everyone on first load of this feature.
const DEFAULT_SETTINGS_BY_LANGUAGE: Record<Language, ChildSettings> = {
  vi: { ...DEFAULT_SETTINGS_BASE, language: "vi" },
  en: { ...DEFAULT_SETTINGS_BASE, language: "en" },
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SettingsState {
  /** Fallback language for screens reached before a child profile is active (Splash, Onboarding, SelectChild). */
  lastLanguage: Language;
  /** Per-child preferences - every setting in this feature is scoped to a profile, not the device. */
  settingsByChild: Record<string, ChildSettings>;
  /** Client-side "seconds watched today" accumulator per child, backing the parental daily-limit setting. */
  watchedTodayByChild: Record<string, { date: string; seconds: number }>;

  getSettings: (childId: string | null | undefined) => ChildSettings;
  updateSettings: (childId: string, patch: Partial<ChildSettings>) => void;
  setLastLanguage: (language: Language) => void;
  addWatchedSecondsToday: (childId: string, seconds: number) => void;
  getWatchedTodaySeconds: (childId: string) => number;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      lastLanguage: "vi",
      settingsByChild: {},
      watchedTodayByChild: {},

      getSettings: (childId) => {
        const state = get();
        const existing = childId ? state.settingsByChild[childId] : undefined;
        return existing ?? DEFAULT_SETTINGS_BY_LANGUAGE[state.lastLanguage];
      },

      updateSettings: (childId, patch) =>
        set((state) => {
          const merged = { ...state.getSettings(childId), ...patch };
          return {
            settingsByChild: { ...state.settingsByChild, [childId]: merged },
            lastLanguage: patch.language ?? state.lastLanguage,
          };
        }),

      setLastLanguage: (language) => set({ lastLanguage: language }),

      addWatchedSecondsToday: (childId, seconds) =>
        set((state) => {
          const today = todayKey();
          const entry = state.watchedTodayByChild[childId];
          const base = entry?.date === today ? entry.seconds : 0;
          return {
            watchedTodayByChild: {
              ...state.watchedTodayByChild,
              [childId]: { date: today, seconds: base + Math.max(0, seconds) },
            },
          };
        }),

      getWatchedTodaySeconds: (childId) => {
        const entry = get().watchedTodayByChild[childId];
        return entry?.date === todayKey() ? entry.seconds : 0;
      },
    }),
    { name: "mimokids-settings" }
  )
);
