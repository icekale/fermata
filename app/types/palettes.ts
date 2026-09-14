import type { MessageKey } from "../i18n";

export interface BreakPalette {
  id: string;
  nameKey: MessageKey;
  background: string;
  text: string;
  veil: string;
}

export const breakPalettes: BreakPalette[] = [
  {
    id: "obsidian",
    nameKey: "palette.ink",
    background: "#2a241c",
    text: "#e8ca8d",
    veil: "#14110c",
  },
  {
    id: "frost",
    nameKey: "palette.paper",
    background: "#f3efe4",
    text: "#2a241c",
    veil: "#1f1b16",
  },
  {
    id: "midnight",
    nameKey: "palette.midnight",
    background: "#1a1917",
    text: "#f4f2ec",
    veil: "#0b0b0a",
  },
  {
    id: "emerald",
    nameKey: "palette.moss",
    background: "#2c3324",
    text: "#d5e0c4",
    veil: "#141810",
  },
  {
    id: "amber",
    nameKey: "palette.clay",
    background: "#3a2a1c",
    text: "#f0d3a8",
    veil: "#1a120c",
  },
  {
    id: "amethyst",
    nameKey: "palette.plum",
    background: "#2e2430",
    text: "#e6d4e8",
    veil: "#160f18",
  },
];

export const defaultPalette = breakPalettes[0];

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

export function deriveVeil(background: string): string {
  const [r, g, b] = toRgb(background);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const targetL = 0.08;
  const scale = lightness > 0 ? targetL / Math.max(lightness, 0.02) : 1;
  const desaturate = 0.7;
  const grey = [r, g, b].reduce((a, c) => a + c, 0) / 3;
  const mixed = [r, g, b].map((c) => grey + (c - grey) * desaturate);
  return toHex(
    mixed.map((c) => c * Math.min(scale, 1.05)) as [number, number, number],
  );
}

export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}
