import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useT } from "../i18n";
import { TrayStatus } from "../../types/breaks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Numeral } from "@/components/numeral";
import {
  IconAdvanced,
  IconBreaks,
  IconChevronRight,
  IconScreen,
  IconSnooze,
  IconWeek,
} from "@/components/icons";
import { formatClock, formatDuration, formatMinuteOfDay } from "@/lib/format";

/* The one bar a tile may carry is a position in a cycle, not a decoration: how
   far through the interval you are, how far into today's window, how long since
   the last break relative to the cadence. The previous version drew five fixed
   heights scaled by a constant, which looked like an instrument and measured
   nothing — the craft floor's "supply the truth or label it" rule, and a
   sparkline that cannot change is worse than no sparkline. */
function Bar(props: { at: number; tone?: "ok" | "warn" }) {
  return (
    <div className="bar" aria-hidden="true">
      <i
        className={props.tone === "warn" ? "is-warn" : undefined}
        style={{
          transform: `scaleX(${Math.round(Math.max(0.02, Math.min(1, props.at)) * 100) / 100})`,
        }}
      />
    </div>
  );
}

/* Mole reads number-first: handled by the shared Numeral component. */

function Card(props: {
  icon?: ReactNode;
  k: string;
  v: string;
  duration?: boolean;
  chip?: string;
  chipTone?: "ok" | "warn";
  sub?: string;
  at?: number | null;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="tile">
      <div className="flex items-center justify-between gap-2">
        <span className="tile-label">
          {props.icon}
          {props.k}
        </span>
        {props.chip && (
          <span
            className={cn(
              "chip",
              props.chipTone === "warn" && "chip-warn",
              props.chipTone === "ok" && "chip-ok",
            )}
          >
            {props.chip}
          </span>
        )}
      </div>
      <p className="tile-value mt-2">
        {props.duration ? (
          <Numeral
            text={props.v}
            unit="text-[12px] font-medium text-muted-foreground"
          />
        ) : (
          props.v
        )}
      </p>
      {/* No cycle, no bar — but keep the heights: a bar glued to its numeral
         reads as a strikethrough, and a caption line that vanishes shifts the
         whole row's rules off the same lines. */}
      <div className="mt-2.5">
        {typeof props.at === "number" ? (
          <Bar at={props.at} tone={props.tone} />
        ) : (
          <span className="block h-[3px]" aria-hidden="true" />
        )}
      </div>
      <p className="tile-caption mt-1.5 min-h-[13px]">{props.sub}</p>
    </div>
  );
}

/* Weekday names for the hero, indexed by Date.getDay(): when the next window
   opens on another day, a countdown of "61小时" asks the reader to do arithmetic
   that "周一 09:00" does not. */
const DAY_KEYS = [
  "day.sunday",
  "day.monday",
  "day.tuesday",
  "day.wednesday",
  "day.thursday",
  "day.friday",
  "day.saturday",
] as const;

