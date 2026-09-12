import { motion } from "framer-motion";
import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/i18n";
import { Settings, SoundType } from "../../../types/settings";
import { TimeRemaining } from "./utils";

interface BreakPageProps {
  settings: Settings;
  endBreakEnabled: boolean;
  onEndBreak: () => void;
  closing: boolean;
  sharedBreakEndTime: number | null;
}

/* The break itself: a sheet of paper on a darkened desk.

   Everything here follows from one decision — the countdown is the text, not
   an ornament next to it. The old screen put the remaining time in 14px at the
   right end of a 2px bar, which is the smallest element on a page whose only
   job is to tell you how long you have left. Here it is the largest thing on
   the sheet, set at the size a folio number would be, and the progress rule
   runs the full width above it as a hairline that fills in ink.

   The sheet fills the window; the veil is what is behind the window. With the
   veil on, the window is the whole screen and the sheet sits inset on it, so
   the app is the only thing you can see. With the veil off, the window is a
   small card and the sheet is that card. */
export function BreakPage({
  settings,
  endBreakEnabled,
  onEndBreak,
  closing,
  sharedBreakEndTime,
}: BreakPageProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    null,
  );
  const [progress, setProgress] = useState<number | null>(null);
  const [endClock, setEndClock] = useState<string | null>(null);
  /* The clock is set, not switched on: on arrival the digits run up from zero
     to the break's length in about two thirds of a second and then settle into
     counting down. It is the one moment this screen has to say "this has
     started", and a mechanical counter coming to rest says it without a word. */
  const [windUp, setWindUp] = useState(0);
  const t = useT();
  const breakStartTime = useRef(new Date());
  const soundPlayedRef = useRef(false);
  const closingRef = useRef(closing);
  closingRef.current = closing;

  useEffect(() => {
    const started = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / 680);
      setWindUp(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const isPrimaryWindow = useMemo(() => {
    const windowId = new URLSearchParams(window.location.search).get(
      "windowId",
    );
    return windowId === "0" || windowId === null;
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (
      isPrimaryWindow &&
      settings.soundType !== SoundType.None &&
      soundPlayedRef.current === false
    ) {
      soundPlayedRef.current = true;
      ipcRenderer.invokeStartSound(
        settings.soundType,
        settings.breakSoundVolume,
      );
    }

    (async () => {
      let breakEndTime: moment.Moment;
      if (sharedBreakEndTime) {
        breakEndTime = moment(sharedBreakEndTime);
      } else {
        const lengthSeconds = await ipcRenderer.invokeGetBreakLength();
        breakEndTime = moment().add(lengthSeconds, "seconds");
      }

      const startMsRemaining = breakEndTime.diff(moment(), "milliseconds");
      setEndClock(breakEndTime.format("HH:mm"));

      const tick = () => {
        const now = moment();
        if (now > breakEndTime) {
          const durationMs =
            new Date().getTime() - breakStartTime.current.getTime();
          ipcRenderer.invokeCompleteBreakTracking(durationMs);
          onEndBreak();
          return;
        }

        const msRemaining = breakEndTime.diff(now, "milliseconds");
        setProgress(1 - msRemaining / startMsRemaining);
        setTimeRemaining({
          hours: Math.floor(msRemaining / 1000 / 3600),
          minutes: Math.floor(msRemaining / 1000 / 60),
          seconds: (msRemaining / 1000) % 60,
        });

        if (closingRef.current === false) {
          timeoutId = setTimeout(tick, 50);
        }
      };

      tick();
    })();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onEndBreak, settings, isPrimaryWindow, sharedBreakEndTime]);

  if (timeRemaining === null || progress === null) {
    return <div className="h-full w-full" />;
  }

  const ink = settings.textColor;
  const muted = `color-mix(in srgb, ${ink} 62%, transparent)`;
  const faint = `color-mix(in srgb, ${ink} 22%, transparent)`;
  const settledSeconds = Math.floor(
    timeRemaining.hours * 3600 +
      timeRemaining.minutes * 60 +
      timeRemaining.seconds,
  );
  const shownSeconds = Math.round(settledSeconds * windUp);
  const clock = `${String(Math.floor(shownSeconds / 60)).padStart(2, "0")}:${String(
    shownSeconds % 60,
  ).padStart(2, "0")}`;
  const veilOn = settings.showBackdrop;

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      {veilOn && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundColor: settings.veilColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: closing ? 0 : settings.backdropOpacity }}
          transition={{ duration: 0.5, delay: closing ? 0.3 : 0 }}
        />
      )}

      <div
        className="relative flex h-full w-full items-center justify-center"
        style={{ padding: veilOn ? "clamp(0px, 4.5vmin, 64px)" : 0 }}
      >
        <motion.div
          className="break-sheet relative flex flex-col"
          style={{
            backgroundColor: settings.backgroundColor,
            color: ink,
            borderRadius: veilOn ? "var(--radius-lg)" : 0,
            boxShadow: veilOn ? "var(--shadow-veil)" : "none",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: closing ? 0 : 1, y: closing ? -16 : 0 }}
          transition={{ duration: 0.5, delay: closing ? 0 : 0.4 }}
        >
          <header className="flex items-baseline justify-between gap-4 px-7 pt-7">
            <span className="u-label" style={{ color: muted }}>
              {t("break.eyebrow")}
            </span>
            {endClock && (
              <span className="u-label tnum" style={{ color: muted }}>
                {t("break.ends", { time: endClock })}
              </span>
            )}
          </header>

          <div
            className="mt-4 h-px w-full"
            style={{ backgroundColor: faint }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label={t("break.progress")}
          >
            {/* No width transition on purpose. The tick already re-renders
                this every 50ms and the rule moves 0.04% per tick, so a
                transition would be re-targeted before it ever finished — a
                layout-animating property bought for smoothness that was
                already there. */}
            <div
              className="h-full"
              style={{ width: `${progress * 100}%`, backgroundColor: ink }}
            />
          </div>

          {/* The same 4px star that drifts along the settings dividers, here
              marking the point in the break that the reader has actually
              reached. One mark, two jobs: a page's ornament in the window, a
              position in time on the sheet. */}
          <div className="relative h-0 w-full" aria-hidden="true">
            <span
              className="progress-star absolute size-[5px] rounded-full"
              style={{
                left: `${progress * 100}%`,
                top: 0,
                backgroundColor: ink,
              }}
            />
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span
              className="break-clock tnum leading-[0.85] tracking-[-0.03em]"
              style={{ color: ink }}
            >
              {clock}
            </span>
            <h1
              className="mt-7 max-w-[22ch] text-[20px] leading-[1.3] text-balance"
              style={{ color: ink }}
            >
              {settings.breakTitle}
            </h1>
            <p
              className="mt-3.5 max-w-[36ch] text-[15px] leading-[1.7] whitespace-pre-line"
              style={{ color: muted }}
            >
              {settings.breakMessage}
            </p>
          </div>

          {endBreakEnabled && (
            <div className="flex justify-center pb-8">
              <button
                type="button"
                className="sheet-button"
                style={{ color: ink }}
                onClick={onEndBreak}
              >
                {progress < 0.5 ? t("break.cancel") : t("break.end")}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
