import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { IconPlus, IconTrash } from "@/components/icons";
import { useRef, useState } from "react";
import {
  DayConfig,
  daysConfig,
  WorkingHoursRange,
} from "../../../types/settings";
import { pluralKey } from "../../../i18n";
import { useT } from "@/i18n";
import TimeInput from "./time-input";
import {
  MINUTES_IN_DAY,
  clampMinutes,
  formatMinutes,
  minutesToSeconds,
  secondsToMinutes,
  snapMinutes,
} from "./working-hours-utils";

interface ShiftBandProps {
  range: WorkingHoursRange;
  day: DayConfig;
  enabled: boolean;
  onChange: (range: WorkingHoursRange) => void;
  onRemove: () => void;
  onAdd: () => void;
  onApplyToDays: (targetDays: DayConfig[]) => void;
  canRemove: boolean;
  canAdd: boolean;
}

/* One shift, drawn on the week ledger, and the only place exact times are
   typed.

   The band can be dragged to move the shift and clicked to open the editor.
   Those two gestures share a target, so the drag sets a flag and the click
   that follows a real drag is swallowed — otherwise every drag would also
   fling a popover open at the drop position. */
export default function ShiftBand({
  range,
  day,
  enabled,
  onChange,
  onRemove,
  onAdd,
  onApplyToDays,
  canRemove,
  canAdd,
}: ShiftBandProps) {
  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState<DayConfig[]>([]);
  const [dragging, setDragging] = useState(false);
  const movedRef = useRef(false);
  const startRef = useRef({ x: 0, from: 0, to: 0, width: 1 });

  const from = range.fromMinutes;
  const to = range.toMinutes;
  const left = (from / MINUTES_IN_DAY) * 100;
  const width = ((to - from) / MINUTES_IN_DAY) * 100;
  const wide = width > 12;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (enabled === false) return;
    const track = event.currentTarget.parentElement;
    if (track === null) return;
    startRef.current = {
      x: event.clientX,
      from,
      to,
      width: track.getBoundingClientRect().width || 1,
    };
    movedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging === false) return;
    const {
      x,
      from: origin,
      to: originTo,
      width: trackWidth,
    } = startRef.current;
    const deltaPx = event.clientX - x;
    if (Math.abs(deltaPx) > 3) movedRef.current = true;
    const deltaMinutes = snapMinutes((deltaPx / trackWidth) * MINUTES_IN_DAY);
    const duration = originTo - origin;
    const nextFrom = clampMinutes(
      Math.max(0, Math.min(origin + deltaMinutes, MINUTES_IN_DAY - duration)),
    );
    onChange({ fromMinutes: nextFrom, toMinutes: nextFrom + duration });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  const setFrom = (minutes: number) => {
    onChange({
      fromMinutes: clampMinutes(Math.min(minutes, to - 15)),
      toMinutes: to,
    });
  };

  const setTo = (minutes: number) => {
    onChange({
      fromMinutes: from,
      toMinutes: clampMinutes(Math.max(minutes, from + 15)),
    });
  };

  const t = useT();

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next === false) setTargets([]);
      }}
    >
      <PopoverAnchor asChild>
        <div
          role="button"
          tabIndex={enabled ? 0 : -1}
          aria-label={t("ledger.shiftLabel", {
            day: t(day.labelKey),
            from: formatMinutes(from),
            to: formatMinutes(to),
          })}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => {
            if (movedRef.current) {
              movedRef.current = false;
              return;
            }
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen(true);
            }
          }}
          className={[
            "band-in absolute inset-y-[3px] flex items-center justify-center overflow-hidden rounded-[4px]",
            "font-sans text-[11px] whitespace-nowrap select-none",
            /* Keyboard focus is the global gold ring from index.css. This used
               to name a `navy` token that no longer exists, which left the
               ring at currentColor — dark brown on the near-black track, i.e.
               invisible. */
            enabled
              ? "cursor-grab touch-none bg-primary text-[color:var(--primary-foreground)] active:cursor-grabbing"
              : "pointer-events-none border border-dashed text-transparent",
            dragging ? "shadow-[var(--shadow-lift)]" : "",
          ].join(" ")}
          style={{ left: `${left}%`, width: `${width}%` }}
        >
          {wide && enabled && (
            <span className="tnum px-1">
              {formatMinutes(from)}–{formatMinutes(to)}
            </span>
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent align="start" side="bottom" className="w-[320px]">
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[15px] text-foreground">{t(day.labelKey)}</h3>
            <span className="tile-label">{t("ledger.shift")}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="tile-label block">{t("ledger.shiftFrom")}</span>
              <TimeInput
                precision="minutes"
                value={minutesToSeconds(from)}
                onChange={(seconds) => setFrom(secondsToMinutes(seconds))}
                className="w-full"
              />
            </label>
            <label className="space-y-2">
              <span className="tile-label block">{t("ledger.shiftUntil")}</span>
              <TimeInput
                precision="minutes"
                value={minutesToSeconds(to)}
                onChange={(seconds) => setTo(secondsToMinutes(seconds))}
                className="w-full"
              />
            </label>
          </div>

          <div className="flex items-center gap-1 border-t border-border-soft pt-3">
            {canAdd && (
              <Button size="sm" variant="ghost" onClick={onAdd}>
                <IconPlus className="size-3.5" />
                {t("ledger.addShift")}
              </Button>
            )}
            {canRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onRemove();
                  setOpen(false);
                }}
                className="text-destructive hover:text-destructive"
              >
                <IconTrash className="size-3.5" />
                {t("ledger.remove")}
              </Button>
            )}
          </div>

          <div className="border-t border-border-soft pt-3">
            <span className="tile-label">{t("ledger.copyTo")}</span>
            <div className="mt-2.5 grid grid-cols-4 gap-x-2 gap-y-2.5">
              {daysConfig.map((other) => {
                const isSelf = other.key === day.key;
                return (
                  <label
                    key={other.key}
                    className="flex cursor-pointer items-center gap-1.5"
                  >
                    <Checkbox
                      checked={isSelf || targets.includes(other)}
                      disabled={isSelf}
                      onCheckedChange={() => {
                        if (isSelf) return;
                        setTargets((days) =>
                          days.includes(other)
                            ? days.filter((d) => d !== other)
                            : [...days, other],
                        );
                      }}
                      aria-label={t(other.labelKey)}
                    />
                    <span className="font-sans text-[12px] text-foreground-soft">
                      {t(other.shortKey)}
                    </span>
                  </label>
                );
              })}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              disabled={targets.length === 0}
              onClick={() => {
                onApplyToDays(targets);
                setTargets([]);
                setOpen(false);
              }}
            >
              {t(pluralKey("ledger.copyCount", targets.length), {
                count: targets.length,
              })}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