export default function TrayPanel() {
  const t = useT();
  const locale = useLocale();
  const [status, setStatus] = useState<TrayStatus | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [now, setNow] = useState(Date.now());

  /* Showing the window hands focus to the first control, which paints a focus
     ring on Break now before anyone has touched the keyboard. Clear it; tab
     still reaches every control, and the ring still appears when it should. */
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  /* Escape is the expected way to shut a focused popover. The window also
     closes on blur, but a keyboard user who opened it deliberately should not
     have to click away or cycle focus to leave. */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") ipcRenderer.invokeHideTrayPopover();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const next = (await ipcRenderer.invokeGetTrayStatus()) as TrayStatus;
      if (alive) setStatus(next);
    };
    load();
    /* Poll only while the popover is on screen. It is built at launch and lives
       hidden between opens, so an unconditional 2s poll would run all day for a
       surface nobody is looking at. Showing it refreshes first, so the numbers
       are never stale when they appear. */
    let poll = 0;
    const sync = () => {
      window.clearInterval(poll);
      if (document.visibilityState !== "visible") return;
      load();
      poll = window.setInterval(load, 2000);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
  }, []);

  /* Tell the window how tall the card came out. Language and the length of a
     duration both move this number, so it is measured rather than fixed. */
  useEffect(() => {
    const el = panelRef.current;
    if (el === null) return;
    const report = () =>
      ipcRenderer.invokeResizeTrayPopover(el.offsetHeight + 16);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [status]);
  if (status === null) return <div className="h-full w-full bg-transparent" />;

  const remaining = status.nextBreakAt
    ? Math.max(0, Math.round((status.nextBreakAt - now) / 1000))
    : null;
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const on = status.enabled;
  /* A cycle only runs inside the working window. Outside it — or paused — the
     app is quiet on purpose, and the dashboard must not keep narrating a
     countdown that is not happening: no progress bars, and a hero that counts
     to the next window opening rather than dressing the cadence up as news. */
  const active = on !== false && status.inWorkingHours !== false;
  const resumeSameDay =
    status.nextWindowOpenAt !== null &&
    new Date(status.nextWindowOpenAt).toDateString() ===
      new Date(now).toDateString();
  let headline = t("status.running");
  let tone = "ok";
  if (on === false) {
    headline = t("status.paused");
    tone = "warn";
  } else if (status.inWorkingHours === false) {
    headline = t("trayPanel.outside");
    tone = "muted";
  } else if (status.havingBreak) {
    headline = t("trayPanel.onBreak");
  }
  let hero = "-";
  let heroDuration = false;
  if (active) {
    hero =
      remaining === null
        ? formatDuration(status.frequencySeconds, locale)
        : formatDuration(remaining, locale);
    heroDuration = true;
  } else if (status.nextWindowOpenAt !== null) {
    const resumeIn = Math.max(0, status.nextWindowOpenAt - now);
    if (resumeIn < 86_400_000) {
      hero = formatDuration(Math.round(resumeIn / 1000), locale);
      heroDuration = true;
    } else {
      hero = `${t(DAY_KEYS[new Date(status.nextWindowOpenAt).getDay()])} ${formatClock(status.nextWindowOpenAt)}`;
    }
  }
  /* How far through the interval we are: the only series this app actually
     has, and the same number the hero rule draws. */
  const progress =
    remaining === null || status.frequencySeconds === 0
      ? null
      : 1 - remaining / status.frequencySeconds;
  const nextAt =
    remaining === null || on === false
      ? null
      : formatClock(status.nextBreakAt ?? Date.now());
  /* Progress through today's window, or null when there is no window — the
     bar then stands empty rather than lying about a position. */
  const windowProgress =
    status.todayFromMinutes === null || status.todayToMinutes === null
      ? null
      : Math.min(
          1,
          Math.max(
            0,
            (nowMinutes - status.todayFromMinutes) /
              Math.max(1, status.todayToMinutes - status.todayFromMinutes),
          ),
        );
  const freq = formatDuration(status.frequencySeconds, locale);
  const len = formatDuration(status.lengthSeconds, locale);
  const since =
    status.sinceLastBreakSeconds === null
      ? "-"
      : formatDuration(status.sinceLastBreakSeconds, locale);

  return (
    <div
      className={cn(
        "h-full w-full bg-transparent",
        processPlatform === "darwin" ? "p-2" : "p-0",
      )}
    >
      <div className="panel" ref={panelRef}>
        <div className="flex items-center gap-2 px-3.5 pt-3">
          {/* The hand: gold while a cycle runs, amber at rest. */}
          <span
            aria-hidden="true"
            className={cn(
              "size-2.5 shrink-0 rounded-full",
              active ? "now-dot bg-primary" : "bg-[color:var(--warn)]",
            )}
          />
          <span className="tile-hero flex items-baseline">
            {heroDuration ? (
              <Numeral
                text={hero}
                unit="text-[14px] font-medium text-muted-foreground"
              />
            ) : (
              hero
            )}
          </span>
          {/* The verdict is a state chip pinned to the right edge — same
             grammar as the tiles' chips, and the hero keeps its room. */}
          <span
            role="status"
            className={cn(
              "chip ml-auto shrink-0",
              tone === "ok" && "chip-ok",
              tone === "warn" && "chip-warn",
            )}
          >
            {headline}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 px-3 pb-3">
          <Card
            icon={<IconBreaks className="size-3.5" />}
            k={t("trayPanel.freqShort")}
            v={freq}
            duration
            chip={nextAt ?? undefined}
            chipTone={
              remaining !== null && remaining <= 60 ? "warn" : undefined
            }
            sub={
              nextAt !== null
                ? undefined
                : on === false
                  ? t("status.paused")
                  : status.nextWindowOpenAt !== null && resumeSameDay
                    ? t("trayPanel.resumesAt", {
                        time: formatClock(status.nextWindowOpenAt),
                      })
                    : t("trayPanel.noMoreToday")
            }
            at={nextAt === null ? null : progress}
            tone={remaining !== null && remaining <= 60 ? "warn" : "ok"}
          />
          <Card
            icon={<IconScreen className="size-3.5" />}
            k={t("trayPanel.lenShort")}
            v={len}
            duration
            chip={
              status.popup
                ? t("trayPanel.modeSheet")
                : t("trayPanel.modeNotify")
            }
          />
          <Card
            icon={<IconSnooze className="size-3.5" />}
            k={t("trayPanel.sinceShort")}
            v={since}
            duration
            chip={
              status.sinceLastBreakSeconds === null
                ? undefined
                : formatClock(Date.now() - status.sinceLastBreakSeconds * 1000)
            }
            at={
              !active ||
              status.sinceLastBreakSeconds === null ||
              status.frequencySeconds === 0
                ? null
                : Math.min(
                    1,
                    status.sinceLastBreakSeconds / status.frequencySeconds,
                  )
            }
          />
          <Card
            icon={<IconWeek className="size-3.5" />}
            k={t("nav.hours")}
            v={
              status.inWorkingHours
                ? t("trayPanel.inside")
                : t("trayPanel.outside")
            }
            sub={
              status.todayFromMinutes === null
                ? t("trayPanel.noHours")
                : formatMinuteOfDay(status.todayFromMinutes) +
                  " - " +
                  formatMinuteOfDay(status.todayToMinutes)
            }
            at={windowProgress}
            tone={status.inWorkingHours ? "ok" : "warn"}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-border px-3 py-2.5">
          <Button size="sm" onClick={() => ipcRenderer.invokeStartBreakNow()}>
            {t("trayPanel.start")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => ipcRenderer.invokeSetBreaksEnabled(on === false)}
          >
            {on ? t("trayPanel.pause") : t("trayPanel.resume")}
          </Button>
        </div>
        <Button
          size="quiet"
          variant="ghost"
          className="mb-2.5"
          onClick={() => ipcRenderer.invokeOpenSettingsWindow()}
        >
          <IconAdvanced className="size-3.5" />
          <span className="flex-1 text-left">{t("trayPanel.settings")}</span>
          <IconChevronRight className="size-3.5 opacity-60" />
        </Button>
      </div>
    </div>
  );
}
