# Design

Fermata's visual world: **Mole Earth**.

Taken from the Mole Mac app (the installed software, not the mole.fit marketing
site). The site is parchment and serif; the app is a dark warm dashboard:
earth-brown chrome, gold numerals, titlebar text tabs, dense metric tiles.

## Thesis

A break timer should look like a status board on the desk, not a form and not a
brochure. Mole's 状态 page is the pattern: a health column, a grid of big
numbers, a table of the rest.

## Rules

1. **Warm earth, never cool grey.** Panel `--earth` `#2e281c`, a tile is a wash
   of ivory on it, values are `--ink-hi` `#f4f2ec`, the accent is `--gold`
   `#e8ca8d`. Apple grey and parchment-as-page are both wrong.
2. **Tabs live in the titlebar.** Four short labels, centered; the active tab
   is an ivory pill with earth text — Mole's own nav pattern — inactive tabs
   are muted brown. No capsule track behind the whole row, no sidebar.
3. **Numbers are the content.** Cadence, length and type are tiles with a large
   numeral. Helper essays stay out of the first viewport.
4. **System sans.** SF Pro / Segoe UI / PingFang / 微软雅黑. The app is a tool;
   the website's Charter face stays on the website.
5. **Windows is first-class.** Same earth chrome, `titleBarOverlay` caption
   buttons, Segoe UI, 7–8px warm scrollbar. No vibrancy that only works on Mac.
6. **One vocabulary.** The window and the popover read the same tokens and the
   same classes; a control that means the same thing on both is the same
   component. Two names for one colour is how the surfaces drifted apart.

## One vocabulary, two surfaces

The window and the popover are the same material at two sizes, so they read the
same variables and the same classes: `.panel` is the material, `.tile` is a card
on it, `.tile-label` / `.tile-value` / `.tile-caption` are the three ranks of
text on a card, and `.bar` is a position in a cycle.

Tile legends speak Mole's dialect: labels are tracked uppercase with a drawn
icon, a state that is true right now rides the legend row as a tinted `.chip`
(the next break's time, the break's mode, the last break's clock), and
durations read number-first — big figures, small unit suffixes — never a flat
string.

That rule exists because the failure is invisible in isolation. The app once
carried two names for every colour — a leftover "paper" set and the "earth" set —
and the surfaces drifted apart in weight, radius and ink while each looked
correct on its own. A control that means the same thing on both surfaces is now
literally the same component: the popover's actions are `<Button>`.

Palette, one name per job:

| Token                                 | Value                             | Role                                        |
| ------------------------------------- | --------------------------------- | ------------------------------------------- |
| `--earth`                             | `#2e281c`                         | the panel: window and popover               |
| `--earth-raise`                       | `#3a3224`                         | opaque sheet over the panel: menus, dialogs |
| `--wash`                              | `rgba(255,244,220,.055)`          | a tile on the panel                         |
| `--well`                              | `rgba(0,0,0,.22)`                 | pressed in: fields, tracks                  |
| `--ink-hi` / `--ink-mid` / `--ink-lo` | `#f4f2ec` / `#e8dcc8` / `#ad9d80` | values · prose · captions                   |
| `--gold` / `--gold-ink`               | `#e8ca8d` / `#2a241c`             | the accent, and text on it                  |
| `--ok` / `--warn` / `--rose`          | `#8fbf72` / `#e0a35c` / `#d4785a` | running · paused · destructive              |
| `--hairline`                          | `rgba(244,242,236,.1)`            | every visible edge                          |

The shadcn contract (`--background`, `--card`, `--primary`, `--border`, …) points
at those values, so the component library and the hand-written surfaces cannot
disagree.

## Green is not a button

`--ok` means "running" or "progress", and it is never a fill for an action. The
popover's primary action was green while the window's was gold — the same verb
in two colours, and green carrying two meanings at once. The accent fills
actions; green fills bars.

## Motion

150–250ms. Tab text changes colour; tiles do not choreograph on load beyond a
short stagger. `prefers-reduced-motion` kills duration.

## Surfaces, as built

- **Menu-bar popover (340×428).** The app's front door. One hero figure — the
  time to the next break — with a one-word verdict beside it, then four equal
  tiles: cadence, break length, time since the last break, today's hours. Each
  tile's caption carries a fact the heading does not (`at 13:51`, `Full screen`,
  `09:00–18:00`) — a caption that repeats its own heading is noise, and this
  surface has room for exactly four facts. Then Break now, Pause, Settings.
- **Settings (1100×740).** Titlebar tabs (节奏 / 日程 / 外观 / 系统), the same
  hero verdict row, then tiles. Nothing is a form unless it must be.
- **Notice slip.** Earth tile, gold countdown, one click to act.
- **Break sheet.** The user's own palette; the countdown stays the largest thing.

## Two decisions worth keeping

**One number, one control.** The cadence tiles used to print the value twice — a
big numeral and a `00h:28m:00s` field under it — and four of them were on screen
at once. The numeral IS the field: clicking it opens the three boxes, and at
rest it reads `28m`. Four preset chips cover the common cases so the boxes stay
closed.

**One duration format.** `app/renderer/lib/format.ts` owns it. The window and the
popover were saying the same value four different ways; a reader comparing them
was reading two products.

## Light and dark

The app ships the dark earth chrome only. It is Mole's own default, and the two
surfaces that must survive a bright desk — the notice and the break sheet — are
drawn in the user's chosen palette rather than the app's. A second chrome theme
would double every token this file lists to serve a case nobody asked for.

## Instruments must be wired up

A tile may carry one bar, and it is a **position in a cycle** — how far through
the interval, how long since the last break against the cadence, how far into
today's window. It is never a decorative sparkline.

The first pass drew five fixed bar heights scaled by a constant on every tile:
it looked like an instrument and measured nothing. A bar whose width cannot
change is a lie about the data, and it teaches the reader to stop reading the
bars — which costs the one real series the app has (progress through the
interval). Where there is no cycle to be part-way through, the tile carries no
bar at all, which is what Mole's own RPM and battery tiles do.
