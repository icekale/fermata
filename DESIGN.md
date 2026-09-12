# Design

Fermata's visual world: **Paper & Ink**.

The name is the thesis. A _fermata_ is the notation that means _hold this note
longer than written, then continue_ — a break, written down. The mark is an arch
over a dot, which is also a clock: the arch is the sweep, the dot is where the
hand is. Both readings are the product.

The reference is mole.fit and the Tang token set it shares with kami and luo —
parchment and ink instead of grey chrome, a serif that carries the content,
hairlines instead of boxes, pills instead of rectangles, near-zero elevation.
That world was named by the owner and is binding. What follows is how it was
translated into a desktop app that has to work at three sizes (660px window,
100px slip, full screen), in light and dark, on a 3440px display and on a
13-inch laptop, with user-chosen colours on one of its surfaces.

## The thesis

A break timer is a printed page on your desk. The app you configure is a manual;
the break you take is a sheet of paper laid over your work.

That is not decoration. The reason the reference world fits is that a break
reminder's real problem is that it interrupts, and paper is the least
antagonistic thing you can put in front of someone — it sits still, it has no
opinions, and it is quiet enough that dismissing it does not feel like a fight.

## Three rules the whole system enforces

1. **Nothing is grey.** Every neutral is warm, derived from parchment
   `#f5f4ed` or ink `#141413`. A cool grey next to parchment reads as a bug,
   because it is one: it is a leftover from the neutral theme this replaced.
   The build verifies this mechanically — see `scripts/verify-ui.mjs`.
2. **Depth is a hairline first.** Sections are separated by a 1px rule, not a
   box. Shadows exist but are warm-ink and low-alpha; a shadow that reads as a
   shadow is too strong.
3. **Content is serif.** The system sans is kept for exactly one job: uppercase
   micro-labels, where a serif at 11px with letterspacing goes muddy. Numerals
   that change get tabular lining figures, always, or the layout breathes by a
   pixel a second while the countdown runs.

## Tokens

Defined once in `app/renderer/index.css`. Names are paper words, not UI words,
because a control and the surface it sits on are the same material at different
depths.

### Surface tokens

| Token            | Light     | Role                                                                  |
| ---------------- | --------- | --------------------------------------------------------------------- |
| `--paper`        | `#f5f4ed` | the page                                                              |
| `--paper-raised` | `#faf9f5` | a sheet laid on the page: cards, popovers, dialogs, the notice slip   |
| `--paper-sunk`   | `#edebe1` | a well pressed into the page: inputs, switch tracks, the ledger's row |
| `--sand`         | `#e8e6dc` | filled secondary controls                                             |

### Inks

| Token        | Light     | Role                                    |
| ------------ | --------- | --------------------------------------- |
| `--ink`      | `#141413` | text, and the section titles            |
| `--ink-soft` | `#3d3d3a` | headings that are not the page title    |
| `--olive`    | `#504e49` | body prose, field labels                |
| `--stone`    | `#6b6a64` | helper text, micro-labels, placeholders |

### The one accent

| Token          | Light     | Role                                                  |
| -------------- | --------- | ----------------------------------------------------- |
| `--navy`       | `#1b365d` | brand, primary action, focus ring, the ledger's bands |
| `--navy-light` | `#2d5a8a` | the primary action's hover                            |
| `--navy-tint`  | `#eef2f7` | a hairline pill's hover wash, selected list rows      |
| `--stamp`      | `#a33327` | printer's red: destructive, and **now** on the ledger |

Navy carries every accent. The reference's own note applies unchanged: blue
titles on every section made the accent read as noise, so blue stays on
eyebrows, links, buttons and the index numerals — not on headings.

`--stamp` is the only red and it is load-bearing twice: it means "this destroys
something" and it means "this is now". Those are the two places a reader needs
to be stopped, and they are the only two.

### Rules

`--rule` `#d8d5c8` is the visible hairline. `--rule-soft` `#e4e1d6` is a divider
inside a block. `--rule-faint` `#edebe1` is rhythm, not structure.

