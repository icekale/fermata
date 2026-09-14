/* Electron's preload defines window.ipcRenderer; under Tauri this adapter
   provides the same surface from Tauri commands, so the React renderer runs
   unchanged in both. Loaded first in index.html; a no-op when the Electron
   preload already ran. Phase-1 gaps are explicit: sounds are silent (the
   start/end sound calls resolve without playing) until audio is ported. */
(function () {
  if (window.ipcRenderer || typeof window.__TAURI__ === "undefined") return;

  const invoke = window.__TAURI__.core.invoke;
  const listen = window.__TAURI__.event.listen;

  window.processEnv = { SNAP: undefined };
  const platform = navigator.platform || "";
  window.processPlatform = platform.includes("Mac")
    ? "darwin"
    : platform.includes("Win")
      ? "win32"
      : "linux";

  const noop = async () => {};

  window.ipcRenderer = {
    invokeGetSettings: () => invoke("get_settings"),
    invokeSetSettings: (settings) => invoke("set_settings", { settings }),
    invokeGetAppInitialized: () => invoke("get_app_initialized"),
    invokeSetAppInitialized: () => invoke("set_app_initialized"),
    invokeGetTrayStatus: () => invoke("get_tray_status"),
    invokeGetBreakLength: () => invoke("get_break_length"),
    invokeGetAllowPostpone: () => invoke("get_allow_postpone"),
    invokeGetTimeSinceLastBreak: () => invoke("get_time_since_last_break"),
    invokeWasStartedFromTray: () => invoke("was_started_from_tray"),
    invokeStartBreakNow: () => invoke("start_break_now"),
    invokeSetBreaksEnabled: (enabled) => invoke("set_breaks_enabled", { enabled }),
    invokeOpenSettingsWindow: () => invoke("open_settings_window"),
    invokeHideTrayPopover: () => invoke("hide_tray_popover"),
    invokeResizeTrayPopover: (height) => invoke("resize_tray_popover", { height }),
    invokeBreakStart: () => invoke("break_start"),
    invokeBreakEnd: () => invoke("break_end"),
    invokeBreakPostpone: (action) => invoke("break_postpone", { action }),
    invokeBreakWindowResize: () => invoke("break_window_resize"),
    invokeCompleteBreakTracking: (ms) => invoke("complete_break_tracking", { ms }),
    /* Phase 2: audio. Resolving silently is a documented gap, not behaviour. */
    invokeStartSound: noop,
    invokeEndSound: noop,

    onBreakStart: (cb) => listen("BREAK_START", (event) => cb(event.payload)),
    onBreakEnd: (cb) => listen("BREAK_END", () => cb()),
    onPlayStartSound: noop,
    onPlayEndSound: noop,

    /* Break windows close themselves after the closing animation; under
       Tauri that means "hide the window", via the app's own command. */
    window_close_to_hide: true,
  };

  const nativeClose = window.close.bind(window);
  window.close = () => {
    try {
      invoke("close_current_window");
    } catch {
      nativeClose();
    }
  };
})();
