import { app, shell } from "electron";
import electronDebug from "electron-debug";
import log from "electron-log";
import { autoUpdater } from "electron-updater";
import { setAutoLauch } from "./lib/auto-launch";
import { initBreaks } from "./lib/breaks";
import "./lib/ipc";
import { showNotification } from "./lib/notifications";
import { getAppInitialized } from "./lib/store";
import { t } from "./lib/l10n";
import { initTray } from "./lib/tray";
import { createSettingsWindow, createSoundsWindow } from "./lib/windows";

const gotTheLock = app.requestSingleInstanceLock();

app.on("second-instance", (event, commandLine, workingDirectory) => {
  log.info("Second instance detected, opening settings window");
  log.info(`Command line: ${commandLine}`);
  log.info(`Working directory: ${workingDirectory}`);
  createSettingsWindow();
});

app.on("activate", () => {
  log.info("App activated, opening settings window");
  createSettingsWindow();
});

if (!gotTheLock) {
  log.info("App already running");
  app.exit();
}

/* ---------------------------------------------------------------------------
   Update source.

   A rename forks the identity, and the auto-updater is where that bites: this
   build inherited upstream's GitHub release feed, so the first time it checked,
   electron-updater would have replaced Fermata with BreakTimer. It was checked
   against a feed that is not this app's.

   There is no Fermata release feed yet, so updates are OFF. Set RELEASE_REPO to
   your own "owner/repo" once you publish, and set the same value under
   build.publish in package.json, and both the silent updater and the manual
   Windows/Linux download link come back on.
   ------------------------------------------------------------------------ */
const RELEASE_REPO: string | null = null;

function releaseUrl(asset: string | null): string {
  const base = `https://github.com/${RELEASE_REPO}/releases/latest`;
  return asset ? `${base}/download/${asset}` : base;
}

function updatesEnabled(): boolean {
  return RELEASE_REPO !== null;
}

function getDownloadUrl(): string {
  switch (process.platform) {
    case "win32":
      return releaseUrl("Fermata.exe");
    case "linux":
      return releaseUrl(null);
    default:
      throw new Error("Download URL should not be called for macOS");
  }
}

function shouldAutoInstall(): boolean {
  const isMac = process.platform === "darwin";
  const isLinux = process.platform === "linux";

  return isMac || isLinux;
}

function checkForUpdates(): void {
  if (updatesEnabled() === false) {
    log.info("Updates disabled: no release feed is configured for this build");
    return;
  }

  log.info("Checking for updates...");
  autoUpdater.logger = log;

  autoUpdater.on("error", (error) => {
    log.error(`Auto updater error: ${error}`);
  });

  if (shouldAutoInstall()) {
    autoUpdater.checkForUpdatesAndNotify().catch((error) => {
      log.error(`Unable to run auto updater: ${error}`);
    });
  } else {
    autoUpdater.autoDownload = false;

    autoUpdater.on("update-available", (info) => {
      log.info("Update available:", info);

      const downloadUrl = getDownloadUrl();

      showNotification(
        t("notif.updateTitle"),
        t("notif.updateBody"),
        () => {
          shell.openExternal(downloadUrl).catch((error) => {
            log.error(`Failed to open download URL: ${error}`);
          });
        },
        false,
      );
    });

    autoUpdater.checkForUpdates().catch((error) => {
      log.error(`Unable to check for updates: ${error}`);
    });
  }
}

if (process.env.NODE_ENV === "production") {
  const sourceMapSupport = require("source-map-support");
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === "development" ||
  process.env.DEBUG_PROD === "true"
) {
  electronDebug();
}

// function installExtensions() {
//   const installer = require('electron-devtools-installer')
//   const forceDownload = !!process.env.UPGRADE_EXTENSIONS
//   const extensions = ['REACT_DEVELOPER_TOOLS']
//
//   return Promise.all(
//     extensions.map(name => installer.default(installer[name], forceDownload))
//   ).catch(console.log)
// }

// Don't exit on close all windows - live in tray
app.on("window-all-closed", () => {
  // Pass
});

app.on("ready", async () => {
  if (
    process.env.NODE_ENV === "development" ||
    process.env.DEBUG_PROD === "true"
  ) {
    // Extensions are broken on electron 10
    // await installExtensions()
  }

  // Required for notifications to work on windows
  if (process.platform === "win32") {
    app.setAppUserModelId("app.fermata.timer");
  }

  if (process.platform === "darwin") {
    app.dock?.hide();
  }

  const appInitialized = getAppInitialized();

  if (!appInitialized) {
    if (process.env.NODE_ENV !== "development") {
      setAutoLauch(true);
    }
    // Show settings window on first launch instead of notification
    createSettingsWindow();
    // Don't set app as initialized yet - we'll do that after the user dismisses the modal
  } else {
    // App has been initialized before, don't show settings automatically
  }

  initBreaks();
  initTray();
  createSoundsWindow();

  if (process.env.NODE_ENV !== "development") {
    checkForUpdates();
  }
});
