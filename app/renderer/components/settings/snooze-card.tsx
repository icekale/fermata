import { useT } from "@/i18n";
import { FormGroup } from "@/components/ui/form-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "../../../types/settings";
import { IconSnooze } from "@/components/icons";
import SettingsSection from "./settings-section";
import TimeInput from "./time-input";

interface SnoozeCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
  onDateChange: (fieldName: string, newVal: Date) => void;
  onPostponeLimitChange: (value: string) => void;
}

export default function SnoozeCard({
  settingsDraft,
  onSwitchChange,
  onDateChange,
  onPostponeLimitChange,
}: SnoozeCardProps) {
  const unavailable = settingsDraft.immediatelyStartBreaks;
  const off = !settingsDraft.postponeBreakEnabled || unavailable;

  const t = useT();

  return (
    <SettingsSection
      id="sec-snooze"
      icon={<IconSnooze size={19} />}
      title={t("sec.snooze.title")}
      helperText={t("sec.snooze.helper")}
      toggle={{
        checked: settingsDraft.postponeBreakEnabled && !unavailable,
        onCheckedChange: (checked) =>
          onSwitchChange("postponeBreakEnabled", checked),
        disabled: unavailable,
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label={t("field.length")}>
          <TimeInput
            precision="seconds"
            value={settingsDraft.postponeLengthSeconds}
            onChange={(seconds) => {
              const date = new Date();
              date.setHours(Math.floor(seconds / 3600));
              date.setMinutes(Math.floor((seconds % 3600) / 60));
              date.setSeconds(seconds % 60);
              onDateChange("postponeLength", date);
            }}
            disabled={off}
          />
        </FormGroup>
        <FormGroup label={t("field.limit")}>
          <Select
            value={settingsDraft.postponeLimit.toString()}
            onValueChange={onPostponeLimitChange}
            disabled={off}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="0">{t("field.noLimit")}</SelectItem>
            </SelectContent>
          </Select>
        </FormGroup>
      </div>
    </SettingsSection>
  );
}
