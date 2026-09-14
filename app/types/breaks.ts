import { Moment } from "moment";

export type BreakTime = Moment | null;

export interface TrayStatus {
  enabled: boolean;
  havingBreak: boolean;
  inWorkingHours: boolean;
  nextBreakAt: number | null;
  sinceLastBreakSeconds: number | null;
  frequencySeconds: number;
  lengthSeconds: number;
  /** Today's working window, or null when today has none. Lets the HUD caption
   *  the schedule with the actual hours instead of repeating the word. */
  todayFromMinutes: number | null;
  todayToMinutes: number | null;
  /** The next instant the working window begins, across days. Lets the HUD
   *  count down to it while breaks are quiet. */
  nextWindowOpenAt: number | null;
  /** Where a break lands: the full-screen sheet or a plain notification. */
  popup: boolean;
}
