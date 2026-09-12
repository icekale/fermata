import { app } from "electron";
import {
  type Locale,
  type MessageKey,
  resolveLocale,
  translate,
} from "../../i18n";
import { getSettings } from "./store";

/* The main process has its own user-facing text — the tray menu, and the two OS
   notifications — and it has to be in the same language as the window. It does
   not ask the renderer: both sides resolve `language` from the same setting and
   the same OS tag, so they cannot disagree, and the tray keeps working when no
   window is open at all.

   The locale is read lazily on every call rather than cached, because the
   language can change from the settings window while the tray is already
   built. */

type Vars = Record<string, string | number>;

export function mainLocale(): Locale {
  return resolveLocale(getSettings().language ?? "system", app.getLocale());
}

export function t(key: MessageKey, vars?: Vars): string {
  return translate(mainLocale(), key, vars);
}
