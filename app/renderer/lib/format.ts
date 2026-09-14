/* One duration format for the whole app.

   The app says the same thing in four places — the cadence tile, the menu-bar
   HUD, the timed fields and the notice — and it used to say it four ways:
   "00h:28m:00s", "28m", "0h 28m", "28m0s". A reader comparing the HUD with the
   window was reading two different products.

   The rule is the shortest form that is still unambiguous: drop any unit that
   is zero, keep at most two units, and never pad a number that has no
   neighbour to line up with. Chinese spells the same rule with 小时/分/秒 —
   the words the rest of the Chinese UI already uses — rather than borrowing
   the Latin letters. */

import type { Locale } from "../../i18n";

export function formatDuration(seconds: number, locale: Locale = "en"): string {
  const abs = Math.max(0, Math.floor(seconds));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const parts: string[] = [];
  if (locale === "zh") {
    if (h > 0) parts.push(h + "小时");
    if (m > 0) parts.push(m + "分");
    if (s > 0 && h === 0) parts.push(s + "秒");
    if (parts.length === 0) return "0分";
    return parts.slice(0, 2).join("");
  }
  if (h > 0) parts.push(h + "h");
  if (m > 0) parts.push(m + "m");
  if (s > 0 && h === 0) parts.push(s + "s");
  if (parts.length === 0) return "0m";
  return parts.slice(0, 2).join(" ");
}

/** 13:51 — clock time, for "next break at", "last break at". */
export function formatClock(at: number | Date): string {
  const d = typeof at === "number" ? new Date(at) : at;
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return h + ":" + m;
}

/** 09:00 — minutes since midnight, the format the ledger and times use. */
export function formatMinuteOfDay(minutes: number | null): string {
  if (minutes === null) return "";
  const h = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
  const m = String(Math.round(minutes) % 60).padStart(2, "0");
  return h + ":" + m;
}
