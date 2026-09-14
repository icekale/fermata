import { useLocale, useT } from "@/i18n";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Numeral } from "@/components/numeral";
import { Settings } from "../../../types/settings";
import { formatDuration } from "@/lib/format";

export default function HealthPane({
  settingsDraft,
  onSwitchChange,
}: {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const on = settingsDraft.breaksEnabled;
  return (
    <div className="flex items-center justify-between px-1 py-1">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="tile-hero">
            <Numeral
              text={formatDuration(settingsDraft.breakFrequencySeconds, locale)}
              unit="text-[14px] font-medium text-muted-foreground"
            />
          </span>
          <span
            className={cn(
              "text-[13px] font-medium",
              on ? "text-[color:var(--ok)]" : "text-[color:var(--warn)]",
            )}
          >
            {on ? t("health.ok") : t("health.off")}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t("health.break", {
            length: formatDuration(settingsDraft.breakLengthSeconds, locale),
          })}
        </p>
      </div>
      <Switch
        checked={on}
        onCheckedChange={(checked) => onSwitchChange("breaksEnabled", checked)}
        aria-label={t("health.label")}
      />
    </div>
  );
}
