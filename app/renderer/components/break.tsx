import { useCallback, useEffect, useState } from "react";
import { Settings, SoundType } from "../../types/settings";
import { BreakNotice } from "./break/break-notice";
import { BreakPage } from "./break/break-page";
import {
  initialBreakSession,
  onBreakClosing,
  onBreakParked,
  onBreakStart,
} from "./break/break-session";
import { isPrimaryBreakWindow } from "./break/break-window";

export default function Break() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [session, setSession] = useState(initialBreakSession);
  const [allowPostpone, setAllowPostpone] = useState<boolean | null>(null);
  const [timeSinceLastBreak, setTimeSinceLastBreak] = useState<number | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const { countingDown, closing, sharedBreakEndTime, generation } = session;

  useEffect(() => {
    const init = async () => {
      const [allowPostpone, settings, timeSince, startedFromTray] =
        await Promise.all([
          ipcRenderer.invokeGetAllowPostpone(),
          ipcRenderer.invokeGetSettings() as Promise<Settings>,
          ipcRenderer.invokeGetTimeSinceLastBreak(),
          ipcRenderer.invokeWasStartedFromTray(),
        ]);

      setAllowPostpone(allowPostpone);
      setSettings(settings);
      setTimeSinceLastBreak(timeSince);

      if (settings.immediatelyStartBreaks || startedFromTray) {
        setSession((current) => ({ ...current, countingDown: false }));
      }

      setReady(true);
    };

    const handleBreakStart = (breakEndTime: number) => {
      setSession((current) => onBreakStart(current, breakEndTime));
    };

    const handleBreakEnd = () => {
      setSession((current) => onBreakClosing(current));
    };

    ipcRenderer.onBreakStart(handleBreakStart);
    ipcRenderer.onBreakEnd(handleBreakEnd);

    // Delay or the window displays incorrectly.
    // FIXME: work out why and how to avoid this.
    setTimeout(init, 1000);
  }, []);

  const handleCountdownOver = useCallback(async () => {
    // Every display has a break window. Start tracking once, then rely on the
    // main process to broadcast the shared break timeline to every window.
    if (isPrimaryBreakWindow(window.location.search)) {
      await ipcRenderer.invokeBreakStart();
    }
  }, []);

  const handleStartBreakNow = useCallback(async () => {
    await ipcRenderer.invokeBreakStart();
  }, []);

  useEffect(() => {
    if (!countingDown) {
      ipcRenderer.invokeBreakWindowResize?.();
    }
  }, [countingDown, settings, generation]);

  useEffect(() => {
    if (!closing) {
      return;
    }
    /* Native hide is the core's job. This timeout is for Electron, where
       the window actually dies, and for Tauri it parks a leftover Space
       then resets the persistent page so the next show() is a notice. */
    const t = setTimeout(() => {
      window.close();
      setSession((current) => onBreakParked(current));
    }, 500);
    return () => clearTimeout(t);
  }, [closing]);

  const handlePostponeBreak = useCallback(async () => {
    await ipcRenderer.invokeBreakPostpone("snoozed");
    setSession((current) => onBreakClosing(current));
  }, []);

  const handleSkipBreak = useCallback(async () => {
    await ipcRenderer.invokeBreakPostpone("skipped");
    setSession((current) => onBreakClosing(current));
  }, []);

  const handleEndBreak = useCallback(async () => {
    const isPrimary = isPrimaryBreakWindow(window.location.search);

    if (isPrimary && settings && settings.soundType !== SoundType.None) {
      ipcRenderer.invokeEndSound(settings.soundType, settings.breakSoundVolume);
    }

    await ipcRenderer.invokeBreakEnd();
  }, [settings]);

  if (settings === null || allowPostpone === null) {
    return null;
  }

  if (countingDown) {
    return (
      <div className="flex h-full items-center justify-center bg-transparent">
        {ready && closing === false && (
          <BreakNotice
            key={generation}
            onCountdownOver={handleCountdownOver}
            onPostponeBreak={handlePostponeBreak}
            onSkipBreak={handleSkipBreak}
            onStartBreakNow={handleStartBreakNow}
            postponeBreakEnabled={
              settings.postponeBreakEnabled &&
              allowPostpone &&
              settings.immediatelyStartBreaks === false
            }
            skipBreakEnabled={
              settings.skipBreakEnabled &&
              settings.immediatelyStartBreaks === false
            }
            timeSinceLastBreak={timeSinceLastBreak}
          />
        )}
      </div>
    );
  }

  return (
    <BreakPage
      key={generation}
      closing={closing}
      endBreakEnabled={settings.endBreakEnabled}
      onEndBreak={handleEndBreak}
      settings={settings}
      sharedBreakEndTime={sharedBreakEndTime}
    />
  );
}
