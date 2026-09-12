# CLAUDE.md

Guidance for working in this repository.

## Project Overview

Fermata is a cross-platform Electron desktop app for managing periodic breaks. It
runs in the tray / menu bar and interrupts with either a native notification or an
always-on-top window on every display.

It is a **redesign fork** of [BreakTimer](https://github.com/tom-james-watson/breaktimer-app)
by [tom-james-watson](https://github.com/tom-james-watson). The scheduling engine,
settings model and IPC surface are his; the visual world, the week ledger, the
drawn icon set and the Chinese translation are this fork's.

**Read [DESIGN.md](DESIGN.md) before changing anything visual.** It is not
decoration — it records decisions with reasons, and several of them exist because
the obvious alternative was tried and measured wrong.
[PRODUCT.md](PRODUCT.md) records what must survive future work.

## Architecture

### Main process — `app/main/`

| File                   | Job                                                                       |
| ---------------------- | ------------------------------------------------------------------------- |
| `index.ts`             | entry point, single-instance lock, window creation on activate            |
| `lib/breaks.ts`        | the schedule: tick, working hours, idle detection, postpone               |
| `lib/windows.ts`       | window geometry for the settings window and the per-display break windows |
| `lib/tray.ts`          | tray icon, menu, next-break label                                         |
| `lib/store.ts`         | electron-store persistence and the migration chain                        |
| `lib/ipc.ts`           | every IPC handler                                                         |
| `lib/l10n.ts`          | `t()` for the main process — the tray menu and the OS notifications       |
| `lib/notifications.ts` | native notification wrapper                                               |
| `lib/auto-launch.ts`   | start at login                                                            |

### Renderer — `app/renderer/`

| Path                                    | Job                                                                   |
| --------------------------------------- | --------------------------------------------------------------------- |
| `index.css`                             | **the design system**: tokens, `@font-face`, the orbit, all keyframes |
| `i18n.tsx`                              | `LocaleProvider`, `useT()`, and the `<html lang>` switch              |
| `components/icons.tsx`                  | all 19 icons, drawn here, no icon library                             |
| `components/settings/nav.tsx`           | the rail's model — four groups and their section anchors              |
| `components/settings/settings-rail.tsx` | the contents rail and its scroll-spy                                  |
| `components/settings/page-head.tsx`     | the eyebrow / 32px title / lede at the top of each page               |
| `components/settings/working-hours.tsx` | the week ledger                                                       |
| `components/settings/shift-band.tsx`    | one shift: drag to move, click to edit                                |
| `components/break/break-page.tsx`       | the break sheet                                                       |
| `components/break/break-notice.tsx`     | the pre-break slip                                                    |
| `components/ui/`                        | shadcn primitives, restyled — not replaced                            |

The renderer entry is `main.tsx`, not `index.tsx`.

### Shared — `app/i18n/`, `app/types/`

`app/i18n/` holds the message catalogues and is imported by **both** processes.
`app/types/` holds the settings, break and IPC types.

## Rules that are easy to break

1. **Nothing is grey.** Every neutral derives from parchment `#f5f4ed` or ink
   `#141413`. `--navy-tint` (`#EEF2F7`) is the reference's own brand tint but it is
   a _cool_ blue-grey: it belongs on a hover or a transient selection, never on a
   permanent surface. `scripts/verify-ui.mjs` fails the build on a cool grey.
2. **The serif stops at 14px.** Above it, `--font-serif`; below it, the system
   sans. A text serif loses its counters at UI sizes, and the reference never sets
   Charter below 14px either.
3. **Icons are drawn, not imported.** `stroke-width: 1.8`, round caps, a 24 grid
   (16 for small marks), at most one small filled element. `lucide-react` was
   removed on purpose.
4. **The countdown is the largest thing on any surface that shows time.**
5. **Every motion is a fact, not a decoration**, and nothing animates for longer
   than it takes to read what it is revealing. `prefers-reduced-motion` disables
   all of it.
6. **Any new binary file needs its extension in `.gitattributes`.** The file
   starts with `* text eol=lf`, which silently corrupts binaries that are not
   listed. This already happened once, to the font files.
7. **A new string is two strings.** Add the key to `app/i18n/en.ts` and
   `app/i18n/zh.ts`; the second is typed `Record<MessageKey, string>`, so a
   missing translation is a compile error rather than an English string in a
   Chinese window.

## Commands

```bash
npm run dev                      # hot-reloading dev
START_MINIMIZED=true npm run dev # without stealing focus
npm run build                    # main + renderer
npm run start                    # run the production build
npm run typecheck                # tsc, both configs
npm test                         # vitest
npm run lint                     # eslint, --max-warnings=0
npm run format                   # prettier --write
```

### Checking the UI

The sizes this app ships at cannot be reviewed by reading source, and the defects
a redesign hides best are invisible in a screenshot:

```bash
npm run build-renderer
node scripts/verify-ui.mjs --shot /tmp/fermata-shots   # 17 surfaces
node scripts/verify-ui.mjs --slow                      # + the notice's countdown
```

It renders every surface in headless Chrome against a stubbed preload — both
languages, both themes, 125% and 150% DPI, and a 3440×1440 display — and fails on
horizontal overflow, clipped content, text below the floor, contrast below the
WCAG minimum, any cool grey, hit targets under 20px, a rail anchor with no target,
and a two-column layout that silently stacked.

To see which font is _actually_ rendering rather than which one the stack asks
for, use CDP's `CSS.getPlatformFontsForNode`. A font stack is a wish, not a fact.

### Packaging

```bash
npm run package        # current platform
npm run package-mac    # also package-win, package-linux
```

`.github/workflows/release.yml` builds all three on a `v*` tag and opens a
**draft** release. Upstream publishes by hand from three machines; this fork does
not, because that is how a project ends up with "no Windows version".

## Development workflow

Run after non-trivial changes:

```bash
npm run format && npm run lint && npm run typecheck && npm test
```

## Licence

GPL-3.0-or-later, inherited from upstream, and it stays that way. The attribution
in [README.md](README.md) is a licence term, not a courtesy: this is a derivative
work, and credit for the product belongs to
[tom-james-watson](https://github.com/tom-james-watson).
