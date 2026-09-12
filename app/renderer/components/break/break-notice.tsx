import { Button } from "@/components/ui/button";
import moment from "moment";
import { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { formatTimeSinceLastBreak } from "./utils";

const GRACE_PERIOD_MS = 60_000;
const TOTAL_COUNTDOWN_MS = 120_000;
const COUNTDOWN_MS = TOTAL_COUNTDOWN_MS - GRACE_PERIOD_MS;

interface BreakNoticeProps {
  onCountdownOver: () => void;
  onPostponeBreak: () => void;
  onSkipBreak: () => void;
  onStartBreakNow: () => void;
  postponeBreakEnabled: boolean;
  skipBreakEnabled: boolean;
  timeSinceLastBreak: number | null;
}

/* The notice that arrives a minute before a break: a slip of paper laid over
   whatever you are doing.

   The old slip colour-filled its own background from the break theme and drew
   the countdown as a translucent wipe across the whole card, so the one thing
   you needed to read — how long you have — was the thing competing with a
   moving coloured rectangle. Here the slip is always paper, the countdown is
   the largest thing on it, and the only moving part is a 1px rule. */
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
  const [msRemaining, setMsRemaining] = useState(0);

  useEffect(() => {
    const start = moment();
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      const elapsed = moment().diff(start, "milliseconds");
      if (elapsed < GRACE_PERIOD_MS) {
        setPhase("grace");
      } else if (elapsed < TOTAL_COUNTDOWN_MS) {
        setPhase("countdown");
        setMsRemaining(TOTAL_COUNTDOWN_MS - elapsed);
      } else {
        onCountdownOver();
        return;
      }
      timeoutId = setTimeout(tick, 100);
    };

    tick();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onCountdownOver]);

  const secondsRemaining = Math.ceil(msRemaining / 1000);
  const clock = `${Math.floor(secondsRemaining / 60)}:${String(
    secondsRemaining % 60,
  ).padStart(2, "0")}`;
  const progress =
    phase === "countdown"
      ? ((COUNTDOWN_MS - msRemaining) / COUNTDOWN_MS) * 100
      : 0;

  const t = useT();

  return (
    <div
      className="slip-land relative flex h-full w-full flex-col justify-center overflow-hidden rounded-[var(--radius-lg)] border border-rule px-4"
      style={{ backgroundColor: "var(--paper-raised)" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="u-label block">
            {t(
              phase === "grace"
                ? "notice.eyebrow.grace"
                : "notice.eyebrow.countdown",
            )}
          </span>
          <div className="mt-1 flex items-baseline gap-2.5">
            {phase === "countdown" ? (
              <span className="tnum text-[24px] leading-none text-ink">
                {clock}
              </span>
            ) : (
              <span className="text-[14px] leading-none text-ink">
                {t("notice.grace")}
              </span>
            )}
            {timeSinceLastBreak !== null && (
              <span className="truncate font-sans text-[12px] leading-none text-stone">
                {(() => {
                  const since = formatTimeSinceLastBreak(timeSinceLastBreak);
                  return t(since.key, since.vars);
                })()}
              </span>
            )}
          </div>
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

      <div className="mt-3 h-px w-full bg-rule-soft">
        <div
          className="h-full bg-navy transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
