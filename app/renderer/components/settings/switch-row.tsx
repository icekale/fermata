import { Switch } from "@/components/ui/switch";

interface SwitchRowProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

/* Label left, switch right, always. An in-section switch and the section's own
   switch are the same control at different scopes, so they sit on the same
   axis; putting one before its label and one after it makes the reader work
   out which is which every time. */
export default function SwitchRow({
  label,
  checked,
  onCheckedChange,
  disabled,
}: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="font-sans text-[13px] leading-[1.5] text-foreground-soft">
        {label}
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}
