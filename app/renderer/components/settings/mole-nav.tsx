import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { navGroups } from "./nav";

interface MoleNavProps {
  showSave: boolean;
  onSave: () => void;
  onRevert: () => void;
  breaksEnabled: boolean;
}

export default function MoleNav({
  showSave,
  onSave,
  onRevert,
  breaksEnabled,
}: MoleNavProps) {
  const t = useT();
  const groups = navGroups.filter(
    (group) => group.value !== "system" || processEnv.SNAP === undefined,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (showSave) onSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSave, onSave]);

  return (
    <header className="titlebar relative z-30 flex shrink-0 items-center border-b border-border">
      <TabsList className="absolute inset-x-0 top-1/2 mx-auto flex w-max -translate-y-1/2 items-center justify-center gap-1 border-0 bg-transparent p-0">
        {groups.map((group) => (
          <TabsTrigger
            key={group.value}
            value={group.value}
            className={cn(
              "h-8 rounded-full border-0 bg-transparent px-4 text-[13px] font-medium shadow-none",
              "text-muted-foreground hover:bg-transparent hover:text-foreground-soft",
              "data-[state=active]:bg-ink-hi data-[state=active]:text-[color:var(--gold-ink)] data-[state=active]:shadow-none",
            )}
          >
            {t(group.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="ml-auto flex items-center gap-2 pr-3.5">
        <span
          className={cn(
            "tnum text-[11px] font-medium",
            breaksEnabled
              ? "text-[color:var(--ok)]"
              : "text-[color:var(--warn)]",
          )}
        >
          {breaksEnabled ? t("status.running") : t("status.paused")}
        </span>
        {showSave ? (
          <>
            <button
              type="button"
              onClick={onRevert}
              className="h-7 rounded-md px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground-soft"
            >
              {t("nav.revert")}
            </button>
            <button
              type="button"
              onClick={onSave}
              className="h-7 rounded-md bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground"
            >
              {t("nav.save")}
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
