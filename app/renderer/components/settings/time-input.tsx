import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/i18n";
import { formatDuration, formatMinuteOfDay } from "@/lib/format";
import React, { KeyboardEvent, useEffect, useRef, useState } from "react";

export interface TimeInputProps {
  value: number; // Value in seconds
  onChange: (value: number) => void;
  precision?: "minutes" | "seconds"; // Default is "minutes"
  disabled?: boolean;
  className?: string;
}

export default function TimeInput({
  value,
  onChange,
  precision = "minutes",
  disabled = false,
  className,
}: TimeInputProps) {
  const t = useT();
  const locale = useLocale();
  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);
  const secondsRef = useRef<HTMLInputElement>(null);

  const [internalValue, setInternalValue] = useState(() => {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = value % 60;
    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = value % 60;

    setInternalValue((prev) => ({
      hours:
        focusedField === "hours"
          ? prev.hours
          : hours.toString().padStart(2, "0"),
      minutes:
        focusedField === "minutes"
          ? prev.minutes
          : minutes.toString().padStart(2, "0"),
      seconds:
        focusedField === "seconds"
          ? prev.seconds
          : seconds.toString().padStart(2, "0"),
    }));
  }, [value, precision, focusedField]);

  const handleChange = (
    field: "hours" | "minutes" | "seconds",
    newValue: string,
  ) => {
    const updated = { ...internalValue, [field]: newValue };
    setInternalValue(updated);

    const hours = Math.min(23, Math.max(0, parseInt(updated.hours) || 0));
    const minutes = Math.min(59, Math.max(0, parseInt(updated.minutes) || 0));
    const seconds =
      precision === "seconds"
        ? Math.min(59, Math.max(0, parseInt(updated.seconds) || 0))
        : 0;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    onChange(totalSeconds);
  };

  const cycleValue = (
    field: "hours" | "minutes" | "seconds",
    direction: "up" | "down",
  ) => {
    const current = parseInt(internalValue[field]) || 0;
    let max = 59;
    if (field === "hours") max = 23;

    let newValue;
    if (direction === "up") {
      newValue = current >= max ? 0 : current + 1;
    } else {
      newValue = current <= 0 ? max : current - 1;
    }

    handleChange(field, newValue.toString().padStart(2, "0"));
  };

  const handleKeyDown = (
    field: "hours" | "minutes" | "seconds",
    e: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (disabled) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      cycleValue(field, "up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      cycleValue(field, "down");
    } else if (e.key === "Tab") {
      // Let tab work normally
    } else if (e.key === ":") {
      e.preventDefault();
      if (field === "hours" && minutesRef.current) {
        minutesRef.current.focus();
        minutesRef.current.select();
      } else if (
        field === "minutes" &&
        precision === "seconds" &&
        secondsRef.current
      ) {
        secondsRef.current.focus();
        secondsRef.current.select();
      }
    } else if (
      e.key === "Backspace" &&
      e.currentTarget.value === "" &&
      e.currentTarget.selectionStart === 0
    ) {
      e.preventDefault();
      if (field === "minutes" && hoursRef.current) {
        hoursRef.current.focus();
        hoursRef.current.select();
      } else if (field === "seconds" && minutesRef.current) {
        minutesRef.current.focus();
        minutesRef.current.select();
      }
    }
  };

  const handleFocus = (
    field: "hours" | "minutes" | "seconds",
    e: React.FocusEvent<HTMLInputElement>,
  ) => {
    setFocusedField(field);
    e.target.select();
  };

  const handleBlur = (field: "hours" | "minutes" | "seconds") => {
    setFocusedField(null);
    const currentValue = internalValue[field];
    const formattedValue = (currentValue || "0").padStart(2, "0");

    if (currentValue !== formattedValue) {
      const updated = { ...internalValue, [field]: formattedValue };
      setInternalValue(updated);
    }
  };

  const handleInputChange = (
    field: "hours" | "minutes" | "seconds",
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let cleanValue = e.target.value.replace(/[^0-9]/g, "");
    if (cleanValue.length > 2) {
      cleanValue = cleanValue.slice(0, 2);
    }

    /* Snap an over-ceiling entry to the ceiling at once ("9" then "9" in the
       hours box shows 23, not 99): the boxes must never display one thing
       while the setting quietly holds another. */
    const cap = field === "hours" ? 23 : 59;
    const parsed = parseInt(cleanValue) || 0;
    if (parsed > cap) {
      cleanValue = String(cap);
    }

    const updated = { ...internalValue, [field]: cleanValue };
    setInternalValue(updated);

    const hours = parseInt(updated.hours) || 0;
    const minutes = parseInt(updated.minutes) || 0;
    const seconds =
      precision === "seconds" ? parseInt(updated.seconds) || 0 : 0;

    const totalSeconds = Math.min(
      86399,
      Math.max(0, hours * 3600 + minutes * 60 + seconds),
    );
    onChange(totalSeconds);

    if (cleanValue.length === 2) {
      setTimeout(() => {
        if (field === "hours" && minutesRef.current) {
          minutesRef.current.focus();
          minutesRef.current.select();
        } else if (
          field === "minutes" &&
          precision === "seconds" &&
          secondsRef.current
        ) {
          secondsRef.current.focus();
          secondsRef.current.select();
        }
      }, 0);
    }
  };

  /* Two modes, one control.

     At rest the field is a single number — "28m", "09:00" — because that is
     all the reader needs and the three-box "00h:28m:00s" form turned a tile
     whose whole point was one figure into a row of six glyph groups. Clicking
     it swaps in the three boxes, which is where the precision actually
     belongs. */
  if (editing === false) {
    const label =
      precision === "seconds"
        ? formatDuration(value, locale)
        : formatMinuteOfDay(Math.floor(value / 60));
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setEditing(true);
          requestAnimationFrame(() => hoursRef.current?.focus());
        }}
        aria-label={label}
        className={cn(
          "flex h-8 w-full items-center justify-start rounded-[10px] border border-transparent px-2 text-left",
          "font-mono text-[13px] tnum text-foreground",
          "transition-colors duration-150",
          "hover:bg-black/[0.04] hover:border-border",
          "outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          disabled && "cursor-not-allowed opacity-40",
          className,
        )}
      >
        {label}
      </button>
    );
  }

  const field = (
    ref: React.RefObject<HTMLInputElement | null>,
    key: "hours" | "minutes" | "seconds",
    unit: string,
  ) => (
    <>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={internalValue[key]}
        onChange={(e) => handleInputChange(key, e)}
        onKeyDown={(e) => handleKeyDown(key, e)}
        onFocus={(e) => handleFocus(key, e)}
        onBlur={() => handleBlur(key)}
        disabled={disabled}
        maxLength={2}
        aria-label={unit}
        className="h-5 w-5 min-w-0 shrink bg-transparent p-0 text-center outline-none"
      />
      <span className="shrink-0 font-sans text-[11px] leading-none text-muted-foreground">
        {unit}
      </span>
    </>
  );

  return (
    <div
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setEditing(false);
      }}
      className={cn(
        "flex w-full min-w-0 items-center justify-center gap-0.5 rounded-[10px] border border-border bg-black/[0.03] px-2 py-1",
        "font-mono text-[13px] tnum text-foreground",
        "transition-all duration-150 ease-out",
        "has-[input:focus]:border-primary has-[input:focus]:ring-2 has-[input:focus]:ring-primary/20",
        disabled && "opacity-40",
        className,
      )}
    >
      {field(hoursRef, "hours", t("unit.h"))}
      <span className="shrink-0 px-px text-[11px] text-muted-foreground/60">
        :
      </span>
      {field(minutesRef, "minutes", t("unit.m"))}
      {precision === "seconds" && (
        <>
          <span className="shrink-0 px-px text-[11px] text-muted-foreground/60">
            :
          </span>
          {field(secondsRef, "seconds", t("unit.s"))}
        </>
      )}
    </div>
  );
}