### Radii

`--radius: 12px`, so `sm` 8 / `md` 10 / `lg` 12 / `xl` 16. Pill controls are
`999px` and are written explicitly, never derived. The reference's own tally:
999px appears 18 times, 14px seven times, 8px four times. Two families —
pill and sheet — and nothing in between.

### Elevation

| Token               | Value                            | Use                          |
| ------------------- | -------------------------------- | ---------------------------- |
| `--shadow-hairline` | `0 1px 2px rgba(20,19,19,.05)`   | a switch knob, a slider knob |
| `--shadow-sheet`    | `0 1px 3px rgba(20,19,19,.08)`   | reserved                     |
| `--shadow-lift`     | `0 8px 24px rgba(20,19,19,.08)`  | popovers, selects, toasts    |
| `--shadow-veil`     | `0 24px 60px rgba(20,19,19,.22)` | dialogs, the break sheet     |

All four are warm: the base is the ink token, never black.

### Motion

Two curves. `--ease-paper` `cubic-bezier(.2,.7,.3,1)` for anything that settles —
the app's own voice. `--ease-out` `cubic-bezier(.25,.46,.45,.94)` for anything
that leaves. Durations: 150ms for state changes, 200–350ms for entrances, 500ms
for the break sheet's fade. Nothing longer. A settings window that animates for
longer than the time it takes to read a label is stealing time.

`prefers-reduced-motion: reduce` sets every duration to 0.001ms.

### Type

```
--font-serif  Charter, "Iowan Old Style", Georgia, "Source Han Serif SC",
              "Noto Serif CJK SC", "Songti SC", STSong, "Liberation Serif",
              "DejaVu Serif", Palatino, serif
--font-sans   -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI",
              "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif
--font-mono   "JetBrains Mono", "SF Mono", ui-monospace, "Fira Code", Menlo,
              Consolas, Monaco, monospace
```

Charter first because it ships on macOS and has lining figures; Georgia is the
cross-platform stand-in. CJK is deliberately **serif** — pingfang is a sans, and
mixing it in would set one sentence in two voices on the same line. That is the
exact bug the reference site documents going out of its way to fix.

CJK serif names Songti SC (macOS), SimSun 宋体 and MingLiU (Windows), and Source
Han / Noto (Linux). Windows was the gap in the first pass: neither Songti nor
Source Han is present there, so Chinese would have fallen through to whatever
generic `serif` resolved to — and on a machine that maps it to a sans, the
Chinese interface would have lost the typeface in two places at once, no serif
and Latin and Han set from different families.

The mono stack is declared for technical strings only and is currently unused.

### Type ladder

Every size in the app is one of these. No in-between values.

| Size                          | Role                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| `clamp(56px, 24cqmin, 220px)` | the break countdown — the only display size                            |
| 23px                          | dialog titles                                                          |
| 20px                          | the break sheet's title                                                |
| 17px                          | section titles                                                         |
| 16px                          | footer / display lockups                                               |
| 15px                          | the wordmark, running prose                                            |
| 14px                          | control values, button labels, list rows                               |
| 13px                          | field labels, secondary prose, the index numerals                      |
| 12px                          | meta, swatch names, colour readouts                                    |
| 11px                          | **the floor.** Uppercase micro-labels and axis marks only, never prose |

## Component grammar

