import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/* ---------------------------------------------------------------------------
   The icon set.

   Drawn here rather than imported, because the reference does the same thing:
   every glyph on mole.fit is an inline SVG on a 24 grid at stroke-width 1.8
   with round caps, and its small marks sit on a 16 grid. That is why an
   imported set reads as generic even when the palette around it is right — a
   library's 2px stroke and square-cut geometry is a different hand from the one
   that drew the rest of the page.

   House rules, and everything below obeys them:
     - 24 grid, fill="none", stroke="currentColor", 1.8, round caps and joins
     - a glyph may carry at most one small FILLED element, and it is always the
       thing that would be a dot on paper: a centre, a "now", a knob
     - the arch-over-a-dot from the Fermata mark is the family's recurring
       shape, so several glyphs are a variation on an arc plus a dot
   ------------------------------------------------------------------------ */

interface IconProps {
  className?: string;
  size?: number;
}

function Icon({
  className,
  size = 20,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {children}
    </svg>
  );
}

function Dot({ cx, cy, r = 1.6 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;
}

/* --- the brand ---------------------------------------------------------- */

/* The fermata: a note held longer than written, then released. Drawn as an
   arch over a dot, which is also a clock — the arch is the sweep, the dot is
   where the hand is. Both readings are the product.

   `animated` strokes the arch on and drops the dot in afterwards, which is how
   the mark behaves on the masthead and on the title page. It is the same two
   shapes either way; only the arrival differs. */
export function Fermata({
  className,
  size = 20,
  animated = false,
}: IconProps & { animated?: boolean }) {
  return (
    <Icon className={className} size={size}>
      <path
        className={animated ? "mark-arch" : undefined}
        d="M5.2 14.6a6.8 6.8 0 0 1 13.6 0"
      />
      {animated ? (
        <circle
          className="mark-dot"
          cx="12"
          cy="17.6"
          r="1.9"
          fill="currentColor"
          stroke="none"
        />
      ) : (
        <Dot cx={12} cy={17.6} r={1.9} />
      )}
    </Icon>
  );
}

/* --- section glyphs ----------------------------------------------------- */

/** Breaks: a 3/4 ring with the gap where the hand is, and the hand as a dot. */
export function IconBreaks({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <path d="M20.6 12A8.6 8.6 0 1 1 12 3.4" />
      <Dot cx={12} cy={12} />
    </Icon>
  );
}

/** Smart Breaks: a crescent with the break it already took as a small star. */
export function IconSmart({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <path d="M12.4 3.2a8.8 8.8 0 1 0 8.4 11.4 6.6 6.6 0 0 1-8.4-11.4z" />
      <Dot cx={18.4} cy={5.6} r={1.3} />
    </Icon>
  );
}

/** Snooze: the hour hand going back. */
export function IconSnooze({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <path d="M4.6 11.4a7.6 7.6 0 1 0 2.2-5.4" />
      <path d="M4.2 4.4v3.6h3.6" />
      <Dot cx={12} cy={12} />
    </Icon>
  );
}

/** Skip: past the mark entirely. */
export function IconSkip({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <path
        d="M5.4 6.6l8 5.4-8 5.4z"
        fill="currentColor"
        strokeLinejoin="round"
      />
      <path d="M17.4 6.4v11.2" />
    </Icon>
  );
}

/** Advanced: three rules with a knob on each. */
export function IconAdvanced({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <path d="M3.6 6.8h16.8" />
      <path d="M3.6 12h16.8" />
      <path d="M3.6 17.2h16.8" />
      <Dot cx={8.6} cy={6.8} r={1.9} />
      <Dot cx={15.4} cy={12} r={1.9} />
      <Dot cx={10.4} cy={17.2} r={1.9} />
    </Icon>
  );
}

/** Working hours: the week, with today marked. */
export function IconWeek({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <rect x="3.4" y="5.2" width="17.2" height="15.4" rx="2.6" />
      <path d="M3.4 9.8h17.2" />
      <path d="M8.2 3.4v3.6" />
      <path d="M15.8 3.4v3.6" />
      <Dot cx={8.4} cy={14.4} />
    </Icon>
  );
}

/** Break screen: the sheet, with the two lines that are actually on it. */
export function IconScreen({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <path d="M13.8 3.4H6.4a2 2 0 0 0-2 2v13.2a2 2 0 0 0 2 2h11.2a2 2 0 0 0 2-2V9.2z" />
      <path d="M13.8 3.4v5.8h5.8" />
      <path d="M8.4 13.4h7.2" />
      <path d="M8.4 16.8h4.2" />
    </Icon>
  );
}

/** Veil: half the disc inked. */
export function IconVeil({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <circle cx="12" cy="12" r="8.4" />
      <path
        d="M12 3.6a8.4 8.4 0 0 0 0 16.8z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  );
}

/** Audio: a bell, because a break announces itself rather than plays. */
export function IconAudio({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <path d="M6 9.4a6 6 0 0 1 12 0c0 4.8 1.9 6.2 1.9 6.2H4.1S6 14.2 6 9.4z" />
      <path d="M10 18.8a2.2 2.2 0 0 0 4 0" />
    </Icon>
  );
}

/** Start at login: power, in the family's arc-plus-stem shape. */
export function IconStartup({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <path d="M12 3.4v8.2" />
      <path d="M7.3 6.3a7.4 7.4 0 1 0 9.4 0" />
    </Icon>
  );
}

/** Menu bar: a top bar with one thing in it. */
export function IconMenuBar({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="3" />
      <path d="M3.4 9.2h17.2" />
      <Dot cx={17} cy={6.9} r={1.2} />
    </Icon>
  );
}

/* --- interface glyphs ---------------------------------------------------- */

/* The small marks sit on a 16 grid, like the reference's pricing checks: at
   14-16px a 24 grid rounds to a different, softer shape than the glyphs drawn
   for it. */
function SmallIcon({
  className,
  size = 15,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {children}
    </svg>
  );
}

export function IconCheck({ className, size = 15 }: IconProps) {
  return (
    <SmallIcon className={className} size={size}>
      <path d="M3.1 8.5l3.1 3.1 6.7-6.7" />
    </SmallIcon>
  );
}

export function IconChevronDown({ className, size = 15 }: IconProps) {
  return (
    <SmallIcon className={className} size={size}>
      <path d="M3.6 6.2 8 10.6l4.4-4.4" />
    </SmallIcon>
  );
}

export function IconChevronRight({ className, size = 15 }: IconProps) {
  return (
    <SmallIcon className={className} size={size}>
      <path d="M6.2 3.6 10.6 8l-4.4 4.4" />
    </SmallIcon>
  );
}

export function IconPlus({ className, size = 16 }: IconProps) {
  return (
    <SmallIcon className={className} size={size}>
      <path d="M8 3.2v9.6M3.2 8h9.6" />
    </SmallIcon>
  );
}

export function IconClose({ className, size = 16 }: IconProps) {
  return (
    <SmallIcon className={className} size={size}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </SmallIcon>
  );
}

/* Play and trash keep the 24 grid: a triangle and a lid need the room. */
export function IconPlay({ className, size = 15 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <path
        d="M9.2 6.9v10.2a.9.9 0 0 0 1.37.77l8.1-5.1a.9.9 0 0 0 0-1.54l-8.1-5.1A.9.9 0 0 0 9.2 6.9z"
        fill="currentColor"
      />
    </Icon>
  );
}

export function IconTrash({ className, size = 16 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <path d="M4.6 6.6h14.8" />
      <path d="M9.6 6.6V5a1.4 1.4 0 0 1 1.4-1.4h2a1.4 1.4 0 0 1 1.4 1.4v1.6" />
      <path d="M6.6 6.6l.9 12.1a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5l.9-12.1" />
    </Icon>
  );
}

export function IconChevronUp({ className, size = 15 }: IconProps) {
  return (
    <SmallIcon className={className} size={size}>
      <path d="M3.6 9.8 8 5.4l4.4 4.4" />
    </SmallIcon>
  );
}

/** Language: a globe, drawn the same way the reference draws its own. */
export function IconGlobe({ className, size = 20 }: IconProps) {
  return (
    <Icon className={className} size={size}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.4 12h17.2" />
      <ellipse cx="12" cy="12" rx="3.9" ry="8.6" />
    </Icon>
  );
}
