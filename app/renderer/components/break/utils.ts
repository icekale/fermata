import type { MessageKey } from "../../../i18n";

export interface TimeSince {
  key: MessageKey;
  vars?: Record<string, number>;
}

/* Returns the message key and its numbers rather than a finished sentence: the
   sentence has to be assembled in the reader's language, and "12m since last
   break" does not survive being translated word by word. */
export function formatTimeSinceLastBreak(seconds: number): TimeSince {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0
      ? { key: "since.hours", vars: { hours, minutes } }
      : { key: "since.hoursShort", vars: { hours } };
  }
  if (minutes > 0) {
    return { key: "since.minutes", vars: { minutes } };
  }
  return { key: "since.seconds" };
}

export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
}
