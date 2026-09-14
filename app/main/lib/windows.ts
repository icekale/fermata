import { app, BrowserWindow, screen, Tray } from "electron";
import log from "electron-log";
import path from "path";
import { endPopupBreak } from "./breaks";
import { getSettings } from "./store";

let settingsWindow: BrowserWindow | null = null;
let soundsWindow: BrowserWindow | null = null;
let trayPopover: BrowserWindow | null = null;
let breakWindows: BrowserWindow[] = [];

const getBrowserWindowUrl = (
  page: "settings" | "sounds" | "break" | "tray",
  windowId?: number,
): string => {
  const windowParam = windowId !== undefined ? `&windowId=${windowId}` : "";
  if (process.env.NODE_ENV === "development") {
    return `http://localhost:1212/?page=${page}${windowParam}`;
  } else {
    return `file://${path.join(
      __dirname,
      "../../../dist/renderer/index.html",
    )}?page=${page}${windowParam}`;
  }
};

export function getWindows(): BrowserWindow[] {
  const windows = [];
  if (settingsWindow !== null) {
    windows.push(settingsWindow);
  }
  if (soundsWindow !== null) {
    windows.push(soundsWindow);
  }
  if (trayPopover !== null) {
    windows.push(trayPopover);
  }
  windows.push(...breakWindows);
  return windows;
}

export function createSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.show();
    return;
  }

  settingsWindow = new BrowserWindow({
    title: "Fermata — Settings",
    show: false,
    /* The settings window is a document, not a dialog.

       It is two columns now: a contents rail down the left and the section
       being read on the right. That is what the width is for — widening a
       single-column form would only have made a wider form. The content column
       lands at 752px, which takes the week ledger's 24-hour scale from 512px to
       620px, three extra drag steps across a working day, and gives the
       two-column field rows room to breathe.

       920 is the floor at which the rail and a 520px content column still fit;
       below that the forms start wrapping rather than reflowing. */
    width: 1040,
    minWidth: 920,
    height: 800 + (process.platform === "win32" ? 40 : 0),
    minHeight: 680 + (process.platform === "win32" ? 40 : 0),
    autoHideMenuBar: true,
    /* The panel token from index.css (--earth). The native chrome and the
       rendered panel are one material; two near-identical browns here is how
       the "two names for one colour" drift starts. */
    backgroundColor: "#231816",
    ...(process.platform === "darwin"
      ? {
          titleBarStyle: "hiddenInset" as const,
          trafficLightPosition: { x: 16, y: 14 },
        }
      : process.platform === "win32"
        ? {
            titleBarStyle: "hidden" as const,
            titleBarOverlay: {
              color: "#231816",
              symbolColor: "#e8dcc8",
              height: 44,
            },
          }
        : {}),
    icon:
      process.platform === "win32"
        ? process.env.NODE_ENV === "development"
          ? path.join(__dirname, "../../../resources/icon.ico")
          : path.join(process.resourcesPath, "app/resources/icon.ico")
        : process.env.NODE_ENV === "development"
          ? path.join(__dirname, "../../../resources/tray/icon.png")
          : path.join(process.resourcesPath, "app/resources/tray/icon.png"),
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, "../../renderer/preload.js"),
    },
  });

  settingsWindow.loadURL(getBrowserWindowUrl("settings"));

  // Force enable devtools keyboard shortcuts
  settingsWindow.webContents.on("before-input-event", (event, input) => {
    if (
      input.key === "F12" ||
      (input.control && input.shift && input.key === "I")
    ) {
      settingsWindow?.webContents.toggleDevTools();
    }
  });

  settingsWindow.on("ready-to-show", () => {
    if (!settingsWindow) {
      throw new Error('"settingsWindow" is not defined');
    }
    settingsWindow.show();
    settingsWindow.focus();
  });

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

export function createSoundsWindow(): void {
  soundsWindow = new BrowserWindow({
    show: false,
    skipTaskbar: true,
    webPreferences: {
      devTools: false,
      preload: path.join(__dirname, "../../renderer/preload.js"),
    },
  });

  soundsWindow.loadURL(getBrowserWindowUrl("sounds"));
}

export function createBreakWindows(): void {
  const settings = getSettings();

  let buttonCount = 1;
  if (settings.postponeBreakEnabled) buttonCount++;
  if (settings.skipBreakEnabled) buttonCount++;

  /* Wide enough for three actions beside the countdown, and tall enough for
     the slip to carry a label, a numeral and its own progress rule. */
  const notificationWidth = 496 + (buttonCount - 1) * 48;

  const displays = screen.getAllDisplays();
  for (let windowIndex = 0; windowIndex < displays.length; windowIndex++) {
    const display = displays[windowIndex];
    const notificationHeight = 100;
    const breakWindow = new BrowserWindow({
      show: false,
      autoHideMenuBar: true,
      frame: false,
      x: display.bounds.x + display.bounds.width / 2 - notificationWidth / 2,
      y: display.bounds.y + 50,
      width: notificationWidth,
      height: notificationHeight,
      resizable: false,
      focusable: false,
      transparent: true,
      hasShadow: false,
      webPreferences: {
        devTools: true,
        preload: path.join(__dirname, "../../renderer/preload.js"),
      },
    });

    breakWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    breakWindow.setAlwaysOnTop(true);
    breakWindow.setFullScreenable(false);
    breakWindow.moveTop();

    if (process.platform === "darwin") {
      // setVisibleOnAllWorkspaces seems to have a bug that causes the dock to
      // unhide when called.
      app.dock?.hide();
    }

    breakWindow.loadURL(getBrowserWindowUrl("break", windowIndex));

    breakWindow.on("ready-to-show", () => {
      if (!breakWindow) {
        throw new Error('"breakWindow" is not defined');
      }

      // Show as inactive to avoid stealing focus
      breakWindow.showInactive();
    });

    breakWindow.on("closed", () => {
      if (process.platform === "darwin") {
        // Ensure that focus is returned to the previous app when break windows
        // close.
        app.hide();
      }

      for (const win of breakWindows) {
        if (!win.isDestroyed()) {
          try {
            win.close();
          } catch (err) {
            log.warn(err);
          }
        }
      }
      breakWindows = [];
      endPopupBreak();
    });

    breakWindows.push(breakWindow);
  }
}

