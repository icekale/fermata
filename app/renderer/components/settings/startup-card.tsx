import { useT } from "@/i18n";
import { Settings } from "../../../types/settings";
import { IconStartup } from "@/components/icons";
import SettingsSection from "./settings-section";

interface StartupCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
}

export default function StartupCard({
  settingsDraft,
  onSwitchChange,
}: StartupCardProps) {
  const t = useT();

  return (
    <SettingsSection
      id="sec-startup"
      icon={<IconStartup size={19} />}
      title={t("sec.startup.title")}
      helperText={t("sec.startup.helper")}
      toggle={{
        checked: settingsDraft.autoLaunch,
        onCheckedChange: (checked) => onSwitchChange("autoLaunch", checked),
      }}
    />
  );
}
