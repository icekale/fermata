import { en, type MessageKey } from "./en";
import { zh } from "./zh";

export type { MessageKey } from "./en";

/* Two locales, chosen once and carried through the process. The stored setting
   is "system" by default, and both processes resolve it themselves: the
   renderer from `navigator.language`, the main process from `app.getLocale()`,
   so the tray menu is translated in the same language as the window without
   the renderer having to tell it what that is. */
export type Locale = "en" | "zh";
export type LanguageSetting = "system" | Locale;

export const locales: Locale[] = ["en", "zh"];

export const dictionaries: Record<Locale, Record<MessageKey, string>> = {
  en,
  zh,
};

/** Anything whose tag starts with `zh` reads Chinese; everything else English. */
export function localeFromTag(tag: string | undefined): Locale {
  return tag?.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function resolveLocale(
  setting: LanguageSetting,
  systemTag: string | undefined,
): Locale {
  return setting === "system" ? localeFromTag(systemTag) : setting;
}

type Vars = Record<string, string | number>;

/** Missing key -> the key itself, so a gap is visible in the UI rather than
    rendering "undefined" inside a sentence. */
export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Vars,
): string {
  const template = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  if (vars === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = vars[name];
    return value === undefined ? whole : String(value);
  });
}

/** Count-sensitive keys are authored as `.one` / `.other` pairs; Chinese has no
    plural form and simply gives both keys the same wording. */
export function pluralKey(base: string, count: number): MessageKey {
  return (count === 1 ? `${base}.one` : `${base}.other`) as MessageKey;
}

export function isLocale(value: string): value is Locale {
  return (locales as string[]).includes(value);
}
