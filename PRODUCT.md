# Product

<!-- impeccable:product-schema 1 -->

## Platform

web — rendered by Electron and shipped as a native desktop app for macOS,
Windows and Linux. There is no browser build and no mobile surface.

## Languages

English and Simplified Chinese, complete in both. The setting is
`system | en | zh` and defaults to `system`, resolved from the OS tag
independently by the renderer (`navigator.language`) and the main process
(`app.getLocale()`) so the window and the tray menu cannot disagree. The
translation covers every renderer string, the tray menu, and the OS
notifications; Chinese also changes how the text is SET (leading, label floor,
line balancing) rather than only what it says.

## Stack

Electron 43 + React 19 + TypeScript, Vite for the renderer and webpack for the
main process, Tailwind v4 with shadcn/ui components styled by CSS variables,
framer-motion for transitions, electron-store for settings. Inherited from
upstream BreakTimer; unchanged by this redesign.

## Users

One person at one desk, working, who has decided in advance that they want to be
interrupted. They are not looking at the app: they are looking at their work.
The app does its job at the edge of their attention — a slip arrives, they take
a break, they go back. The settings window is opened rarely, and usually while
something else is on their mind.

That context is the whole design constraint. A break reminder competes with the
work it is interrupting, so the surfaces that appear unasked (notice, break
sheet) must be legible in one glance and dismissible in one click, and the
surface that is asked for (settings) must be scannable rather than browsable.

## Product Purpose

Manage and enforce periodic breaks: decide how often a break arrives, how long
it lasts, when in the week breaks are allowed, what the break screen says, how
it sounds, and how much the desktop is still allowed to compete for attention
while it runs.

Success is a break that is taken — not one that is configured well, and not one
that is admired. One that a person who is in the middle of something actually
stands up for.

## Positioning

BreakTimer is the break timer that puts the countdown first. The remaining time
is the largest thing on the break screen, the notice carries it as a numeral
rather than burying it in a sentence, and the week's coverage is drawn as a
ledger instead of assembled from fourteen time fields.

## Operating Context

- Three desktop platforms — macOS, Windows and Linux — are all first-class. The
  release workflow builds all three; nothing may be added that only works on one.
- The app runs in the tray / menu bar; closing the settings window does not quit.
- On first launch it opens the settings window once, then hides in the tray.
- A break fires on a timer. Depending on notification type it is either an OS
  notification or an always-on-top window on every connected display.
- The break window appears on **every** connected display at once, sharing one
  break timeline. Each is frameless, transparent, non-focusable, and shown
  inactive so it never steals focus.
- The break window resizes itself at runtime: full screen when the veil is on, a
  small centred card when it is off.
- Working hours gate breaks to a weekly schedule with one or more ranges per
  day, so a split shift (morning and afternoon) is a normal configuration.
- Smart Breaks detects idle time and treats it as a break already taken.
- Settings changes are staged in a draft and committed with an explicit Save.
- The break sheet's colours are user-chosen hex values stored in settings.

## Capabilities and Constraints

Confirmed functionality that future work must preserve:

- breaks on/off, frequency, length, popup vs. simple notification
- editable break title and multi-line message
- snooze (length plus an optional limit) and skip, each independently enabled
- working hours per weekday, several ranges per day, copy one shift to other days
- Smart Breaks: idle threshold and an optional detection notification
- end a break early, with the label changing from "Cancel" to "End" partway
- sound choice and volume, with preview
- veil on/off and strength
- start at login
- menu bar text: time to next break, or time since last break
- language: English or Simplified Chinese, or follow the system
- break window on all displays against a synchronised timeline

Technical constraints:

- The renderer reaches the main process only through a fixed preload bridge
  (`ipcRenderer.invoke*`). A setting that needs a new main-process value means
  touching the preload, the IPC channel enum, `app/main/lib/ipc.ts` and
  `app/types/ipc.ts`. Four files, so it is a real cost.
- The main process owns the schedule; the renderer never decides when a break
  starts.
- New settings fields need no migration: `getSettings()` merges stored values
  over `defaultSettings`, so a new field with a default is filled in for
  existing installs automatically.

## Brand Commitments

- Name: **Fermata**. Renamed from BreakTimer by the owner. A fermata is the
  notation for "hold this note longer than written, then continue"; the mark is
  an arch over a dot, which reads as a clock as well.
- The upstream name, repository and authorship are credited in the README and
  here, and that credit is a licence term, not a courtesy.
- Upstream: `tom-james-watson/breaktimer-app`, GPL-3.0-or-later. This is a
  derivative work and keeps the licence, the copyright notices and the upstream
  README's attribution. Any redistribution stays GPL-3.0-or-later.
- Visual reference named by the owner: **mole.fit** and the Tang / kami / luo
  token set behind it. Recorded because it was volunteered as binding, not
  because it belongs in a product record.

## Evidence on Hand

None. There is no usage data, no testimonials, no benchmarks and no analytics.
Nothing in this project may invent any: the app has no telemetry, and must not
gain any in the name of proof.

## Product Principles

1. **The countdown is the content.** Any surface showing remaining time makes it
   the largest thing on that surface. If it is not the largest thing, the layout
   is wrong.
2. **Earned attention only.** A surface that appears unasked must be readable in
   one glance and dismissible in one click, and may not animate for longer than
   it takes to read.
3. **Legibility outranks taste.** Where the palette and readability conflict,
   readability wins — including against the user's own colour choice, which is
   why a custom sheet warns instead of quietly shipping unreadable text.
4. **The week is one picture.** Schedule questions are answered by drawing the
   week once, not by making the reader reconstruct it from fields.
5. **Nothing leaves the machine.** No telemetry, no accounts, no renderer-side
   network calls.

## Accessibility & Inclusion

- Text has an 11px floor. Nothing smaller, ever.
- Interactive targets are at least 20×20 CSS px; the design aims for 24.
- Every control is keyboard reachable and operable; focus rings are restyled,
  never removed.
- `prefers-reduced-motion: reduce` disables animation and transitions.
- The break sheet inherits user-chosen colours, so contrast is measured and
  surfaced: the WCAG ratio is shown, and below 4.5:1 the app says so.
- The app follows the OS light/dark preference. The dark theme is the same warm
  palette inverted, not a second palette.
- Layout is checked at 100%, 125% and 150% device pixel ratios, because
  fractional scaling is where 1px rules and grid columns go wrong, and it is the
  common case on Windows.
