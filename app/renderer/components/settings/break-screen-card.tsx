import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { Settings } from "../../../types/settings";
import {
  BreakPalette,
  breakPalettes,
  contrastRatio,
  findPalette,
} from "../../../types/palettes";
import { IconScreen } from "@/components/icons";
import SettingsSection from "./settings-section";

interface BreakScreenCardProps {
  settingsDraft: Settings;
  onPaletteChange: (palette: BreakPalette) => void;
  onColorChange: (
    field: "backgroundColor" | "textColor",
    value: string,
  ) => void;
}

/* Six sheets and a Custom escape hatch, in place of two raw colour pickers.

   The pickers were the reason every BreakTimer looked like a different app:
   the shipped default was a saturated teal, so the one surface every user sees
   full-screen was the one surface the product had no control over. The swatch
   is the preview — it is painted in the palette's own sheet and ink, with a
   numeral in it, because a colour chip cannot tell you whether the countdown
   will be readable and a rendered numeral can. */
export default function BreakScreenCard({
  settingsDraft,
  onPaletteChange,
  onColorChange,
}: BreakScreenCardProps) {
  const active = findPalette(
    settingsDraft.backgroundColor,
    settingsDraft.textColor,
  );
  const ratio = contrastRatio(
    settingsDraft.backgroundColor,
    settingsDraft.textColor,
  );
  const lowContrast = ratio < 4.5;

  const t = useT();

  return (
    <SettingsSection
      id="sec-screen"
      icon={<IconScreen size={19} />}
      title={t("sec.screen.title")}
      helperText={t("sec.screen.helper")}
    >
      <div className="grid grid-cols-3 gap-2.5">
        {breakPalettes.map((palette) => {
          const selected = active?.id === palette.id;
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => onPaletteChange(palette)}
              aria-pressed={selected}
              className={cn(
                "group relative flex h-[68px] flex-col justify-between overflow-hidden rounded-[var(--radius-md)] px-3 py-2.5 text-left",
                "border transition-[border-color,box-shadow] duration-150 ease-[var(--ease-paper)]",
                selected
                  ? "border-primary shadow-[0_0_0_1px_var(--primary)]"
                  : "border-border hover:border-primary/50",
              )}
              style={{ backgroundColor: palette.background }}
            >
              <span
                className="font-sans text-[12px] leading-none"
                style={{ color: palette.text }}
              >
                {t(palette.nameKey)}
              </span>
              <span
                className="tnum text-[14px] leading-none tracking-tight"
                style={{ color: palette.text, opacity: 0.62 }}
              >
                2:00
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <span className="tile-label block">{t("field.customSheet")}</span>
        <div className="grid grid-cols-2 gap-4">
          <ColorWell
            label={t("field.sheet")}
            value={settingsDraft.backgroundColor}
            onChange={(value) => onColorChange("backgroundColor", value)}
          />
          <ColorWell
            label={t("field.ink")}
            value={settingsDraft.textColor}
            onChange={(value) => onColorChange("textColor", value)}
          />
        </div>
        <p
          className={cn(
            "font-sans text-[12px] leading-[1.5]",
            lowContrast ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {lowContrast
            ? t("palette.contrastLow", { ratio: ratio.toFixed(1) })
            : t("palette.contrastOk", {
                ratio: ratio.toFixed(1),
                veil: settingsDraft.veilColor,
              })}
        </p>
      </div>
    </SettingsSection>
  );
}

function ColorWell({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className={cn(
          "size-9 shrink-0 cursor-pointer appearance-none rounded-[var(--radius-md)]",
          "border border-border bg-transparent p-0",
          "[&::-webkit-color-swatch-wrapper]:p-0",
          "[&::-webkit-color-swatch]:rounded-[9px] [&::-webkit-color-swatch]:border-0",
        )}
      />
      <span className="min-w-0">
        <span className="block font-sans text-[13px] leading-none text-foreground-soft">
          {label}
        </span>
        <span className="tnum mt-1 block font-sans text-[12px] leading-none text-muted-foreground">
          {value.toUpperCase()}
        </span>
      </span>
    </label>
  );
}
