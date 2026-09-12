import { useCallback, useEffect, useState } from "react";
import { Settings, SoundType } from "../../types/settings";
import { BreakNotice } from "./break/break-notice";
import { BreakPage } from "./break/break-page";
import { isPrimaryBreakWindow } from "./break/break-window";

export default function Break() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [countingDown, setCountingDown] = useState(true);
  const [allowPostpone, setAllowPostpone] = useState<boolean | null>(null);
  const [timeSinceLastBreak, setTimeSinceLastBreak] = useState<number | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const [closing, setClosing] = useState(false);
  const [sharedBreakEndTime, setSharedBreakEndTime] = useState<number | null>(
    null,
  );

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

      // Skip the countdown if immediately start breaks is enabled or started from tray
      if (settings.immediatelyStartBreaks || startedFromTray) {
        setCountingDown(false);
      }

      setReady(true);
    };

    // Listen for break start broadcasts from other windows
    const handleBreakStart = (breakEndTime: number) => {
      setSharedBreakEndTime(breakEndTime);
      setCountingDown(false);
    };

    // Listen for break end broadcasts from other windows
    const handleBreakEnd = () => {
      setClosing(true);
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
      // Resize window to full screen for break phase
      const renderer = ipcRenderer as typeof ipcRenderer & {
        invokeBreakWindowResize?: () => Promise<void>;
      };
      if (renderer.invokeBreakWindowResize) {
        renderer.invokeBreakWindowResize();
      }
    }
  }, [countingDown, settings]);

  useEffect(() => {
    if (closing) {
      setTimeout(() => {
        window.close();
      }, 500);
    }
  }, [closing]);

  const handlePostponeBreak = useCallback(async () => {
    await ipcRenderer.invokeBreakPostpone("snoozed");
    setClosing(true);
  }, []);

  const handleSkipBreak = useCallback(async () => {
    await ipcRenderer.invokeBreakPostpone("skipped");
    setClosing(true);
  }, []);

  const handleEndBreak = useCallback(async () => {
    // Only play end sound from primary window
    const urlParams = new URLSearchParams(window.location.search);
    const windowId = urlParams.get("windowId");
    const isPrimary = windowId === "0" || windowId === null;

    if (isPrimary && settings && settings?.soundType !== SoundType.None) {
      ipcRenderer.invokeEndSound(settings.soundType, settings.breakSoundVolume);
    }

    // Broadcast to all windows to start their closing animations
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
      closing={closing}
      endBreakEnabled={settings.endBreakEnabled}
      onEndBreak={handleEndBreak}
      settings={settings}
      sharedBreakEndTime={sharedBreakEndTime}
    />
  );
}