| Element              | Rule                                                                                                                                                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**           | Always a pill. `default` is filled navy (a noun: Save). `outline` is navy ink behind a 1.5px navy hairline (a verb you can take back). `ghost` and `secondary` are quiet. `destructive` is the only filled stamp. Hover lifts by 1px and returns.                                                               |
| **Switch**           | A 34×20 well that fills with navy. The knob is `--paper-raised`, not white, so it reads as the same material as the page.                                                                                                                                                                                       |
| **Slider**           | A 4px track with a 1px inset rule, a navy ink fill, and a paper knob ringed in navy.                                                                                                                                                                                                                            |
| **Input / Textarea** | A **well**, not a box: `--paper-sunk` behind a hairline. Focus is a navy border plus a 3px `--navy-wash` halo, never a browser ring.                                                                                                                                                                            |
| **Select**           | The trigger is a well. The menu is a raised sheet with `--shadow-lift`, and its selected row is `--navy-tint` with navy text.                                                                                                                                                                                   |
| **Checkbox**         | 17px, 5px radius, navy when checked.                                                                                                                                                                                                                                                                            |
| **Tabs**             | The section index: a full-width pill track in parchment glass (`color-mix(paper-raised 78%, transparent)` behind `backdrop-filter: blur(14px)`, one hairline, no shadow). The active pill is **filled navy** — the same treatment as a primary button, because it is the same statement: this is where you are. |
| **Dialog**           | A raised sheet, `xl` radius, `--shadow-veil`, over a veil of `color-mix(mole 52%, transparent)`.                                                                                                                                                                                                                |
| **Toast**            | A paper slip, styled from `index.css` against sonner's data attributes rather than with four `important` flags in the component.                                                                                                                                                                                |
| **Section**          | A hairline ABOVE, a 17px title, optional 13px stone helper, optional switch right-aligned on the title's line, then contents. No border around it.                                                                                                                                                              |

### Section anatomy, and why it is not a card

The screen this replaced stacked nine bordered cards inside a bordered pane
inside a bordered window, so every level of the hierarchy was drawn with the
same 1px rectangle and the reader had to open the borders to find out what
belonged to what. Here the rule separates, the heading groups, and whitespace
does the nesting.

## The signature devices

### 1. The orbit

Sections are separated by a faint quadratic arc with a 4px star drifting slowly
along it. This is the reference's own device and the first pass at this app did
not have it — it used `border-top: 1px solid`, which is generic editorial and
belongs to any magazine.

```
.orbit          a 16px band
.orbit::before  the arc, as a MASK of --rule, so it themes
.orbit::after   the star, 4px, navy at 38%
```

Three details are load-bearing:

- **The star's keyframes sample the curve every 12.5%.** At 25% steps the linear
  segments sag about 0.4px below the arc and the star visibly hangs off its own
  orbit. Values are the sampled y minus half the star.
- **The arc is a mask, not a background image.** A data-URI background cannot
  carry a CSS variable, so it would have to hard-code its colour and the dark
  theme would be wrong. As a mask, the stroke is `--rule` and themes for free.
- **Six speeds, cycled by `nth-child`, with negative delays.** Every star is
  already mid-orbit on the first frame instead of all starting at the left edge
  together. This borrows the pace table the reference uses for its planets.

Under `prefers-reduced-motion` the stars stop where they are; the arc stays.

### 2. The index, not a tab bar

The four top-level sections are numbered, and the numbers are the wayfinding:
four unnumbered pills give the eye nothing to count and nothing to return to.
The number sits inside the pill at 60% of the pill's ink, set in the same serif
at the same size as the label, because two typefaces inside a 32px pill is two
voices.

### 3. The contents rail

A settings window with eleven sections and four groups is a document, and a
document has a table of contents down the side rather than a row of tabs across
the top. The rail is that list: the four groups, and under the open one, its
sections as anchors.

Three things follow from it, and only the first is decoration:

- It is where the wider window earns its width. Widening the pane and leaving
  the top tab bar would have made a wider form; the width only becomes something
  once navigation moves to the side and the content column gets the room — 752px
  against 612px, which takes the ledger's 24-hour scale from 512px to 620px,
  three extra drag steps across a working day.
- The open group's sections are hung under it like a chapter's sections in a
  printed contents list, with a **scroll-spy**: an `IntersectionObserver` whose
  root margin is `0 0 -60% 0` so "current" means the section you are reading,
  not any section that happens to be on screen. The current entry gets a filled
  navy tick on the rule; the rest get a hairline tick.
