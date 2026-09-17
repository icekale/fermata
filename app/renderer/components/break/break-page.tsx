import { motion, MotionConfig } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/i18n";
import { Settings, SoundType } from "../../../types/settings";
import { isPrimaryBreakWindow } from "./break-window";
import { TimeRemaining } from "./utils";

interface BreakPageProps {
  settings: Settings;
  endBreakEnabled: boolean;
  onEndBreak: () => void;
  closing: boolean;
  sharedBreakEndTime: number | null;
}

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
  const [windUp, setWindUp] = useState(0);
  const t = useT();
  const breakStartTime = useRef(new Date());
  const soundPlayedRef = useRef(false);
  const closingRef = useRef(closing);
  const onEndBreakRef = useRef(onEndBreak);
  closingRef.current = closing;
  onEndBreakRef.current = onEndBreak;

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

  const isPrimaryWindow = useMemo(
    () => isPrimaryBreakWindow(window.location.search),
    [],
  );

  /* No keydown handler here on purpose: break windows are created focusable:
     false (app/main/lib/windows.ts) so they never steal focus from the work
     they interrupt, which also means no key event can ever reach this page.
     The buttons are the way out, and they are one click. */

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

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
      const breakEndTime = sharedBreakEndTime
        ? sharedBreakEndTime
        : Date.now() + (await ipcRenderer.invokeGetBreakLength()) * 1000;

      if (cancelled) {
        return;
      }

      const startMsRemaining = Math.max(1, breakEndTime - Date.now());
      const end = new Date(breakEndTime);
      setEndClock(
        `${String(end.getHours()).padStart(2, "0")}:${String(
          end.getMinutes(),
        ).padStart(2, "0")}`,
      );

      const tick = () => {
        if (cancelled) {
          return;
        }
        const now = Date.now();
        if (now > breakEndTime) {
          if (closingRef.current) {
            return;
          }
          const durationMs = now - breakStartTime.current.getTime();
          ipcRenderer.invokeCompleteBreakTracking(durationMs);
          onEndBreakRef.current();
          return;
        }

        const msRemaining = breakEndTime - now;
        setProgress(1 - msRemaining / startMsRemaining);
        setTimeRemaining({
          hours: Math.floor(msRemaining / 1000 / 3600),
          minutes: Math.floor(msRemaining / 1000 / 60),
          seconds: (msRemaining / 1000) % 60,
        });

        if (closingRef.current === false) {
          /* The clock reads mm:ss; ticking faster than 4 Hz renders digits
             that cannot change and re-renders the whole sheet for it. */
          timeoutId = setTimeout(tick, 250);
        }
      };

      tick();
    })();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [settings, isPrimaryWindow, sharedBreakEndTime]);

  if (timeRemaining === null || progress === null) {
    return <div className="h-full w-full" />;
  }

  const ink = settings.textColor;
  const muted = `color-mix(in srgb, ${ink} 65%, transparent)`;
  const faint = `color-mix(in srgb, ${ink} 18%, transparent)`;
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

  if (closing) {
    /* The one authored exit beat: the sheet dissolves, a single quiet
       confirmation holds the screen for a beat, then the window goes. */
    return (
      <MotionConfig reducedMotion="user">
        <div
          className="flex h-full w-full select-none items-center justify-center"
          style={{ backgroundColor: settings.backgroundColor }}
          onClick={onEndBreak}
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Enter") {
              onEndBreak();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 0.25 }}
            className="text-[15px] font-medium tracking-wide"
            style={{ color: ink }}
          >
            {t("break.done")}
          </motion.span>
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative h-full w-full overflow-hidden bg-transparent select-none">
        {veilOn && (
          <motion.div
            aria-hidden="true"
            /* No backdrop-blur here: a live blur over a 3440-wide surface
               every frame is a GPU tax the compositor pays for the whole
               break. The veil reads as a darkening layer, which is the
               design. */
            className="absolute inset-0"
            style={{ backgroundColor: settings.veilColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: closing ? 0 : settings.backdropOpacity }}
            transition={{ duration: 0.4, delay: closing ? 0.2 : 0 }}
          />
        )}

        <div
          className="relative flex h-full w-full items-center justify-center"
          /* The sheet is a card in both modes. Veil on: it floats on the veil.
             Veil off: it floats on the desktop — the padding gives its shadow
             room, since a shadow is the OS's to draw outside the window and a
             window-edge cut turns it back into a square frame. */
          style={{
            padding: veilOn
              ? "clamp(16px, 4.5vmin, 64px)"
              : "clamp(16px, 4vmin, 32px)",
          }}
        >
          <motion.div
            className="break-sheet relative flex flex-col overflow-hidden"
            style={{
              backgroundColor: settings.backgroundColor,
              color: ink,
              borderRadius: "24px",
              boxShadow: veilOn ? "var(--shadow-veil)" : "var(--shadow-lift)",
              border:
                "1px solid color-mix(in srgb, currentColor 12%, transparent)",
            }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: closing ? 0 : 1, scale: closing ? 0.97 : 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <header className="flex items-baseline justify-between gap-4 px-8 pt-7">
              <span
                className="tile-label font-sans text-xs font-semibold tracking-wider"
                style={{ color: muted }}
              >
                {t("break.eyebrow")}
              </span>
              {endClock && (
                <span
                  className="tile-label tnum text-xs font-medium"
                  style={{ color: muted }}
                >
                  {t("break.ends", { time: endClock })}
                </span>
              )}
            </header>

            <div
              className="mt-4 h-1 w-full overflow-hidden"
              style={{ backgroundColor: faint }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              aria-label={t("break.progress")}
            >
              <div
                className="h-full transition-all duration-75"
                style={{ width: `${progress * 100}%`, backgroundColor: ink }}
              />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
              {/* One typographic voice for the countdown: the same sans with
                  tabular figures as every other numeral in the app. The mono
                  face was a costume the protagonist wore only onstage. */}
              <span className="break-clock" style={{ color: ink }}>
                {clock}
              </span>
              <h1
                className="mt-6 max-w-[26ch] text-[22px] font-bold leading-snug tracking-tight text-balance"
                style={{ color: ink }}
              >
                {settings.breakTitle || t("break.defaultTitle")}
              </h1>
              <p
                className="mt-3 max-w-[40ch] text-[14px] leading-relaxed whitespace-pre-line"
                style={{ color: muted }}
              >
                {settings.breakMessage || t("break.defaultMessage")}
              </p>
            </div>

            {endBreakEnabled && (
              <div className="flex justify-center pb-8">
                <button
                  type="button"
                  className="sheet-button gap-1.5"
                  style={{ color: ink }}
                  onClick={onEndBreak}
                >
                  <span>
                    {progress < 0.5 ? t("break.cancel") : t("break.end")}
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}
