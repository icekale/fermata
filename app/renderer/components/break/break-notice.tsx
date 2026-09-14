import { Button } from "@/components/ui/button";
import moment from "moment";
import { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { formatTimeSinceLastBreak } from "./utils";

const GRACE_PERIOD_MS = 60_000;
const TOTAL_COUNTDOWN_MS = 120_000;

interface BreakNoticeProps {
  onCountdownOver: () => void;
  onPostponeBreak: () => void;
  onSkipBreak: () => void;
  onStartBreakNow: () => void;
  postponeBreakEnabled: boolean;
  skipBreakEnabled: boolean;
  timeSinceLastBreak: number | null;
}

export function BreakNotice({
  onCountdownOver,
  onPostponeBreak,
  onSkipBreak,
  onStartBreakNow,
  postponeBreakEnabled,
  skipBreakEnabled,
  timeSinceLastBreak,
}: BreakNoticeProps) {
  const [phase, setPhase] = useState<"grace" | "countdown">("grace");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = moment();
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      const elapsed = moment().diff(start, "milliseconds");
      if (elapsed >= TOTAL_COUNTDOWN_MS) {
        onCountdownOver();
        return;
      }
      setElapsed(elapsed);
      setPhase(elapsed < GRACE_PERIOD_MS ? "grace" : "countdown");
      timeoutId = setTimeout(tick, 100);
    };

    tick();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onCountdownOver]);

  const secondsRemaining = Math.ceil((TOTAL_COUNTDOWN_MS - elapsed) / 1000);
  const clock = `${Math.floor(secondsRemaining / 60)}:${String(
    secondsRemaining % 60,
  ).padStart(2, "0")}`;
  /* One timeline: the slip is 2 minutes from "asked" to "taken", and the bar
     moves through the grace half too — a bar parked at 0% for a minute is the
     lie that makes the fullscreen takeover feel like an ambush. */
  const progress = (elapsed / TOTAL_COUNTDOWN_MS) * 100;

  const t = useT();

  return (
    <div className="slip-land relative flex h-full w-full flex-col justify-center overflow-hidden rounded-[14px] border border-border bg-raised px-5 shadow-lift">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="tile-label">
            {t(
              phase === "grace"
                ? "notice.eyebrow.grace"
                : "notice.eyebrow.countdown",
            )}
          </span>
          {phase === "countdown" ? (
            <p className="tile-value mt-1.5">{clock}</p>
          ) : (
            <p className="mt-1.5 text-[13px] font-medium leading-snug text-foreground">
              {t("notice.grace")}
            </p>
          )}
          {/* On its own line: beside the headline it had to be truncated, and a
              cut-off sentence is worse than one more line on a 100px slip. */}
          {timeSinceLastBreak !== null && (
            <p className="tile-caption mt-1.5">
              {(() => {
                const since = formatTimeSinceLastBreak(timeSinceLastBreak);
                return t(since.key, since.vars);
              })()}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={onStartBreakNow}>
            {t("notice.start")}
          </Button>
          {postponeBreakEnabled && (
            <Button size="sm" variant="outline" onClick={onPostponeBreak}>
              {t("notice.snooze")}
            </Button>
          )}
          {skipBreakEnabled && (
            <Button size="sm" variant="ghost" onClick={onSkipBreak}>
              {t("notice.skip")}
            </Button>
          )}
        </div>
      </div>

      <div
        className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-well"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label={t("notice.progress")}
      >
        <div
          className="h-full bg-primary transition-[width] duration-100 ease-linear rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
