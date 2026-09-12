export const MINUTES_IN_DAY = 24 * 60;

/** The grid the ledger snaps to. 15 minutes is the smallest step that still
 *  reads as a distinct band at a 24-hour scale in a 500px column. */
export const SNAP_MINUTES = 15;

export const getTimeFromMinutes = (minutes: number) => {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

export const minutesToSeconds = (minutes: number): number => {
  return minutes * 60;
};

export const secondsToMinutes = (seconds: number): number => {
  return Math.floor(seconds / 60);
};

export const getMinutesFromTime = (date: Date) => {
  return date.getHours() * 60 + date.getMinutes();
};

/** 09:00 — the only time format the ledger uses. The old per-day list said
 *  "09 : 00 h m", which is a control, not a time. */
export const formatMinutes = (minutes: number): string => {
  const clamped = Math.max(0, Math.min(MINUTES_IN_DAY, Math.round(minutes)));
  const hours = Math.floor(clamped / 60) % 24;
  const mins = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const clampMinutes = (minutes: number): number =>
  Math.max(0, Math.min(MINUTES_IN_DAY, Math.round(minutes)));

export const snapMinutes = (minutes: number): number =>
  Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;

/** Minutes since midnight right now, for the ledger's marker. */
export const nowMinutes = (date = new Date()): number =>
  date.getHours() * 60 + date.getMinutes();

/** Index into daysConfig for today, Monday-first (0 = Monday). */
export const todayIndex = (date = new Date()): number =>
  (date.getDay() + 6) % 7;
