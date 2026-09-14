import { useT } from "@/i18n";
import { FormGroup } from "@/components/ui/form-group";
import { Slider } from "@/components/ui/slider";
import { Settings, SoundType } from "../../../types/settings";
import { SoundSelect } from "../sound-select";
import { IconAudio } from "@/components/icons";
import SettingsSection from "./settings-section";

interface AudioCardProps {
  settingsDraft: Settings;
  onSoundTypeChange: (soundType: SoundType) => void;
  onSliderChange: (field: keyof Settings, values: number[]) => void;
}

export default function AudioCard({
  settingsDraft,
  onSoundTypeChange,
  onSliderChange,
}: AudioCardProps) {
  const quiet = settingsDraft.soundType === SoundType.None;

  const t = useT();

  return (
    <SettingsSection
      id="sec-audio"
      icon={<IconAudio size={19} />}
      title={t("sec.audio.title")}
      helperText={t("sec.audio.helper")}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label={t("sec.audio.sound")}>
          <SoundSelect
            value={settingsDraft.soundType}
            onChange={onSoundTypeChange}
            volume={settingsDraft.breakSoundVolume}
          />
        </FormGroup>
        <FormGroup label={t("sec.audio.volume")}>
          <div className={quiet ? "opacity-45" : undefined}>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[settingsDraft.breakSoundVolume]}
              onValueChange={(values) =>
                onSliderChange("breakSoundVolume", values)
              }
              disabled={quiet}
              aria-label={t("sec.audio.volume")}
            />
            <div className="mt-2 flex justify-between font-sans text-[12px] text-muted-foreground">
              <span>{t("sec.audio.silent")}</span>
              <span className="tnum font-sans text-foreground">
                {Math.round(settingsDraft.breakSoundVolume * 100)}%
              </span>
              <span>{t("sec.audio.full")}</span>
            </div>
          </div>
        </FormGroup>
      </div>
    </SettingsSection>
  );
}
