import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SettingsSectionProps {
  /** Anchor target for the rail's contents list. Must match nav.tsx. */
  id?: string;
  title: string;
  /** The glyph for the seal. Every section has one; finding "Audio" should not
   *  require reading the word "Audio". */
  icon: ReactNode;
  helperText?: string;
  toggle?: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
  };
  children?: ReactNode;
  className?: string;
}

/* A section is an orbit, a seal and a heading — not a box.

   The screen this replaced stacked nine bordered cards inside a bordered pane
   inside a bordered window, so every level of the hierarchy was drawn with the
   same 1px rectangle and the reader had to open the borders to find out what
   belonged to what. Here an arc separates, a seal identifies, and whitespace
   nests. It is the same information with three different devices carrying it
   instead of one repeated. */
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
    <section id={id} className={cn("relative scroll-mt-6", className)}>
      <div className="orbit" aria-hidden="true" />

      <div className="section-body pt-6">
        <div className="flex items-start gap-3.5">
          <span className="seal" aria-hidden="true">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] leading-[1.3] text-ink">{title}</h3>
            {helperText && (
              <p className="mt-1.5 max-w-[52ch] text-[14px] leading-[1.55] text-stone">
                {helperText}
              </p>
            )}
          </div>
          {toggle && (
            <div className="shrink-0 pt-[7px]">
              <Switch
                checked={toggle.checked}
                onCheckedChange={toggle.onCheckedChange}
                disabled={toggle.disabled}
                aria-label={title}
              />
            </div>
          )}
        </div>

        {children && <div className="mt-5 space-y-4">{children}</div>}
      </div>
    </section>
  );
}
