import { Fermata } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { Fragment, useEffect, useState } from "react";
import { navGroups } from "./nav";

interface SettingsRailProps {
  activeGroup: string;
  showSave: boolean;
  onSave: () => void;
}

export const SCROLL_ID = "settings-scroll";

/* The rail.

   A settings window with eleven sections and four groups is a document, and a
   document has a table of contents down the side rather than a row of tabs
   across the top. The rail is that contents list: the four groups, and under
   the open one, its sections as anchors with a scroll-spy that marks where you
   are.

   It is also what a wider window buys. Widening the pane and leaving the top
   tab bar in place would have made a wider form; the width only turns into
   anything once the navigation moves to the side and the content column gets
   the room — the ledger's 24-hour scale goes from 512px to 620px, which is
   three extra drag steps across a working day. */
export default function SettingsRail({
  activeGroup,
  showSave,
  onSave,
}: SettingsRailProps) {
  const t = useT();
  const [activeEntry, setActiveEntry] = useState<string | null>(null);

  const groups = navGroups.filter(
    (group) => group.value !== "system" || processEnv.SNAP === undefined,
  );
  const open = groups.find((group) => group.value === activeGroup);

  /* Scroll-spy. The root margin shrinks the observed area to the top 40% of the
     scroll pane, so "current" means the section you are reading rather than any
     section that happens to be on screen. */
  useEffect(() => {
    const root = document.getElementById(SCROLL_ID);
    if (open === undefined || root === null) return;

    const targets = open.entries
      .map((entry) => document.getElementById(entry.id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        const onScreen = records
          .filter((record) => record.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (onScreen[0]) setActiveEntry(onScreen[0].target.id);
      },
      { root, rootMargin: "0px 0px -60% 0px", threshold: 0 },
    );

    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [open]);

  return (
    <aside className="flex w-[216px] shrink-0 flex-col border-r border-rule-faint">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-5">
        <Fermata size={21} animated />
        <h1 className="text-[15px] font-bold tracking-[0.1px] text-navy">
          Fermata
        </h1>
      </div>

      <TabsList
        className={cn(
          "flex-col items-stretch gap-0.5 rounded-none border-0 bg-transparent p-0 px-3",
          "backdrop-blur-none",
        )}
      >
        {groups.map((group, index) => {
          const isOpen = group.value === activeGroup;
          return (
            <Fragment key={group.value}>
              <TabsTrigger
                value={group.value}
                className={cn(
                  "justify-start gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[14px]",
                  /* Sand, not navy-tint. Navy-tint is a cool blue-grey and the rail has one
                   selected item at all times, so it would be the only cold surface
                   on the page for as long as the window is open. */
                  "data-[state=active]:bg-sand data-[state=active]:text-navy",
                  "hover:bg-paper-sunk",
                )}
              >
                <span
                  className={cn(
                    "transition-colors",
                    isOpen ? "text-navy" : "text-stone",
                  )}
                >
                  {group.icon}
                </span>
                <span className="tnum text-[12px] opacity-60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {t(group.labelKey)}
                </span>
              </TabsTrigger>

              {/* The open group's own contents, hung under it like a chapter's
                  sections in a printed contents list. */}
              {isOpen && group.entries.length > 1 && (
                <div className="relative mt-0.5 mb-1.5 ml-[26px] flex flex-col border-l border-rule-soft pl-3">
                  {group.entries.map((entry) => {
                    const isCurrent = activeEntry === entry.id;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => {
                          document.getElementById(entry.id)?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                        className={cn(
                          "relative -ml-3 rounded-r-[6px] py-1 pl-3 text-left text-[12px]",
                          "transition-colors duration-150",
                          "outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-navy",
                          isCurrent
                            ? "text-ink"
                            : "text-stone hover:text-olive",
                        )}
                      >
                        {/* the marker: a filled bar on the current entry, an
                            empty tick on the rest, both sitting on the rule */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute top-1/2 -left-[1px] w-[3px] -translate-y-1/2 rounded-full",
                            isCurrent ? "h-3.5 bg-navy" : "h-px bg-rule",
                          )}
                        />
                        {t(entry.labelKey)}
                      </button>
                    );
                  })}
                </div>
              )}
            </Fragment>
          );
        })}
      </TabsList>

      <div className="mt-auto flex items-center px-5 pt-6 pb-5">
        {showSave ? (
          <Button size="sm" className="w-full" onClick={onSave}>
            {t("nav.save")}
          </Button>
        ) : (
          <span className="u-label text-rule">{t("nav.saved")}</span>
        )}
      </div>
    </aside>
  );
}
