import { useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore, type Language } from "@/store/useSettingsStore";
import { translate, type TranslationKey } from "./translate";

/**
 * Resolves the active UI language from the current child profile's settings (falling back to
 * `lastLanguage` on pre-child screens like Splash/Onboarding/SelectChild), and returns a `t()`
 * helper plus a setter that persists language changes to that profile (see useSettingsStore).
 */
export function useTranslation() {
  const activeChildId = useAuthStore((s) => s.activeChildId);
  const language = useSettingsStore((s) => s.getSettings(activeChildId).language);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const setLastLanguage = useSettingsStore((s) => s.setLastLanguage);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language]
  );

  const setLanguage = useCallback(
    (next: Language) => {
      setLastLanguage(next);
      if (activeChildId) updateSettings(activeChildId, { language: next });
    },
    [activeChildId, setLastLanguage, updateSettings]
  );

  return { t, language, setLanguage };
}
