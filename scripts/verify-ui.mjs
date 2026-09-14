/**
 * Renders the built renderer in headless Chrome with a stubbed Electron
 * preload, then measures it.
 *
 * This exists because the surfaces here — a 660px settings page, a 100px-tall
 * notice slip, a full-screen break sheet — cannot be reviewed at source level,
 * and because the three defects a redesign like this hides best are all
 * invisible in a screenshot and trivial to measure: a ruler that overflows its
 * column, text that goes below the legibility floor, and a warm palette that
 * leaked a cold grey from the theme it replaced.
 *
 *   node scripts/verify-ui.mjs [--shot <dir>]
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist/renderer");
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SHOT_DIR = arg("--shot", null);
const SLOW = process.argv.includes("--slow");

/* Read straight out of the rail's own model, so this check cannot pass by
   agreeing with a copy of it. */
const NAV_SOURCE = fs.readFileSync(
  path.join(ROOT, "app/renderer/components/settings/nav.tsx"),
  "utf8",
);
/* Split on each group's `value:` rather than matching its entries block: the
   first group's entries are written across lines and the second's on one line,
   and a regex that assumes either shape silently swallows the next group. */
const NAV_GROUPS = new Map(
  NAV_SOURCE.split('value: "')
    .slice(1)
    .map((part) => [
      part.slice(0, part.indexOf('"')),
      [...part.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]),
    ]),
);
const PORT = 8791;
const CDP_PORT = 9333;

const CASES = [
  {
    id: "settings",
    query: "?page=settings",
    w: 1040,
    h: 800,
    wait: 900,
    group: "break-settings",
  },
  {
    id: "working-hours",
    group: "working-hours",
    query: "?page=settings",
    w: 1040,
    h: 800,
    wait: 900,
    click: "[data-slot=tabs-list] > button:nth-of-type(2)",
  },
  {
    id: "customization",
    group: "customization",
    query: "?page=settings",
    w: 1040,
    h: 800,
    wait: 900,
    click: "[data-slot=tabs-list] > button:nth-of-type(3)",
  },
  {
    id: "settings-125",
    query: "?page=settings",
    w: 1040,
    h: 808,
    wait: 900,
    group: "break-settings",
    scale: 1.25,
  },
  {
    id: "working-hours-150",
    query: "?page=settings",
    w: 1040,
    h: 808,
    wait: 900,
    group: "working-hours",
    scale: 1.5,
    click: "[data-slot=tabs-list] > button:nth-of-type(2)",
  },
  {
    id: "settings-windows",
    query: "?page=settings",
    w: 1040,
    h: 808,
    wait: 900,
    group: "system",
    click: "[data-slot=tabs-list] > button:nth-of-type(4)",
  },
  {
    id: "tray",
    query: "?page=tray",
    w: 340,
    h: 428,
    wait: 900,
    group: null,
  },
  {
    /* The popover in the other language: it is the surface where a longer word
       pushes a caption onto a second line. */
    id: "tray-zh",
    query: "?page=tray",
    w: 340,
    h: 428,
    wait: 900,
    zh: true,
  },
  {
    /* Outside working hours: the state where the popover once narrated a
       countdown that was not happening — cadence printed as the hero, a
       caption that said "paused", and a bar filled to full against a cycle
       that had stopped. */
    id: "tray-outside",
    query: "?page=tray",
    w: 340,
    h: 428,
    wait: 900,
    outside: true,
  },
  { id: "notice", query: "?page=break&windowId=0", w: 544, h: 100, wait: 1600 },
  {
    id: "break",
    query: "?page=break&windowId=0",
    w: 1440,
    h: 900,
    wait: 2400,
    running: true,
  },
  {
    id: "welcome",
    query: "?page=settings",
    w: 1040,
    h: 800,
    wait: 900,
    firstRun: true,
  },
  {
    id: "settings-zh",
    query: "?page=settings",
    w: 1040,
    h: 800,
    wait: 900,
    zh: true,
  },
  {
    id: "working-hours-zh",
    group: "working-hours",
    query: "?page=settings",
    w: 1040,
    h: 800,
    wait: 900,
    zh: true,
    click: "[data-slot=tabs-list] > button:nth-of-type(2)",
  },
  {
    id: "break-zh",
    query: "?page=break&windowId=0",
    w: 1440,
    h: 900,
    wait: 2400,
    running: true,
    zh: true,
  },
  {
    id: "system",
    query: "?page=settings",
    w: 1040,
    h: 800,
    wait: 900,
    group: "system",
    click: "[data-slot=tabs-list] > button:nth-of-type(4)",
  },
  {
    id: "settings-dark",
    query: "?page=settings",
    w: 1040,
    h: 800,
    wait: 900,
    dark: true,
  },
  {
    id: "working-hours-dark",
    group: "working-hours",
    query: "?page=settings",
    w: 1040,
    h: 800,
    wait: 900,
    dark: true,
    click: "[data-slot=tabs-list] > button:nth-of-type(2)",
  },
  {
    id: "break-float",
    query: "?page=break&windowId=0",
    w: 540,
    h: 420,
    wait: 2400,
    running: true,
    noVeil: true,
  },
  {
    id: "break-ultrawide",
    query: "?page=break&windowId=0",
    w: 3440,
    h: 1440,
    wait: 2400,
    running: true,
  },
];