- The selected group is `--sand`, not `--navy-tint`. The rail has one selected
  item at all times, so a cool tint there is a permanent cold surface for as
  long as the window is open — the same defect the section seals had, caught by
  the same build check.

The anchor ids are declared once in `settings/nav.tsx` and read by
`verify-ui.mjs` straight out of that file, so a rail link that points at nothing
fails the build rather than silently doing nothing.

### 4. The week ledger

Working hours are one 7-row ledger on a shared 24-hour scale with hour marks at
00 / 06 / 12 / 18 / 24. Each configured shift is an ink band. Disabled days keep
their shift as a dashed outline so nothing disappears when a day is switched
off. A stamp-red hairline marks **now**, across every row, with a dot on today.

- **Drag a band** to move a shift; it snaps to 15 minutes and is clamped inside
  the day, keeping its duration.
- **Click a band** to open the editor: exact `09:00` / `18:00` fields, add a
  shift (up to four), remove, and the copy-to-other-days grid the old screen had.
- The band's label appears only when the band is wider than 12% of the day.

This replaces fourteen `09 : 00 h m` input groups whose numbers you had to
reconstruct an answer from. A drag and a click share a target, so the drag sets
a flag and the click that follows a real drag is swallowed; otherwise every drop
would fling a popover open at the drop position.

### 5. The folio numeral

The countdown is sized against the **sheet**, not the screen, via
`clamp(56px, 24cqmin, 220px)` on a `container-type: size` parent. A break on a
3440px display and a break in a 540px floating card are the same page at two
scales, so the numeral has to be a fraction of the page it sits on.

It is set in the serif with `font-variant-numeric: lining-nums tabular-nums`,
and the class that does it is `.tnum`, applied to everything that counts.

## The icon set

Nineteen glyphs, drawn in `app/renderer/components/icons.tsx` rather than
imported, because the reference does the same thing: every glyph on mole.fit is
an inline SVG on a 24 grid at `stroke-width 1.8` with round caps, and its small
marks sit on a 16 grid. That is why an imported set reads as generic even when
the palette around it is right — a library's 2px stroke and square-cut geometry
is a different hand from the one that drew the page.

House rules:

- 24 grid, `fill="none"`, `stroke="currentColor"`, 1.8, round caps and joins.
- A glyph may carry **at most one small filled element**, and it is always the
  thing that would be a dot on paper: a centre, a _now_, a knob.
- The arch-over-a-dot from the mark is the family's recurring shape, so several
  glyphs are a variation on an arc plus a dot.
- Small marks — check, chevrons, plus, close — move to a **16 grid**, because at
  14–16px a 24 grid rounds to a different, softer shape than the glyphs drawn
  for it.

The eleven section seals use it. A seal is a 34×34 rounded square on
`--sand`, not `--navy-tint`: navy-tint is the reference's own `--brand-tint` and
it is right for the moment it was drawn for — a button on hover, a row while it
is selected — but as a _permanent_ surface on eleven sections it became the only
cold thing on the page, repeated eleven times. The build's cool-grey check
caught that, and it was a real defect rather than a false positive.

lucide-react was removed from `package.json` with the set: nineteen glyphs
replaced a 1,600-icon dependency.

## Motion, in full

Four moves, and every one is a fact about the product rather than a decoration
on it. The first pass had almost none, on the principle that a break reminder
should not waste your time — the right instinct applied far too broadly: a page
that never moves reads as a dead page, and stillness is not the same thing as
calm. **Slow is calm.**

