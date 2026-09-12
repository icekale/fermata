import type { MessageKey } from "../i18n";

/* The break screen's palette.

   The old screen shipped two free colour pickers, which meant the app's
   default break surface was a saturated teal card and every user's break
   screen was a different product. Both are replaced by six named sheets drawn
   from the same paper world the rest of the app lives in, with Custom kept as
   the escape hatch for anyone who wants their own.

   Every preset carries three values, and the third is the one that matters:
   the background fills the sheet, the text is the ink on it, and the veil is
   the colour the DESK goes when you ask a break to dim the screen behind it.
   The old code derived the veil by darkening the sheet colour to 30%, which
   turned parchment into mud; a named veil keeps the two surfaces related but
   distinct. */

export interface BreakPalette {
  id: string;
  /** Message key, so the six names exist once and translate with everything
   *  else. */
  nameKey: MessageKey;
  /** The sheet: fills the break window. */
  background: string;
  /** The ink: title, countdown, message, actions. */
  text: string;
  /** The desk: the veil drawn behind the sheet when "Veil the screen" is on. */
  veil: string;
}

export const breakPalettes: BreakPalette[] = [
  {
    id: "paper",
    nameKey: "palette.paper",
    background: "#f5f4ed",
    text: "#141413",
    veil: "#33302a",
  },
  {
    id: "ink",
    nameKey: "palette.ink",
    background: "#1a1917",
    text: "#f4f2ec",
    veil: "#0b0b0a",
  },
  {
    id: "midnight",
    nameKey: "palette.midnight",
    background: "#16233a",
    text: "#eef2f7",
    veil: "#0a1120",
  },
  {
    id: "moss",
    nameKey: "palette.moss",
    background: "#46503f",
    text: "#f1efe6",
    veil: "#252b20",
  },
  {
    id: "clay",
    nameKey: "palette.clay",
    background: "#8c3a24",
    text: "#faf1ea",
    veil: "#43190f",
  },
  {
    id: "plum",
    nameKey: "palette.plum",
    background: "#3c2a3d",
    text: "#f3ecf3",
    veil: "#1f1420",
  },
];

export const defaultPalette = breakPalettes[0];

/** Which preset, if any, the current pair of colours is exactly. */
export function findPalette(
  background: string,
  text: string,
): BreakPalette | null {
  const bg = background.toLowerCase();
  const fg = text.toLowerCase();
  return (
    breakPalettes.find(
      (palette) =>
        palette.background.toLowerCase() === bg &&
        palette.text.toLowerCase() === fg,
    ) ?? null
  );
}

function toRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex(rgb: [number, number, number]): string {
  return (
    "#" +
    rgb
      .map((c) =>
        Math.max(0, Math.min(255, Math.round(c)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

/* A veil derived from a sheet colour: drop the lightness hard, then pull most
   of the saturation back out. Naively multiplying the channels (what the app
   used to do) keeps full saturation, so a teal sheet produced a teal desk and
   the two surfaces read as one flat colour. */
export function deriveVeil(background: string): string {
  const [r, g, b] = toRgb(background);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const targetL = 0.11;
  // Scale toward the target lightness rather than multiplying, so a light
  // sheet and a dark sheet both land on a desk of about the same depth.
  const scale = lightness > 0 ? targetL / Math.max(lightness, 0.02) : 1;
  const desaturate = 0.62;
  const grey = [r, g, b].reduce((a, c) => a + c, 0) / 3;
  const mixed = [r, g, b].map((c) => grey + (c - grey) * desaturate);
  return toHex(
    mixed.map((c) => c * Math.min(scale, 1.1)) as [number, number, number],
  );
}

/** Relative luminance, for the contrast guard in the theme card. */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}
