import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPlay } from "@/components/icons";
import { SoundType } from "../../types/settings";

interface SoundSelectProps {
  value: SoundType;
  onChange: (value: SoundType) => void;
  disabled?: boolean;
  volume?: number;
}

export function SoundSelect({
  value,
  onChange,
  disabled,
  volume = 1,
}: SoundSelectProps) {
  const playSound = (soundType: SoundType) => {
    if (soundType === SoundType.None) return;
    ipcRenderer.invokeStartSound(soundType, volume);
  };

  const t = useT();

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="min-w-0 flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SoundType.None}>{t("sound.none")}</SelectItem>
          <SelectItem value={SoundType.Gong}>{t("sound.gong")}</SelectItem>
          <SelectItem value={SoundType.Blip}>{t("sound.blip")}</SelectItem>
          <SelectItem value={SoundType.Bloop}>{t("sound.bloop")}</SelectItem>
          <SelectItem value={SoundType.Ping}>{t("sound.ping")}</SelectItem>
          <SelectItem value={SoundType.Scifi}>{t("sound.scifi")}</SelectItem>
        </SelectContent>
      </Select>
      {value !== SoundType.None && (
        <Button
          size="icon"
          variant="outline"
          disabled={disabled}
          onClick={() => playSound(value)}
          aria-label={t("sound.preview")}
        >
          <IconPlay className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
