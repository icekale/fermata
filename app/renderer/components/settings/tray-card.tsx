import { useT } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, TrayTextMode } from "../../../types/settings";
import { IconMenuBar } from "@/components/icons";
import SettingsSection from "./settings-section";

interface TrayCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
  onTrayTextModeChange: (value: string) => void;
}

export default function TrayCard({
  settingsDraft,
  onSwitchChange,
  onTrayTextModeChange,
}: TrayCardProps) {
  const t = useT();

  return (
    <SettingsSection
      id="sec-tray"
      icon={<IconMenuBar size={19} />}
      title={t("sec.tray.title")}
      helperText={t("sec.tray.helper")}
      toggle={{
        checked: settingsDraft.trayTextEnabled,
        onCheckedChange: (checked) =>
          onSwitchChange("trayTextEnabled", checked),
      }}
    >
      <Select
        value={settingsDraft.trayTextMode}
        disabled={settingsDraft.trayTextEnabled === false}
        onValueChange={onTrayTextModeChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TrayTextMode.TimeToNextBreak}>
            {t("sec.tray.next")}
          </SelectItem>
          <SelectItem value={TrayTextMode.TimeSinceLastBreak}>
            {t("sec.tray.since")}
          </SelectItem>
        </SelectContent>
      </Select>
    </SettingsSection>
  );
}
