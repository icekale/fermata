import { useT } from "@/i18n";
import { FormGroup } from "@/components/ui/form-group";
import { Settings } from "../../../types/settings";
import { IconSmart } from "@/components/icons";
import SettingsSection from "./settings-section";
import SwitchRow from "./switch-row";
import TimeInput from "./time-input";

interface SmartBreaksCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
  onDateChange: (fieldName: string, newVal: Date) => void;
}

export default function SmartBreaksCard({
  settingsDraft,
  onSwitchChange,
  onDateChange,
}: SmartBreaksCardProps) {
  const off = !settingsDraft.idleResetEnabled;

  const t = useT();

  return (
    <SettingsSection
      id="sec-smart"
      icon={<IconSmart size={19} />}
      title={t("sec.smart.title")}
      helperText={t("sec.smart.helper")}
      toggle={{
        checked: settingsDraft.idleResetEnabled,
        onCheckedChange: (checked) =>
          onSwitchChange("idleResetEnabled", checked),
      }}
    >
      <FormGroup label={t("field.idleMinimum")}>
        <TimeInput
          precision="seconds"
          value={settingsDraft.idleResetLengthSeconds}
          onChange={(seconds) => {
            const date = new Date();
            date.setHours(Math.floor(seconds / 3600));
            date.setMinutes(Math.floor((seconds % 3600) / 60));
            date.setSeconds(seconds % 60);
            onDateChange("idleResetLength", date);
          }}
          disabled={off}
        />
      </FormGroup>

      <SwitchRow
        label={t("field.notifyOnIdle")}
        checked={settingsDraft.idleResetNotification}
        onCheckedChange={(checked) =>
          onSwitchChange("idleResetNotification", checked)
        }
        disabled={off}
      />
    </SettingsSection>
  );
}
