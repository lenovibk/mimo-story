import { en } from "./locales/en";
import { vi, type Translations } from "./locales/vi";

export type Locale = "vi" | "en";
export type { Translations };

export const locales: Record<Locale, Translations> = { vi, en };

export const DEFAULT_LOCALE: Locale = "vi";

/** Dotted-path union of every leaf string key in the translation tree, e.g. "settings.title". */
export type TranslationKey = NestedKeyOf<Translations>;

type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${NestedKeyOf<T[K]>}`;
}[keyof T & string];

function resolve(dict: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) return (acc as Record<string, unknown>)[part];
    return undefined;
  }, dict);
}

/** Resolves a dotted translation key against a locale's dictionary, with `{{var}}` interpolation. */
export function translate(locale: Locale, key: TranslationKey, vars?: Record<string, string | number>): string {
  const raw = resolve(locales[locale], key);
  const text = typeof raw === "string" ? raw : key;
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(vars[name] ?? ""));
}