| Move                     | Where                                        | Why                                                                                                                                                                    |
| ------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orbit-drift`            | every section divider                        | the page is alive without asking for attention; 30–156s cycles                                                                                                         |
| `section-in`             | sections, staggered 55ms                     | a tab opens as one page arriving, not six elements appearing                                                                                                           |
| `band-in`                | the week's shift bands                       | a clip reveal from the left, one day at a time — a hand ruling the week. A clip, not a scale, or the times inside would squash                                         |
| `arch-draw` + `dot-drop` | the mark, on the masthead and the title page | the shape is ruled onto paper, then the dot is set down                                                                                                                |
| `now-pulse`              | today's stamp dot                            | the only element moving on its own clock; 3.4s and shallow, because a pulse you notice has become a notification                                                       |
| `star-breathe`           | the break sheet's progress rule              | the same 4px star as the dividers, marking the point in the break you have reached                                                                                     |
| `slip-land`              | the notice                                   | a small overshoot, 45ms past rest — the difference between paper being set on a desk and a rectangle fading up                                                         |
| wind-up                  | the break countdown                          | the digits run up from zero to the break's length in 680ms, then settle into counting down. A mechanical counter coming to rest says "this has started" without a word |

Tokens: `--ease-paper` `cubic-bezier(.2,.7,.3,1)` for anything that settles,
`--ease-out` for anything that leaves. 150ms for state changes, 200–500ms for
entrances. Nothing longer.

## Language and Chinese

Strings live in `app/i18n/` as flat dotted keys, one file per locale, no
library — the app ships ~150 strings across two processes, and i18next would be
a dependency, a provider, a plugin chain and a namespace convention to carry the
same 150, plus a second instance in the main process. `translate()` is twenty
lines and both processes call it.

- `en.ts` is the source of truth; `zh.ts` is typed `Record<MessageKey, string>`,
  so a key added to English and forgotten in Chinese is a **compile error**
  rather than an English string surfacing in a Chinese window.
- A test asserts the two catalogues interpolate the same variables, so
  `{minutes}` cannot become `{mins}` in one language and print a brace.
- Plural keys are authored as `.one` / `.other` pairs; Chinese, having no plural
  form, gives both the same wording and the test says so out loud.
- `language` is `"system" | "en" | "zh"`, defaulting to `system`. **Both
  processes resolve it themselves** — the renderer from `navigator.language`,
  the main process from `app.getLocale()` — so the tray menu and the window
  cannot disagree, and the tray keeps working with no window open.
- The language picker applies live, before Save. A language picker with no
  visible effect until you find the Save button is a picker nobody trusts.

Chinese sets differently, and two of the differences look like bugs when missed:

- **Leading goes to 1.75** from 1.55. Han characters are square and dense; a
  leading that suits Latin prose crowds them.
- **`text-wrap: balance` is switched off** for headings. With no word spaces to
  break at, a balancer will split a phrase mid-word to even two lines — on the
  reference site it split a counter across two lines and read as a typo.
- **The 11px floor becomes 12px for Han labels.** 11px is a Latin floor; Han
  carries far more strokes per em, so the same nominal size reads about two
  steps smaller.
- Latin words inside Chinese stay in Charter, because the stack puts Charter
  first and Chinese faces only carry the Han ranges. One sentence, two faces,
  each doing what it is good at.

## Surfaces

### Settings — 1040×800, two columns

A 216px rail (mark, wordmark, the four groups, the open group's contents, Save)
beside an 824px pane holding the page, inset to a 752px measure. The wordmark
replaces a 24px "Settings" heading that only restated the window title the
titlebar already carries, and the rail replaces the row of tabs.

The mark is the app's own idea drawn at 18px: a hairline bezel with a navy arc
for the elapsed share — the same vocabulary as the break sheet's progress rule,
so the window and the break read as one product.

Save is the only commit path, as upstream. When nothing is dirty the space it
occupies holds a quiet "All changes saved" in `--rule`, so the layout never
shifts when it appears.

Sections, in upstream's order and grouping: Breaks, Smart Breaks, Snooze, Skip,
Advanced / the week ledger / Break Screen, Veil, Audio / Start at login, Menu
Bar Text. Content and grouping were deliberately preserved; the redesign is in
how they are set, not in what is there.

### Notice — 592×100 at the top of each display

A slip of paper: raised paper, one hairline, `--radius-lg`. A micro-label
("Break" / "Break starting in"), then the 24px tabular countdown or the grace
sentence, then the time-since-last-break meta, then the actions, with a 1px rule
across the foot that fills with navy.

The screen this replaced colour-filled its own background from the break theme
and drew the countdown as a translucent wipe across the whole card, so the one
thing you needed to read was competing with a moving coloured rectangle.

### Break sheet — full screen with a veil, or a 540×420 card without one

A sheet of paper on a darkened desk. The veil is `--veilColor` at the user's
strength behind it; with the veil off the window is small and the sheet is the
window.

Head: "Break" at the left, "Ends 14:32" at the right, on a hairline that fills
with ink as the break elapses. Body, centred: the folio numeral, the title, the
message as written (newlines preserved). Foot: one hairline pill in
`currentColor` whose label changes from "Cancel Break" to "End Break" at the
halfway point, as upstream.

`max-width: 1120px; max-height: 820px` — **a page has a measure.** Full-bleed
was the first instinct and it is wrong on a wide display: on a 3440px monitor
the sheet measured 3312px across and the two head labels ended up a metre apart.
Capping the sheet keeps the composition identical on every screen; what changes
is how much desk you can see around it, which is the veil's job.

## Break Screen palettes

Six named sheets replace two free colour pickers. This was the single largest
coherence problem in the old app: the shipped default was a saturated teal, so
the one surface every user sees full-screen was the one surface the product had
no control over.

Each preset carries three values, and the third is the one that matters:
`background` fills the sheet, `text` is the ink on it, `veil` is what the desk
becomes. The old code derived the veil by multiplying the sheet's channels by
0.3, which turned parchment into mud; a named veil keeps the two surfaces
related but distinct.

Paper `#f5f4ed` / `#141413` / `#33302a` · Ink `#1a1917` / `#f4f2ec` / `#0b0b0a` ·
Midnight `#16233a` / `#eef2f7` / `#0a1120` · Moss `#46503f` / `#f1efe6` / `#252b20` ·
Clay `#8c3a24` / `#faf1ea` / `#43190f` · Plum `#3c2a3d` / `#f3ecf3` / `#1f1420`

