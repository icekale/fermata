import type { LanguageSetting, MessageKey } from "../i18n";

export enum NotificationType {
  Notification = "NOTIFICATION",
  Popup = "POPUP",
}

export interface WorkingHoursRange {
  fromMinutes: number;
  toMinutes: number;
}

export interface WorkingHours {
  enabled: boolean;
  ranges: WorkingHoursRange[];
}

export enum SoundType {
  None = "NONE",
  Gong = "GONG",
  Blip = "BLIP",
  Bloop = "BLOOP",
  Ping = "PING",
  Scifi = "SCIFI",
}

export enum TrayTextMode {
  TimeToNextBreak = "TIME_TO_NEXT_BREAK",
  TimeSinceLastBreak = "TIME_SINCE_LAST_BREAK",
}

export interface Settings {
  language: LanguageSetting;
  autoLaunch: boolean;
  breaksEnabled: boolean;
  trayTextEnabled: boolean;
  trayTextMode: TrayTextMode;
  notificationType: NotificationType;
  breakFrequencySeconds: number;
  breakLengthSeconds: number;
  postponeLengthSeconds: number;
  postponeLimit: number;
  workingHoursEnabled: boolean;
  workingHoursMonday: WorkingHours;
  workingHoursTuesday: WorkingHours;
  workingHoursWednesday: WorkingHours;
  workingHoursThursday: WorkingHours;
  workingHoursFriday: WorkingHours;
  workingHoursSaturday: WorkingHours;
  workingHoursSunday: WorkingHours;
  idleResetEnabled: boolean;
  idleResetLengthSeconds: number;
  idleResetNotification: boolean;
  soundType: SoundType;
  breakSoundVolume: number;
  breakTitle: string;
  breakMessage: string;
  backgroundColor: string;
  textColor: string;
  /* The colour the screen behind a break is dimmed to. Named separately from
     backgroundColor because on a parchment sheet a darkened sheet is mud. */
  veilColor: string;
  showBackdrop: boolean;
  backdropOpacity: number;
  endBreakEnabled: boolean;
  skipBreakEnabled: boolean;
  postponeBreakEnabled: boolean;
  immediatelyStartBreaks: boolean;
}

export const defaultWorkingRange: WorkingHoursRange = {
  fromMinutes: 9 * 60, // 09:00
  toMinutes: 18 * 60, // 18:00
};

export const defaultSettings: Settings = {
  /* "system" resolves from the OS tag in whichever process needs it, so a
     Chinese Mac gets a Chinese tray menu on first run with nothing to
     configure. */
  language: "system",
  autoLaunch: true,
  breaksEnabled: true,
  trayTextEnabled: true,
  trayTextMode: TrayTextMode.TimeToNextBreak,
  notificationType: NotificationType.Popup,
  breakFrequencySeconds: 28 * 60,
  breakLengthSeconds: 2 * 60,
  postponeLengthSeconds: 3 * 60,
  postponeLimit: 0,
  workingHoursEnabled: true,
  workingHoursMonday: {
    enabled: true,
    ranges: [defaultWorkingRange],
  },
  workingHoursTuesday: {
    enabled: true,
    ranges: [defaultWorkingRange],
  },
  workingHoursWednesday: {
    enabled: true,
    ranges: [defaultWorkingRange],
  },
  workingHoursThursday: {
    enabled: true,
    ranges: [defaultWorkingRange],
  },
  workingHoursFriday: {
    enabled: true,
    ranges: [defaultWorkingRange],
  },
  workingHoursSaturday: {
    enabled: false,
    ranges: [defaultWorkingRange],
  },
  workingHoursSunday: {
    enabled: false,
    ranges: [defaultWorkingRange],
  },
  idleResetEnabled: true,
  idleResetLengthSeconds: 5 * 60,
  idleResetNotification: false,
  soundType: SoundType.Gong,
  breakSoundVolume: 1,
  breakTitle: "Time for a break.",
  breakMessage: "Rest your eyes.\nStretch your legs.\nBreathe. Relax.",
  backgroundColor: "#f5f4ed",
  textColor: "#141413",
  veilColor: "#33302a",
  showBackdrop: true,
  backdropOpacity: 0.7,
  endBreakEnabled: true,
  skipBreakEnabled: false,
  postponeBreakEnabled: true,
  immediatelyStartBreaks: false,
};

export interface DayConfig {
  key:
    | "workingHoursMonday"
    | "workingHoursTuesday"
    | "workingHoursWednesday"
    | "workingHoursThursday"
    | "workingHoursFriday"
    | "workingHoursSaturday"
    | "workingHoursSunday";
  /** Full name, for tooltips and screen readers. */
  labelKey: MessageKey;
  /** The ledger gutter's three-letter form. */
  shortKey: MessageKey;
}

export const daysConfig: DayConfig[] = [
  { key: "workingHoursMonday", labelKey: "day.monday", shortKey: "day.mon" },
  { key: "workingHoursTuesday", labelKey: "day.tuesday", shortKey: "day.tue" },
  {
    key: "workingHoursWednesday",
    labelKey: "day.wednesday",
    shortKey: "day.wed",
  },
  {
    key: "workingHoursThursday",
    labelKey: "day.thursday",
    shortKey: "day.thu",
  },
  { key: "workingHoursFriday", labelKey: "day.friday", shortKey: "day.fri" },
  {
    key: "workingHoursSaturday",
    labelKey: "day.saturday",
    shortKey: "day.sat",
  },
  { key: "workingHoursSunday", labelKey: "day.sunday", shortKey: "day.sun" },
];