// The countdown numeral only appears 60s into the notice, so its own case is
// opt-in rather than a minute added to every run.
if (SLOW) {
  CASES.push({
    id: "notice-countdown",
    query: "?page=break&windowId=0",
    w: 544,
    h: 100,
    wait: 63000,
  });
}

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}

function stub({ firstRun, running, noVeil, zh, outside }) {
  const s = {
    language: zh ? "zh" : "en",
    autoLaunch: true,
    breaksEnabled: true,
    trayTextEnabled: true,
    trayTextMode: "TIME_TO_NEXT_BREAK",
    notificationType: "POPUP",
    breakFrequencySeconds: 1680,
    breakLengthSeconds: 120,
    postponeLengthSeconds: 180,
    postponeLimit: 0,
    workingHoursEnabled: true,
    idleResetEnabled: true,
    idleResetLengthSeconds: 300,
    idleResetNotification: false,
    soundType: "GONG",
    breakSoundVolume: 1,
    breakTitle: "",
    breakMessage: "",
    backgroundColor: "#2a241c",
    textColor: "#e8ca8d",
    veilColor: "#33302a",
    showBackdrop: Boolean(noVeil) === false,
    backdropOpacity: 0.7,
    endBreakEnabled: true,
    skipBreakEnabled: true,
    postponeBreakEnabled: true,
    immediatelyStartBreaks: Boolean(running),
  };
  const shift = {
    enabled: true,
    ranges: [{ fromMinutes: 540, toMinutes: 1080 }],
  };
  for (const d of ["Monday", "Tuesday", "Wednesday", "Thursday"])
    s["workingHours" + d] = shift;
  s.workingHoursFriday = {
    enabled: true,
    ranges: [
      { fromMinutes: 540, toMinutes: 780 },
      { fromMinutes: 840, toMinutes: 1080 },
    ],
  };
  s.workingHoursSaturday = {
    enabled: false,
    ranges: [{ fromMinutes: 600, toMinutes: 780 }],
  };
  s.workingHoursSunday = {
    enabled: false,
    ranges: [{ fromMinutes: 600, toMinutes: 780 }],
  };
  return `window.processEnv={NODE_ENV:"production"};window.processPlatform="darwin";
const S=${JSON.stringify(s)};const noop=async()=>{};
window.ipcRenderer={invokeGetSettings:async()=>S,invokeSetSettings:noop,
invokeGetAppInitialized:async()=>${firstRun ? "false" : "true"},invokeSetAppInitialized:noop,
invokeGetAllowPostpone:async()=>true,invokeGetBreakLength:async()=>120,
invokeGetTimeSinceLastBreak:async()=>725,invokeWasStartedFromTray:async()=>false,
	invokeGetTrayStatus:async()=>({enabled:S.breaksEnabled,havingBreak:false,
inWorkingHours:${outside ? "false" : "true"},nextBreakAt:${outside ? "null" : "Date.now()+955000"},
nextWindowOpenAt:${outside ? "Date.now()+39600000" : "null"},
sinceLastBreakSeconds:725,frequencySeconds:S.breakFrequencySeconds,lengthSeconds:S.breakLengthSeconds,
todayFromMinutes:540,todayToMinutes:1080,popup:true}),
invokeStartBreakNow:noop,invokeSetBreaksEnabled:noop,invokeOpenSettingsWindow:noop,
invokeHideTrayPopover:noop,invokeResizeTrayPopover:(h)=>{window.__trayHeight=h;},
invokeBreakStart:noop,invokeBreakEnd:noop,invokeBreakPostpone:noop,invokeStartSound:noop,
invokeEndSound:noop,invokeCompleteBreakTracking:noop,invokeBreakWindowResize:noop,
onBreakStart:()=>{},onBreakEnd:()=>{},onPlayStartSound:()=>{},onPlayEndSound:()=>{}};`;
}

