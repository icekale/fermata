import { useT } from "@/i18n";
import { Slider } from "@/components/ui/slider";
import { NotificationType, Settings } from "../../../types/settings";
import { IconVeil } from "@/components/icons";
import SettingsSection from "./settings-section";

interface VeilCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
  onSliderChange: (field: keyof Settings, values: number[]) => void;
}

/* "Backdrop" was named after the layer, which told the reader nothing about
   what it does. It is a veil: it drops over the whole screen so the desktop
   stops competing. The slider previews the veil's own colour, because the
   percentage on its own does not tell you what the screen will look like. */
export default function VeilCard({
  settingsDraft,
  onSwitchChange,
  onSliderChange,
}: VeilCardProps) {
  const off = settingsDraft.showBackdrop === false;
  const percent = Math.round(settingsDraft.backdropOpacity * 100);

  const t = useT();

  return (
    <SettingsSection
      id="sec-veil"
      icon={<IconVeil size={19} />}
      title={t("sec.veil.title")}
      helperText={t("sec.veil.helper")}
      toggle={{
        checked: settingsDraft.showBackdrop,
        onCheckedChange: (checked) => onSwitchChange("showBackdrop", checked),
        disabled: settingsDraft.notificationType !== NotificationType.Popup,
      }}
    >
      <div className={off ? "opacity-45" : undefined}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="u-label">{t("sec.veil.strength")}</span>
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3.5 rounded-full border border-rule"
              style={{ backgroundColor: settingsDraft.veilColor }}
            />
            <span className="tnum font-sans text-[13px] text-ink">
              {percent}%
            </span>
          </span>
        </div>
        <Slider
          min={0.2}
          max={1}
          step={0.05}
          value={[settingsDraft.backdropOpacity]}
          onValueChange={(values) => onSliderChange("backdropOpacity", values)}
          disabled={off}
          aria-label={t("sec.veil.strength")}
        />
        <div className="mt-2 flex justify-between font-sans text-[12px] text-stone">
          <span>20%</span>
          <span>100%</span>
        </div>
      </div>
    </SettingsSection>
  );
}
