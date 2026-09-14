import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SettingsSectionProps {
  id?: string;
  title: string;
  icon?: ReactNode;
  helperText?: string;
  toggle?: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
  };
  children?: ReactNode;
  className?: string;
}

export default function SettingsSection({
  id,
  title,
  icon,
  helperText,
  toggle,
  children,
  className = "",
}: SettingsSectionProps) {
  return (
    <section id={id} className={cn("tile scroll-mt-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && (
              <span
                aria-hidden="true"
                className="shrink-0 text-muted-foreground [&_svg]:size-3.5"
              >
                {icon}
              </span>
            )}
            <h2 className="text-[13px] font-semibold text-foreground">
              {title}
            </h2>
          </div>
          {helperText && (
            <p className="mt-1 max-w-[52ch] text-[12px] leading-snug text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
        {toggle && (
          <Switch
            checked={toggle.checked}
            onCheckedChange={toggle.onCheckedChange}
            disabled={toggle.disabled}
            aria-label={title}
          />
        )}
      </div>
      {children && <div className="mt-3 space-y-3">{children}</div>}
    </section>
  );
}