const AUDIT = String.raw`(() => {
  const issues = [];
  const info = {};
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;
  const parseColor = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map((x) => parseFloat(x.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const la = lum(a), lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = parseColor(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0.5) return bg;
      n = n.parentElement;
    }
    return parseColor(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none") return false;
    if (parseFloat(s.opacity) < 0.15) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const all = Array.from(document.querySelectorAll("*"));
  info.viewport = [window.innerWidth, window.innerHeight];
  info.docScroll = [document.documentElement.scrollWidth, document.documentElement.scrollHeight];

  if (document.documentElement.scrollWidth > window.innerWidth + 1) {
    issues.push("horizontal overflow: " + document.documentElement.scrollWidth + " > " + window.innerWidth);
  }

  const clipped = [];
  for (const el of all) {
    if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) {
      const s = getComputedStyle(el);
      if (s.overflowX === "visible" && s.overflowY === "visible") {
        /* The class alone does not say WHICH row overflowed; the text does.
           Named content means the next reader fixes it without a second run. */
        clipped.push(
          (el.className.toString().slice(0, 34) || el.tagName) +
            " [" +
            (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24) +
            "] " +
            el.clientWidth +
            "<" +
            el.scrollWidth,
        );
      }
    }
  }
  if (clipped.length) issues.push("clipped content x" + clipped.length + ": " + clipped.slice(0, 6).join(" | "));

  let minFont = 999;
  const tiny = [], faint = [], faces = {}, cold = [];
  for (const el of all) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (hasText) {
      const size = px(s.fontSize);
      minFont = Math.min(minFont, size);
      const label = (el.textContent || "").trim().slice(0, 26);
      if (size < 11) tiny.push(label + " @" + size + "px");
      const fg = parseColor(s.color);
      if (fg && fg.a > 0.4) {
        const r = ratio(fg, bgOf(el));
        const large = size >= 18.66 || (size >= 14 && parseInt(s.fontWeight, 10) >= 700);
        if (r < (large ? 3 : 4.5)) faint.push(label + " " + r.toFixed(2) + ":1 @" + size + "px");
      }
      const fam = s.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      faces[fam] = (faces[fam] || 0) + 1;
    }
    for (const prop of ["backgroundColor", "borderTopColor"]) {
      const c = parseColor(s[prop]);
      if (!c || c.a < 0.5) continue;
      const chroma = Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
      if (chroma < 24 && c.b > c.r + 3) {
        cold.push(prop + "=" + s[prop] + " on " + el.className.toString().slice(0, 30));
      }
    }
  }
  info.minFontSize = minFont;
  info.fontFamilies = Object.entries(faces).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (tiny.length) issues.push("text under 11px x" + tiny.length + ": " + tiny.slice(0, 5).join(" | "));
  if (faint.length) issues.push("low contrast x" + faint.length + ": " + faint.slice(0, 6).join(" | "));
  if (cold.length) issues.push("cool greys x" + cold.length + ": " + cold.slice(0, 5).join(" | "));

  /* The tray card must be its content's height. When the card was stretched to the frame
     with no auto margin, the window's leftover 72px collected below the last
     child as a visible void; a fixed window height cannot be right for two
     languages. Measured as: card minus the sum of its own children. */
  const trayCard = document.querySelector(".panel");
  if (trayCard) {
    const kids = Array.from(trayCard.children);
    const used = kids.reduce((sum, k) => {
      const cs = getComputedStyle(k);
      return (
        sum +
        k.getBoundingClientRect().height +
        parseFloat(cs.marginTop) +
        parseFloat(cs.marginBottom)
      );
    }, 0);
    const dead = Math.round(trayCard.getBoundingClientRect().height - used);
    info.trayCard = {
      card: Math.round(trayCard.getBoundingClientRect().height),
      children: Math.round(used),
      reportedWindowHeight: window.__trayHeight ?? null,
      /* The fill of each bar, so a decorative one cannot pass: these are
         positions in a cycle and must differ from each other and from 0. */
      bars: Array.from(trayCard.querySelectorAll(".bar > i")).map((el) =>
        Math.round((el.getBoundingClientRect().width /
          el.parentElement.getBoundingClientRect().width) * 100),
      ),
    };
    if (dead > 2) {
      issues.push(
        "tray card has " + dead + "px of dead space below its last child",
      );
    }
  }

  const smallTargets = [];
  const interactive = document.querySelectorAll(
    "button, [role=switch], [role=button], a[href], input:not([type=hidden]), select, textarea, [data-slot=checkbox]"
  );
  for (const el of interactive) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.height < 20 || r.width < 20) {
      smallTargets.push((el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 22) + " " + Math.round(r.width) + "x" + Math.round(r.height));
    }
  }
  info.interactive = interactive.length;
  info.hitTargets = Array.from(interactive).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.height >= 20 && r.width >= 20;
  }).length;
  if (smallTargets.length) issues.push("targets under 20px x" + smallTargets.length + ": " + smallTargets.slice(0, 6).join(" | "));

  const num = document.querySelector(".tnum");
  info.numeral = num ? {
    text: (num.textContent || "").trim().slice(0, 10),
    size: px(getComputedStyle(num).fontSize),
    variant: getComputedStyle(num).fontVariantNumeric,
  } : null;

  // Every id the rail can scroll to has to exist in the DOM. A typo here is a
  // control that silently does nothing, which is the failure mode a screenshot
  // cannot show.
  const anchors = (window.__navAnchors || []).filter((id) => id);
  info.deadAnchors = anchors.filter((id) => document.getElementById(id) === null);
  if (info.deadAnchors.length) {
    issues.push("rail anchors with no target: " + info.deadAnchors.join(", "));
  }

  // The tabs are in the titlebar and the content is below them. A stacked
  // layout is the design, so the check is the opposite of a two-column one: the
  // tab row must sit above the pane, the pane must start at the window's left
  // edge (no rail reserving a column), and the tab row must be centred in the
  // window rather than left-aligned against the brand.
  const tabsRow = document.querySelector("[data-slot=tabs-list]");
  const pane = document.getElementById("settings-scroll");
  info.columns = tabsRow && pane
    ? {
        tabsBottom: Math.round(tabsRow.getBoundingClientRect().bottom),
        tabsCentre: Math.round(
          tabsRow.getBoundingClientRect().left +
            tabsRow.getBoundingClientRect().width / 2,
        ),
        paneTop: Math.round(pane.getBoundingClientRect().top),
        paneLeft: Math.round(pane.getBoundingClientRect().left),
        paneWidth: Math.round(pane.getBoundingClientRect().width),
      }
    : null;
  if (tabsRow && pane) {
    const t = tabsRow.getBoundingClientRect();
    const p = pane.getBoundingClientRect();
    if (t.bottom > p.top + 1) {
      issues.push(
        "tab row is not above the content: tabs end at " +
          Math.round(t.bottom) +
          ", content starts at " +
          Math.round(p.top),
      );
    }
    if (p.left > 24) {
      issues.push(
        "content is inset by " +
          Math.round(p.left) +
          "px, which is a rail by another name",
      );
    }
    const centre = window.innerWidth / 2;
    const tabsCentre = t.left + t.width / 2;
    if (Math.abs(tabsCentre - centre) > 24) {
      issues.push(
        "tab row is off-centre by " +
          Math.round(Math.abs(tabsCentre - centre)) +
          "px",
      );
    }
    if (p.width < 600) {
      issues.push("content column is too narrow: " + Math.round(p.width));
    }
  }

  // The rendered type scale, deduped by size. The reference spans 96 -> 14 and
  // the span is most of what makes it look set; a build whose scale runs 23 -> 11
  // has no scale at all, and that is invisible in any single screenshot.
  const scale = new Map();
  for (const el of all) {
    if (visible(el) === false) continue;
    const hasText = Array.from(el.childNodes).some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 1,
    );
    if (hasText === false) continue;
    const cs = getComputedStyle(el);
    const size = px(cs.fontSize);
    const face = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
    const key = size + "|" + face;
    if (scale.has(key)) continue;
    scale.set(key, {
      size,
      face,
      weight: cs.fontWeight,
      ls: px(cs.letterSpacing),
      text: (el.textContent || "").trim().slice(0, 24),
    });
  }
  info.typeScale = [...scale.values()].sort((a, b) => b.size - a.size).slice(0, 14);

  info.surface = {
    tabs: document.querySelectorAll("[data-slot=tabs-trigger]").length,
    switches: document.querySelectorAll("[data-slot=switch]").length,
    sheetButton: Boolean(document.querySelector(".sheet-button")),
    dialog: Boolean(document.querySelector("[data-slot=dialog-content]")),
    breaks: document.querySelectorAll("[role=button][aria-label*=shift]").length,
    heading: (document.querySelector("h1, h3") || {}).textContent,
  };
  info.bodyBg = getComputedStyle(document.body).backgroundColor;

  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
  };
  let biggest = null, biggestSize = 0;
  for (const el of all) {
    if (!visible(el)) continue;
    const t = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!t) continue;
    const size = px(getComputedStyle(el).fontSize);
    if (size > biggestSize) { biggestSize = size; biggest = el; }
  }
  info.geometry = {
    tabsList: box(document.querySelector("[data-slot=tabs-list]")),
    navPill: box(document.querySelector("header")),
    firstSection: box(document.querySelector("section")),
    sheet: box(document.querySelector(".sheet-button")?.closest("div[style*=background]")),
    progressRule: box(document.querySelector("[role=progressbar]")),
    biggestText: biggest ? { text: (biggest.textContent || "").trim().slice(0, 14), size: biggestSize, box: box(biggest) } : null,
    bands: Array.from(document.querySelectorAll('[role=button]'))
      .filter((el) => (el.getAttribute("aria-label") || "").includes("shift"))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return (el.getAttribute("aria-label") || "").split(",")[0] + " x" + Math.round(r.left) + " w" + Math.round(r.width);
      }),
    nowMarker: (() => {
      const el = document.querySelector('[class*="bg-destructive"]');
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, w: Math.round(el.getBoundingClientRect().width), visible: visible(el) };
    })(),
    buttons: Array.from(document.querySelectorAll("button"))
      .filter((el) => visible(el))
      .map((el) => ((el.textContent || "").trim().slice(0, 14) || "icon") + " " + box(el).slice(2).join("x")),
  };
  return { issues, info };
})();
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

function mime(file) {
  const map = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".woff2": "font/woff2",
    ".wav": "audio/wav",
    ".png": "image/png",
  };
  return map[path.extname(file)] || "application/octet-stream";
}

async function waitForTarget() {
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page;
    } catch {
      /* chrome is still starting */
    }
    await sleep(250);
  }
  throw new Error("headless Chrome never exposed a debugging target");
}

async function main() {
  const entry = path.join(DIST, "index.html");
  if (!fs.existsSync(entry))
    throw new Error(
      "dist/renderer/index.html missing — run npm run build-renderer",
    );
  if (SHOT_DIR) fs.mkdirSync(SHOT_DIR, { recursive: true });

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const file = path.join(
      DIST,
      decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname),
    );
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "Content-Type": mime(file) });
      res.end(data);
    });
  });
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

  const profile = fs.mkdtempSync("/tmp/bt-verify-");
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${CDP_PORT}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const target = await waitForTarget();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    const resolve = pending.get(msg.id);
    if (resolve) {
      pending.delete(msg.id);
      resolve(msg);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");

  const report = {};
  for (const test of CASES) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: test.w,
      height: test.h,
      deviceScaleFactor: test.scale ?? 1,
      mobile: false,
    });
    await send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-color-scheme", value: test.dark ? "dark" : "light" },
      ],
    });
    const { result: injected } = await send(
      "Page.addScriptToEvaluateOnNewDocument",
      {
        source:
          stub(test) +
          `window.__navAnchors = ${JSON.stringify(NAV_GROUPS.get(test.group) ?? [])};`,
      },
    );
    await send("Page.navigate", {
      url: `http://127.0.0.1:${PORT}/index.html${test.query}`,
    });
    await sleep(test.wait);

    if (test.click) {
      await send("Runtime.evaluate", {
        expression: `(() => {
          const el = document.querySelector(${JSON.stringify(test.click)});
          if (!el) return false;
          const r = el.getBoundingClientRect();
          const o = { bubbles: true, cancelable: true, button: 0,
            clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
          el.dispatchEvent(new PointerEvent("pointerdown", o));
          el.dispatchEvent(new MouseEvent("mousedown", o));
          el.dispatchEvent(new PointerEvent("pointerup", o));
          el.dispatchEvent(new MouseEvent("mouseup", o));
          el.focus();
          return true;
        })()`,
      });
      await sleep(450);
    }

    const evaluated = await send("Runtime.evaluate", {
      expression: AUDIT,
      returnByValue: true,
    });
    const value = evaluated?.result?.result?.value ?? {
      /* The audit is one big expression; when it throws, CDP returns the
         exception instead of a value, and "audit did not run" hid the reason.
         Print it. */
      issues: [
        "audit did not run: " +
          JSON.stringify(
            evaluated?.result?.exceptionDetails?.exception?.description ??
              evaluated?.result?.exceptionDetails ??
              evaluated,
          ).slice(0, 300),
      ],
      info: {},
    };
    value.viewport = `${test.w}x${test.h}`;
    report[test.id] = value;

    if (SHOT_DIR) {
      const shot = await send("Page.captureScreenshot", { format: "png" });
      if (shot?.result?.data) {
        fs.writeFileSync(
          path.join(SHOT_DIR, `${slug(test.id)}.png`),
          Buffer.from(shot.result.data, "base64"),
        );
      }
    }
    await send("Page.removeScriptToEvaluateOnNewDocument", {
      identifier: injected.identifier,
    });
  }

  ws.close();
  chrome.kill();
  server.close();

  console.log(JSON.stringify(report, null, 2));
  const total = Object.values(report).reduce(
    (n, r) => n + (r.issues?.length ?? 0),
    0,
  );
  console.log(
    total === 0
      ? `\nPASS — 0 issues across ${Object.keys(report).length} surfaces`
      : `\n${total} issue(s) found`,
  );
  process.exit(total === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