export function closeBreakWindows(): void {
  const firstWin = breakWindows[0];
  if (!firstWin) return;
  if (!firstWin.closable) return;

  // The window's `.close` cleanup function will do everything else we need
  firstWin.close();
}

const TRAY_POPOVER_WIDTH = 340;
/* Default and floor only. `resizeTrayPopover` takes the real height from the
   renderer as soon as it has laid out, which happens long before the first
   click, so the popover opens already correct. */
const TRAY_POPOVER_HEIGHT = 356;
let ignorePopoverBlurUntil = 0;

function positionTrayPopover(win: BrowserWindow, tray: Tray): void {
  const tb = tray.getBounds();
  const cursor = screen.getCursorScreenPoint();
  const anchor =
    tb.width || tb.height
      ? tb
      : { x: cursor.x, y: cursor.y, width: 0, height: 0 };
  const display = screen.getDisplayNearestPoint({
    x: anchor.x,
    y: anchor.y,
  });
  /* The height is whatever the renderer measured, not the default: a Windows
     taskbar tray anchors the popover by its BOTTOM edge, and a stale constant
     there drops the card behind the taskbar. */
  const height = win.getBounds().height;
  const x = Math.round(anchor.x + anchor.width / 2 - TRAY_POPOVER_WIDTH / 2);
  const trayOnBottom = anchor.y > display.bounds.y + display.bounds.height / 2;
  const y =
    process.platform === "darwin" || trayOnBottom === false
      ? Math.round(anchor.y + Math.max(anchor.height, 16) + 6)
      : Math.round(anchor.y - height - 6);
  const area = display.workArea;
  win.setPosition(
    Math.max(
      area.x + 8,
      Math.min(x, area.x + area.width - TRAY_POPOVER_WIDTH - 8),
    ),
    Math.max(area.y + 8, Math.min(y, area.y + area.height - height - 8)),
    false,
  );
}

function createTrayPopover(): BrowserWindow {
  const transparent = process.platform === "darwin";
  trayPopover = new BrowserWindow({
    width: TRAY_POPOVER_WIDTH,
    height: TRAY_POPOVER_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    /* The shadow is the OS's, drawn outside the window and shaped by the
       content alpha. Clipping our own shadow to these bounds is what produced a
     square dark frame around a round card. */
    hasShadow: true,
    roundedCorners: false,
    transparent,
    backgroundColor: transparent ? "#00000000" : "#231816",
    webPreferences: {
      preload: path.join(__dirname, "../../renderer/preload.js"),
    },
  });
  trayPopover.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  trayPopover.loadURL(getBrowserWindowUrl("tray"));
  trayPopover.on("blur", () => {
    if (Date.now() < ignorePopoverBlurUntil) return;
    hideTrayPopover();
  });
  trayPopover.on("closed", () => {
    trayPopover = null;
  });
  return trayPopover;
}

/* Built at launch so the first click opens at the measured size instead of
   resizing in front of the reader. Hidden; it costs one renderer, the same as
   the sounds window this app already keeps warm. */
export function initTrayPopover(): void {
  if (trayPopover === null || trayPopover.isDestroyed()) {
    createTrayPopover();
  }
}

export function hideTrayPopover(): void {
  if (trayPopover && trayPopover.isDestroyed() === false) {
    trayPopover.hide();
  }
}

export function toggleTrayPopover(tray: Tray): void {
  ignorePopoverBlurUntil = Date.now() + 250;
  if (
    trayPopover &&
    trayPopover.isDestroyed() === false &&
    trayPopover.isVisible()
  ) {
    hideTrayPopover();
    return;
  }
  const win =
    trayPopover && trayPopover.isDestroyed() === false
      ? trayPopover
      : createTrayPopover();
  positionTrayPopover(win, tray);
  win.show();
  win.focus();
}

/* The popover is sized to its content, not to a constant.

   A fixed height cannot be right for two languages and a duration that grows
   from "2m" to "1h 28m": the first version left ~70px of dead space under the
   Settings link, and would have clipped instead of padded in the other locale.
   The renderer measures, the window follows, and the 8px transparent ring stays
   constant so the shadow geometry does not change as the card grows. */
export function resizeTrayPopover(height: number): void {
  if (trayPopover === null || trayPopover.isDestroyed()) return;

  const bounds = trayPopover.getBounds();
  const display = screen.getDisplayNearestPoint({
    x: bounds.x,
    y: bounds.y,
  });
  const area = display.workArea;
  const wanted = Math.round(height);
  const roomBelow = area.y + area.height - bounds.y - 8;
  const next = Math.max(180, Math.min(wanted, Math.min(720, roomBelow)));
  if (next === bounds.height) return;

  trayPopover.setBounds(
    { x: bounds.x, y: bounds.y, width: bounds.width, height: next },
    false,
  );
}
