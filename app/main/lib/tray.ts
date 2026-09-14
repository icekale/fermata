import { app, dialog, Menu, Tray } from "electron";
import log from "electron-log";
import moment from "moment";
import path from "path";
import fs from "fs";
import packageJson from "../../../package.json";
import { TrayTextMode } from "../../types/settings";
import {
  checkIdle,
  checkInWorkingHours,
  getBreakTime,
  getTimeSinceLastCompletedBreak,
  isHavingBreak,
  startBreakNow,
} from "./breaks";
import {
  getDisableEndTime,
  getSettings,
  setDisableEndTime,
  setSettings,
} from "./store";
import {
  closeBreakWindows,
  createSettingsWindow,
  hideTrayPopover,
  toggleTrayPopover,
} from "./windows";
import { t } from "./l10n";

let tray: Tray;
let trayMenu: Menu | null = null;
let lastMinsLeft = 0;

function checkDisableTimeout() {
  const disableEndTime = getDisableEndTime();

  if (disableEndTime && Date.now() >= disableEndTime) {
    setDisableEndTime(null);
    const settings = getSettings();
    setSettings({ ...settings, breaksEnabled: true });
    buildTray();
  }
}

function getDisableTimeRemaining(): string {
  const disableEndTime = getDisableEndTime();
  if (!disableEndTime) {
    return "";
  }

  const remainingMs = disableEndTime - Date.now();
  const remainingMinutes = Math.floor(remainingMs / 60000);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingDisplayMinutes = remainingMinutes % 60;

  if (remainingMinutes < 1) {
    return "<1m";
  } else if (remainingHours > 0) {
    return `${remainingHours}h ${remainingDisplayMinutes}m`;
  } else {
    return `${remainingMinutes}m`;
  }
}

function formatCompactDuration(seconds: number): string {
  if (seconds < 60) {
    return "<1m";
  }

  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
  }

  return `${totalMinutes}m`;
}

function getTrayTitle(): string | null {
  const settings = getSettings();

  if (!settings.trayTextEnabled) return null;
  if (!settings.breaksEnabled) return null;
  if (!checkInWorkingHours()) return null;
  if (isHavingBreak()) return null;

  switch (settings.trayTextMode) {
    case TrayTextMode.TimeToNextBreak: {
      const breakTime = getBreakTime();

      if (breakTime === null) return null;

      const secondsLeft = Math.max(breakTime.diff(moment(), "seconds"), 0);
      return ` ${formatCompactDuration(secondsLeft)}`;
    }
    case TrayTextMode.TimeSinceLastBreak: {
      const secondsSinceLastBreak = getTimeSinceLastCompletedBreak();
      if (secondsSinceLastBreak === null) return null;
      return ` ${formatCompactDuration(secondsSinceLastBreak)}`;
    }
    default:
      return null;
  }
}

