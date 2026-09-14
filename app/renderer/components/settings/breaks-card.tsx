import { useT } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationType, Settings } from "../../../types/settings";
import TimeInput from "./time-input";
import type { ReactNode } from "react";

interface BreaksCardProps {
  settingsDraft: Settings;
  onNotificationTypeChange: (value: string) => void;
  onDateChange: (fieldName: string, newVal: Date) => void;
}

const FREQUENCY_PRESETS = [
  { label: "20m", seconds: 20 * 60 },
  { label: "25m", seconds: 25 * 60 },
  { label: "45m", seconds: 45 * 60 },
  { label: "60m", seconds: 60 * 60 },
];

const LENGTH_PRESETS = [
  { label: "20s", seconds: 20 },
  { label: "2m", seconds: 2 * 60 },
  { label: "5m", seconds: 5 * 60 },
  { label: "10m", seconds: 10 * 60 },
];

function toDate(seconds: number): Date {
  const date = new Date();
  date.setHours(Math.floor(seconds / 3600));
  date.setMinutes(Math.floor((seconds % 3600) / 60));
  date.setSeconds(seconds % 60);
  return date;
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-6 rounded-md px-2 text-[11px] font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-well text-muted-foreground hover:text-foreground-soft"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export default function BreaksCard({
  settingsDraft,
  onNotificationTypeChange,
  onDateChange,
}: BreaksCardProps) {
  const t = useT();
  const disabled = settingsDraft.breaksEnabled === false;
  /* The precise field is opt-in. Four presets cover almost every reader, and
     showing the editor unconditionally printed the same number twice in a tile
     whose whole job was to say it once. */

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="tile">
          <div className="flex items-start justify-between">
            <span className="tile-label">{t("field.frequency")}</span>
            <TimeInput
              precision="seconds"
              value={settingsDraft.breakFrequencySeconds}
              onChange={(seconds) =>
                onDateChange("breakFrequency", toDate(seconds))
              }
              disabled={disabled}
              className="tile-value h-auto w-auto shrink-0 px-1 text-[22px]"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FREQUENCY_PRESETS.map((preset) => (
              <Chip
                key={preset.seconds}
                disabled={disabled}
                active={settingsDraft.breakFrequencySeconds === preset.seconds}
                onClick={() =>
                  onDateChange("breakFrequency", toDate(preset.seconds))
                }
              >
                {preset.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="tile">
          <div className="flex items-start justify-between">
            <span className="tile-label">{t("field.length")}</span>
            <TimeInput
              precision="seconds"
              value={settingsDraft.breakLengthSeconds}
              onChange={(seconds) =>
                onDateChange("breakLength", toDate(seconds))
              }
              disabled={
                disabled ||
                settingsDraft.notificationType !== NotificationType.Popup
              }
              className="tile-value h-auto w-auto shrink-0 px-1 text-[22px]"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {LENGTH_PRESETS.map((preset) => (
              <Chip
                key={preset.seconds}
                disabled={
                  disabled ||
                  settingsDraft.notificationType !== NotificationType.Popup
                }
                active={settingsDraft.breakLengthSeconds === preset.seconds}
                onClick={() =>
                  onDateChange("breakLength", toDate(preset.seconds))
                }
              >
                {preset.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="tile">
          <span className="tile-label">{t("field.type")}</span>
          {/* The value IS the control — same rule as the cadence tiles. A big
              numeral with a second select printing the identical string under
              it said the one thing this tile knows, twice. */}
          <Select
            value={settingsDraft.notificationType}
            onValueChange={onNotificationTypeChange}
            disabled={disabled}
          >
            <SelectTrigger className="mt-3 h-auto w-fit gap-1.5 border-0 bg-transparent p-0 text-[22px] font-[650] leading-none tracking-[-0.03em] text-foreground shadow-none hover:bg-transparent data-[size=default]:h-auto data-[placeholder]:text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NotificationType.Popup}>
                {t("field.popup")}
              </SelectItem>
              <SelectItem value={NotificationType.Notification}>
                {t("field.notification")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
