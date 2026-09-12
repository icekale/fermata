import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type LanguageSetting,
  type Locale,
  type MessageKey,
  localeFromTag,
  resolveLocale,
  translate,
} from "../i18n";

interface LocaleValue {
  locale: Locale;
  setLanguage: (setting: LanguageSetting) => void;
}

const LocaleContext = createContext<LocaleValue>({
  locale: "en",
  setLanguage: () => {},
});

type Vars = Record<string, string | number>;

/* The provider reads the stored language itself rather than waiting to be told.

   It has to: three separate windows (settings, break, sounds) each load settings
   on their own, and the break window is the one that most needs the right
   language — it is full screen and unasked for. Asking each of them to thread
   the setting down to a provider would be three chances to forget.

   Until the store answers, the locale comes from the OS tag, so a Chinese Mac
   paints its first frame in Chinese and the stored setting only ever refines
   that. The alternative is one frame of English, which on a full-screen break
   sheet is a visible flicker. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [setting, setSetting] = useState<LanguageSetting | null>(null);

  useEffect(() => {
    ipcRenderer
      .invokeGetSettings()
      .then((loaded) => {
        const language = (loaded as { language?: LanguageSetting } | null)
          ?.language;
        if (language) setSetting(language);
      })
      .catch(() => {
        /* No bridge (a browser, a test harness): the OS tag stands. */
      });
  }, []);

  const locale = useMemo(
    () =>
      setting === null
        ? localeFromTag(navigator.language)
        : resolveLocale(setting, navigator.language),
    [setting],
  );

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const setLanguage = useCallback((next: LanguageSetting) => {
    setSetting(next);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLanguage }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

export function useSetLanguage() {
  return useContext(LocaleContext).setLanguage;
}

export function useT() {
  const locale = useLocale();
  return useCallback(
    (key: MessageKey, vars?: Vars) => translate(locale, key, vars),
    [locale],
  );
}