export function buildTray(): void {
  if (!tray) {
    const isDarwin = process.platform === "darwin";
    const iconName = isDarwin ? "tray-iconTemplate.png" : "icon.png";
    const candidates = [
      path.join(__dirname, "../../../resources/tray", iconName),
      path.join(__dirname, "../../resources/tray", iconName),
      path.join(app.getAppPath(), "resources/tray", iconName),
      path.join(process.resourcesPath, "app/resources/tray", iconName),
      path.join(process.resourcesPath, "tray", iconName),
      path.resolve(process.cwd(), "resources/tray", iconName),
    ];
    let imgPath = candidates[0];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        imgPath = p;
        break;
      }
    }
    tray = new Tray(imgPath);
    tray.on("click", () => {
      toggleTrayPopover(tray);
    });
    /* Linux needs the menu attached with setContextMenu (below); on macOS and
       Windows it is popped up here, so the left click can own the HUD. */
    if (process.platform !== "linux") {
      tray.on("right-click", () => {
        hideTrayPopover();
        if (trayMenu) tray.popUpContextMenu(trayMenu);
      });
    }
  }

  let settings = getSettings();
  const breaksEnabled = settings.breaksEnabled;

  if (process.platform === "darwin") {
    const trayTitle = getTrayTitle();
    tray.setTitle(trayTitle ?? "", { fontType: "monospacedDigit" });
  }

  const setBreaksEnabled = (breaksEnabled: boolean): void => {
    if (breaksEnabled) {
      log.info("Enabled breaks");
      setDisableEndTime(null);
    } else if (isHavingBreak()) {
      closeBreakWindows();
    }

    settings = getSettings();
    setSettings({ ...settings, breaksEnabled });
    buildTray();
  };

  const disableIndefinitely = (): void => {
    log.info("Disabled breaks indefinitely");
    setBreaksEnabled(false);
  };

  const disableBreaksFor = (duration: number): void => {
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const displayMinutes = minutes % 60;

    if (hours > 0) {
      log.info(`Disabled breaks for ${hours}h${displayMinutes}m`);
    } else {
      log.info(`Disabled breaks for ${minutes}m`);
    }

    setBreaksEnabled(false);
    const endTime = Date.now() + duration;
    setDisableEndTime(endTime);
    buildTray();
  };

  const createAboutWindow = (): void => {
    dialog.showMessageBox({
      title: t("tray.aboutTitle"),
      type: "info",
      message: `Fermata ${packageJson.version}`,
      detail: t("tray.aboutBody"),
    });
  };

  const quit = (): void => {
    setTimeout(() => {
      app.exit(0);
    });
  };

  const breakTime = getBreakTime();
  const inWorkingHours = checkInWorkingHours();
  const idle = checkIdle();
  const havingBreak = isHavingBreak();
  const minsLeft = breakTime?.diff(moment(), "minutes");

  let nextBreak = "";

  if (minsLeft !== undefined) {
    if (minsLeft > 1) {
      nextBreak = t("tray.nextBreak.other", { minutes: minsLeft });
    } else if (minsLeft === 1) {
      nextBreak = t("tray.nextBreak.one");
    } else {
      nextBreak = t("tray.nextBreak.less");
    }
  }

  const disableEndTime = getDisableEndTime();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: nextBreak,
      visible:
        breakTime !== null &&
        inWorkingHours &&
        settings.breaksEnabled &&
        !havingBreak,
      enabled: false,
    },
    {
      label: t("tray.disabledFor", { time: getDisableTimeRemaining() }),
      visible: disableEndTime !== null && !breaksEnabled,
      enabled: false,
    },
    {
      label: t("tray.outsideHours"),
      visible: !inWorkingHours,
      enabled: false,
    },
    {
      label: t("tray.idle"),
      visible: idle,
      enabled: false,
    },
    { type: "separator" },
    {
      label: t("tray.enable"),
      click: setBreaksEnabled.bind(null, true),
      visible: !breaksEnabled,
    },
    {
      label: t("tray.disable"),
      submenu: [
        { label: t("tray.indefinitely"), click: disableIndefinitely },
        {
          label: t("tray.minutes30"),
          click: () => disableBreaksFor(30 * 60 * 1000),
        },
        {
          label: t("tray.hour1"),
          click: () => disableBreaksFor(60 * 60 * 1000),
        },
        {
          label: t("tray.hour2"),
          click: () => disableBreaksFor(2 * 60 * 60 * 1000),
        },
        {
          label: t("tray.hour4"),
          click: () => disableBreaksFor(4 * 60 * 60 * 1000),
        },
        {
          label: t("tray.restOfDay"),
          click: () => {
            const now = new Date();
            const endOfDay = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              23,
              59,
              59,
            );
            disableBreaksFor(endOfDay.getTime() - now.getTime());
          },
        },
      ],
      visible: breaksEnabled,
    },
    {
      label: t("tray.startNow"),
      visible: !havingBreak,
      click: () => {
        log.info("Start break now selected");
        startBreakNow();
      },
    },
    { type: "separator" },
    { label: t("tray.settings"), click: createSettingsWindow },
    { label: t("tray.about"), click: createAboutWindow },
    { label: t("tray.quit"), click: quit },
  ]);

  trayMenu = contextMenu;
  if (process.platform === "linux") {
    tray.setContextMenu(contextMenu);
  }
}

export function initTray(): void {
  buildTray();
  let lastDisableText = getDisableTimeRemaining();
  let lastTrayTitle = getTrayTitle();

  setInterval(() => {
    checkDisableTimeout();

    const currentDisableText = getDisableTimeRemaining();
    if (currentDisableText !== lastDisableText) {
      buildTray();
      lastDisableText = currentDisableText;
    }

    if (process.platform === "darwin") {
      const currentTrayTitle = getTrayTitle();
      if (currentTrayTitle !== lastTrayTitle) {
        buildTray();
        lastTrayTitle = currentTrayTitle;
      }
    }

    const breakTime = getBreakTime();
    if (breakTime === null) {
      return;
    }

    const minsLeft = breakTime.diff(moment(), "minutes");
    if (minsLeft !== lastMinsLeft) {
      buildTray();
      lastMinsLeft = minsLeft;
    }
  }, 5000);
}