The swatch **is** the preview: painted in the palette's own sheet and ink with a
numeral in it, because a colour chip cannot tell you whether the countdown will
be readable and a rendered numeral can. Custom remains, and a custom sheet
reports its measured WCAG ratio — below 4.5:1 the app says so instead of quietly
shipping unreadable text.

## Dark theme

`prefers-color-scheme: dark` is the same world printed the other way up: warm
charcoal paper `#1a1917`, ivory ink `#f4f2ec`, the same hairlines at low alpha.
It is not a second palette — every warm token keeps its hue and only swaps
lightness, because a cold dark mode next to the parchment one reads as two
products.

Navy is far too dark to read on charcoal, so the dark theme takes the brand's
lighter step `#9dbcdf`, which is the same hue at the lightness the surface
actually needs. Same for the stamp red, at `#e08e7c`.

## What this world never does

- No cool grey. No `slate`, no `gray`, no `neutral` — the tokens are warm or
  they are wrong.
- No bordered boxes nested inside bordered boxes.
- No text below 11px.
- No shadow that reads as a shadow.
- No full-width filled button that is not a commit action.
- No animation longer than the time it takes to read what it is revealing.
- No colour used for decoration. Navy means "action or current", stamp means
  "destructive or now", and nothing else is coloured.

## Where the reference was deliberately not followed

- **The reference is a marketing site at 1440px.** This app has to be right at
  660px, at 592×100, and at 3440×1440. Composition was rebuilt per surface
  rather than scaled down from a wide page.
- **The reference sets almost everything in serif at 15px+.** A settings window
  has 11px micro-labels and 13px field labels, and a serif at those sizes with
  letterspacing goes muddy — so the system sans takes exactly that job and
  nothing else.
- **The reference has no dark mode.** This app must follow the OS, so the ink
  reversal above was specified rather than borrowed.
- **The reference's catalogue imagery has no analogue here.** There is no
  photography in this product and none was invented.
