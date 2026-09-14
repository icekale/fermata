/**
 * This preload script is run when browser windows are created and allows us to
 * safely expose node/electron APIs to the renderer process.
 *
 * See https://www.electronjs.org/docs/tutorial/context-isolation for more
 * information.
 */

const { contextBridge, ipcRenderer } = require("electron");

process.once("loaded", () => {
  /* Only the one flag the renderer reads. Spreading the whole process.env
     over the bridge handed every environment secret to every window. */
  contextBridge.exposeInMainWorld("processEnv", { SNAP: process.env.SNAP });
  contextBridge.exposeInMainWorld("processPlatform", process.platform);
  contextBridge.exposeInMainWorld("ipcRenderer", {
    invokeBreakPostpone: (action) => {
      return ipcRenderer.invoke("BREAK_POSTPONE", action);
    },
    invokeGetAllowPostpone: () => {
      return ipcRenderer.invoke("ALLOW_POSTPONE_GET");
    },
    invokeGetBreakLength: () => {
      return ipcRenderer.invoke("BREAK_LENGTH_GET");
    },
    invokeGetSettings: () => {
      return ipcRenderer.invoke("SETTINGS_GET");
    },
    invokeEndSound: (type, volume = 1) => {
      return ipcRenderer.invoke("SOUND_END_PLAY", type, volume);
    },
    invokeStartSound: (type, volume = 1) => {
      return ipcRenderer.invoke("SOUND_START_PLAY", type, volume);
    },
    invokeSetSettings: (settings) => {
      return ipcRenderer.invoke("SETTINGS_SET", settings);
    },
    invokeBreakWindowResize: () => {
      return ipcRenderer.invoke("BREAK_WINDOW_RESIZE");
    },
    invokeGetTimeSinceLastBreak: () => {
      return ipcRenderer.invoke("TIME_SINCE_LAST_BREAK_GET");
    },
    invokeCompleteBreakTracking: (breakDurationMs) => {
      return ipcRenderer.invoke("BREAK_TRACKING_COMPLETE", breakDurationMs);
    },
    invokeWasStartedFromTray: () => {
      return ipcRenderer.invoke("WAS_STARTED_FROM_TRAY_GET");
    },
    invokeGetAppInitialized: () => {
      return ipcRenderer.invoke("APP_INITIALIZED_GET");
    },
    invokeSetAppInitialized: () => {
      return ipcRenderer.invoke("APP_INITIALIZED_SET");
    },
    invokeBreakStart: () => {
      return ipcRenderer.invoke("BREAK_START");
    },
    invokeBreakEnd: () => {
      return ipcRenderer.invoke("BREAK_END");
    },
    invokeGetTrayStatus: () => {
      return ipcRenderer.invoke("TRAY_STATUS_GET");
    },
    invokeStartBreakNow: () => {
      return ipcRenderer.invoke("BREAK_START_NOW");
    },
    invokeSetBreaksEnabled: (enabled) => {
      return ipcRenderer.invoke("BREAKS_ENABLED_SET", enabled);
    },
    invokeOpenSettingsWindow: () => {
      return ipcRenderer.invoke("SETTINGS_WINDOW_OPEN");
    },
    invokeHideTrayPopover: () => {
      return ipcRenderer.invoke("TRAY_POPOVER_HIDE");
    },
    invokeResizeTrayPopover: (height) => {
      return ipcRenderer.invoke("TRAY_POPOVER_RESIZE", height);
    },
    onPlayStartSound: (cb) => {
      ipcRenderer.on("SOUND_START_PLAY", (_event, type, volume = 1) => {
        cb(type, volume);
      });
    },
    onPlayEndSound: (cb) => {
      ipcRenderer.on("SOUND_END_PLAY", (_event, type, volume = 1) => {
        cb(type, volume);
      });
    },
    onBreakStart: (cb) => {
      ipcRenderer.on("BREAK_START", (_event, breakEndTime) => {
        cb(breakEndTime);
      });
    },
    onBreakEnd: (cb) => {
      ipcRenderer.on("BREAK_END", () => {
        cb();
      });
    },
  });
});
