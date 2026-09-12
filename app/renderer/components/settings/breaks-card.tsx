import { useT } from "@/i18n";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NotificationType, Settings } from "../../../types/settings";
import { IconBreaks } from "@/components/icons";
import SettingsSection from "./settings-section";
import TimeInput from "./time-input";

interface BreaksCardProps {
  settingsDraft: Settings;
  onNotificationTypeChange: (value: string) => void;
  onDateChange: (fieldName: string, newVal: Date) => void;
  onTextChange: (
    field: string,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onSwitchChange: (field: string, checked: boolean) => void;
}

export default function BreaksCard({
  settingsDraft,
  onNotificationTypeChange,
  onDateChange,
  onTextChange,
  onSwitchChange,
}: BreaksCardProps) {
  const toDate = (seconds: number): Date => {
    const date = new Date();
    date.setHours(Math.floor(seconds / 3600));
    date.setMinutes(Math.floor((seconds % 3600) / 60));
    date.setSeconds(seconds % 60);
    return date;
  };

  const t = useT();

  return (
    <SettingsSection
      id="sec-breaks"
      icon={<IconBreaks size={19} />}
      title={t("sec.breaks.title")}
      helperText={t("sec.breaks.helper")}
      toggle={{
        checked: settingsDraft.breaksEnabled,
        onCheckedChange: (checked) => onSwitchChange("breaksEnabled", checked),
      }}
    >
      <div className="grid grid-cols-3 gap-4">
        <FormGroup label={t("field.frequency")}>
          <TimeInput
            precision="seconds"
            value={settingsDraft.breakFrequencySeconds}
            onChange={(seconds) =>
              onDateChange("breakFrequency", toDate(seconds))
            }
            disabled={settingsDraft.breaksEnabled === false}
          />
        </FormGroup>
        <FormGroup label={t("field.length")}>
          <TimeInput
            precision="seconds"
            value={settingsDraft.breakLengthSeconds}
            onChange={(seconds) => onDateChange("breakLength", toDate(seconds))}
            disabled={
              settingsDraft.breaksEnabled === false ||
              settingsDraft.notificationType !== NotificationType.Popup
            }
          />
        </FormGroup>
        <FormGroup label={t("field.type")}>
          <Select
            value={settingsDraft.notificationType}
            onValueChange={onNotificationTypeChange}
            disabled={settingsDraft.breaksEnabled === false}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NotificationType.Popup}>
                {t("field.popup")}
              </SelectItem>
              <SelectItem value={NotificationType.Notification}>
                {t("field.notification")}
              </SelectItem>
            </SelectContent>
          </Select>
        </FormGroup>
      </div>

      <FormGroup label={t("field.title")}>
        <Input
          id="break-title"
          value={settingsDraft.breakTitle}
          onChange={onTextChange.bind(null, "breakTitle")}
          disabled={settingsDraft.breaksEnabled === false}
        />
      </FormGroup>

      <FormGroup label={t("field.message")} labelInfo={t("field.messageHint")}>
        <Textarea
          id="break-message"
          className="resize-none"
          rows={3}
          value={settingsDraft.breakMessage}
          onChange={onTextChange.bind(null, "breakMessage")}
          disabled={settingsDraft.breaksEnabled === false}
          placeholder={t("field.messagePlaceholder")}
        />
      </FormGroup>
    </SettingsSection>
  );
}
