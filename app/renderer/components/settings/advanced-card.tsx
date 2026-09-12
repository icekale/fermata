import { useT } from "@/i18n";
import { NotificationType, Settings } from "../../../types/settings";
import { IconAdvanced } from "@/components/icons";
import SettingsSection from "./settings-section";
import SwitchRow from "./switch-row";

interface AdvancedCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
}

export default function AdvancedCard({
  settingsDraft,
  onSwitchChange,
}: AdvancedCardProps) {
  const t = useT();

  return (
    <SettingsSection
      id="sec-advanced"
      icon={<IconAdvanced size={19} />}
      title={t("sec.advanced.title")}
    >
      <SwitchRow
        label={t("sec.advanced.startImmediately")}
        checked={settingsDraft.immediatelyStartBreaks}
        onCheckedChange={(checked) =>
          onSwitchChange("immediatelyStartBreaks", checked)
        }
        disabled={settingsDraft.notificationType !== NotificationType.Popup}
      />
      <SwitchRow
        label={t("sec.advanced.endEarly")}
        checked={settingsDraft.endBreakEnabled}
        onCheckedChange={(checked) =>
          onSwitchChange("endBreakEnabled", checked)
        }
      />
    </SettingsSection>
  );
}
