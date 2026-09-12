import { useT } from "@/i18n";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  DayConfig,
  daysConfig,
  Settings,
  WorkingHours,
} from "../../../types/settings";
import ShiftBand from "./shift-band";
import { MINUTES_IN_DAY, nowMinutes, todayIndex } from "./working-hours-utils";

interface WorkingHoursProps {
  settingsDraft: Settings;
  setSettingsDraft: (settingsDraft: Settings) => void;
}

const HOUR_MARKS = [0, 6, 12, 18, 24];

/* The week ledger.

   Before this, working hours were fourteen hour/minute/unit input groups
   stacked down the window: to answer "am I covered on Thursday afternoon?"
   you had to read sixteen numbers and reconstruct the shape in your head. The
   ledger draws the answer once, on a shared 24-hour scale, so the week reads in
   a glance and the total shape of your week is legible before you read a single
   time. Exact times are still typed — behind the band, where they belong. */
export default function WorkingHoursSettings({
  settingsDraft,
  setSettingsDraft,
}: WorkingHoursProps) {
  const [now, setNow] = useState(() => nowMinutes());
  const today = todayIndex();

  useEffect(() => {
    const id = window.setInterval(() => setNow(nowMinutes()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const masterOff = settingsDraft.workingHoursEnabled === false;

  const handleDayChange = (day: DayConfig, workingHours: WorkingHours) => {
    setSettingsDraft({ ...settingsDraft, [day.key]: workingHours });
  };

  const handleApplyToDays = (source: DayConfig, targets: DayConfig[]) => {
    const hours = settingsDraft[source.key];
    const next = { ...settingsDraft };
    targets.forEach((target) => {
      next[target.key] = {
        enabled: hours.enabled,
        ranges: hours.ranges.map((range) => ({ ...range })),
      };
    });
    setSettingsDraft(next);
  };

  const t = useT();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[40px_1fr_36px] items-end gap-x-3">
        <span />
        <div className="relative h-4">
          {HOUR_MARKS.map((hour, index) => {
            const isFirst = index === 0;
            const isLast = index === HOUR_MARKS.length - 1;
            return (
              <span
                key={hour}
                className={cn(
                  "tnum absolute bottom-0 text-[11px] leading-none text-stone",
                  isFirst && "left-0",
                  isLast && "right-0",
                  isFirst === false && isLast === false && "-translate-x-1/2",
                )}
                style={
                  isFirst === false && isLast === false
                    ? { left: `${(hour / 24) * 100}%` }
                    : undefined
                }
              >
                {String(hour).padStart(2, "0")}
              </span>
            );
          })}
        </div>
        <span />
      </div>

      <div className="stagger-days space-y-1">
        {daysConfig.map((day, index) => (
          <DayRow
            key={day.key}
            day={day}
            workingHours={settingsDraft[day.key]}
            disabled={masterOff}
            isToday={index === today}
            nowPercent={(now / MINUTES_IN_DAY) * 100}
            onChange={(workingHours) => handleDayChange(day, workingHours)}
            onApplyToDays={(targets) => handleApplyToDays(day, targets)}
          />
        ))}
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[12px] leading-none text-stone">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-px bg-stamp" />
          {t("ledger.now")}
        </span>
        <span>{t("ledger.drag")}</span>
        <span>{t("ledger.click")}</span>
      </p>
    </div>
  );
}

interface DayRowProps {
  day: DayConfig;
  workingHours: WorkingHours;
  disabled: boolean;
  isToday: boolean;
  nowPercent: number;
  onChange: (workingHours: WorkingHours) => void;
  onApplyToDays: (targets: DayConfig[]) => void;
}

function DayRow({
  day,
  workingHours,
  disabled,
  isToday,
  nowPercent,
  onChange,
  onApplyToDays,
}: DayRowProps) {
  const off = workingHours.enabled === false;
  const inactive = disabled || off;

  const handleRangeChange = (
    index: number,
    range: WorkingHours["ranges"][0],
  ) => {
    const ranges = [...workingHours.ranges];
    ranges[index] = range;
    onChange({ ...workingHours, ranges });
  };

  const handleAdd = () => {
    const last = workingHours.ranges[workingHours.ranges.length - 1];
    const from = last
      ? Math.min(last.toMinutes + 60, MINUTES_IN_DAY - 60)
      : 540;
    onChange({
      ...workingHours,
      ranges: [
        ...workingHours.ranges,
        { fromMinutes: from, toMinutes: Math.min(from + 60, MINUTES_IN_DAY) },
      ],
    });
  };

  const handleRemove = (index: number) => {
    if (workingHours.ranges.length <= 1) return;
    onChange({
      ...workingHours,
      ranges: workingHours.ranges.filter((_, i) => i !== index),
    });
  };

  const t = useT();

  return (
    <div className="grid grid-cols-[40px_1fr_36px] items-center gap-x-3">
      <span
        className={cn(
          "text-[13px] leading-none",
          inactive ? "text-stone" : "text-ink",
        )}
      >
        {t(day.shortKey)}
      </span>

      <div
        className={cn(
          "relative h-8 rounded-[var(--radius-sm)] bg-paper-sunk ring-1 ring-rule ring-inset",
          disabled && "opacity-55",
        )}
      >
        {[6, 12, 18].map((hour) => (
          <span
            key={hour}
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-rule-soft"
            style={{ left: `${(hour / 24) * 100}%` }}
          />
        ))}

        {workingHours.ranges.map((range, index) => (
          <ShiftBand
            key={index}
            range={range}
            day={day}
            enabled={inactive === false}
            onChange={(next) => handleRangeChange(index, next)}
            onRemove={() => handleRemove(index)}
            onAdd={handleAdd}
            onApplyToDays={onApplyToDays}
            canRemove={workingHours.ranges.length > 1}
            canAdd={workingHours.ranges.length < 4}
          />
        ))}

        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 w-px",
            isToday ? "bg-stamp" : "bg-stamp/30",
          )}
          style={{ left: `${nowPercent}%` }}
        />
        {isToday && (
          <span
            aria-hidden="true"
            className="now-dot pointer-events-none absolute -top-[3px] size-[5px] rounded-full bg-stamp"
            style={{ left: `${nowPercent}%` }}
          />
        )}
      </div>

      <Switch
        checked={workingHours.enabled}
        onCheckedChange={(checked) =>
          onChange({ ...workingHours, enabled: checked })
        }
        disabled={disabled}
        aria-label={t("ledger.dayToggle", { day: t(day.labelKey) })}
      />
    </div>
  );
}
