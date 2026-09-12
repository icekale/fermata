import {
  IconBreaks,
  IconScreen,
  IconStartup,
  IconWeek,
} from "@/components/icons";
import { ReactNode } from "react";
import type { MessageKey } from "../../../i18n";

export interface NavEntry {
  /** Must match the `id` the section renders with. The verifier checks this:
   *  a rail link that points at nothing is a dead control, and the failure is
   *  silent. */
  id: string;
  labelKey: MessageKey;
}

export interface NavGroup {
  value: string;
  labelKey: MessageKey;
  icon: ReactNode;
  entries: NavEntry[];
}

/* One model for the rail, so the four groups and their sections are declared
   once and the rail cannot drift out of step with the tab it opens. */
export const navGroups: NavGroup[] = [
  {
    value: "break-settings",
    labelKey: "nav.general",
    icon: <IconBreaks size={18} />,
    entries: [
      { id: "sec-breaks", labelKey: "sec.breaks.title" },
      { id: "sec-smart", labelKey: "sec.smart.title" },
      { id: "sec-snooze", labelKey: "sec.snooze.title" },
      { id: "sec-skip", labelKey: "sec.skip.title" },
      { id: "sec-advanced", labelKey: "sec.advanced.title" },
    ],
  },
  {
    value: "working-hours",
    labelKey: "nav.hours",
    icon: <IconWeek size={18} />,
    entries: [{ id: "sec-hours", labelKey: "sec.hours.title" }],
  },
  {
    value: "customization",
    labelKey: "nav.customization",
    icon: <IconScreen size={18} />,
    entries: [
      { id: "sec-screen", labelKey: "sec.screen.title" },
      { id: "sec-veil", labelKey: "sec.veil.title" },
      { id: "sec-audio", labelKey: "sec.audio.title" },
    ],
  },
  {
    value: "system",
    labelKey: "nav.system",
    icon: <IconStartup size={18} />,
    entries: [
      { id: "sec-language", labelKey: "sec.language.title" },
      { id: "sec-startup", labelKey: "sec.startup.title" },
      { id: "sec-tray", labelKey: "sec.tray.title" },
    ],
  },
];
