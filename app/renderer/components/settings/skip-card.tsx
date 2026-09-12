import { useT } from "@/i18n";
import { Settings } from "../../../types/settings";
import { IconSkip } from "@/components/icons";
import SettingsSection from "./settings-section";

interface SkipCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
}

export default function SkipCard({
  settingsDraft,
  onSwitchChange,
}: SkipCardProps) {
  const t = useT();

  return (
    <SettingsSection
      id="sec-skip"
      icon={<IconSkip size={19} />}
      title={t("sec.skip.title")}
      helperText={t("sec.skip.helper")}
      toggle={{
        checked:
          settingsDraft.skipBreakEnabled &&
          !settingsDraft.immediatelyStartBreaks,
        onCheckedChange: (checked) =>
          onSwitchChange("skipBreakEnabled", checked),
        disabled: settingsDraft.immediatelyStartBreaks,
      }}
    />
  );
}
