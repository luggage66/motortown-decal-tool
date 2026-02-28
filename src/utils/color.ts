import type { DecalColor } from "../types";
import type { RgbaColor, HslaColor } from "react-colorful";

/** Convert DecalColor (a: 0–255) to react-colorful RgbaColor (a: 0–1) */
export function toPickerRgba(c: DecalColor): RgbaColor {
  return { r: c.r, g: c.g, b: c.b, a: c.a / 255 };
}

/** Convert react-colorful RgbaColor (a: 0–1) to DecalColor (a: 0–255) */
export function fromPickerRgba(c: RgbaColor): DecalColor {
  return {
    r: Math.round(c.r),
    g: Math.round(c.g),
    b: Math.round(c.b),
    a: Math.round(c.a * 255),
  };
}

/** Convert DecalColor to hex string (#rrggbb or #rrggbbaa if alpha < 255) */
export function rgbaToHex(c: DecalColor): string {
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  const base = `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`;
  return c.a === 255 ? base : `${base}${hex(c.a)}`;
}

/** Parse hex string to DecalColor. Returns null if invalid. */
export function hexToRgba(hex: string): DecalColor | null {
  const h = hex.replace(/^#/, "");
  let r: number,
    g: number,
    b: number,
    a = 255;
  if (h.length === 6) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else if (h.length === 8) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
    a = parseInt(h.slice(6, 8), 16);
  } else if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else {
    return null;
  }
  if ([r, g, b, a].some(isNaN)) return null;
  return { r, g, b, a };
}

/** Convert DecalColor to react-colorful HslaColor (h: 0–360, s: 0–100, l: 0–100, a: 0–1) */
export function toPickerHsla(c: DecalColor): HslaColor {
  const r = c.r / 255,
    g = c.g / 255,
    b = c.b / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0,
    s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100, a: c.a / 255 };
}

/** Convert react-colorful HslaColor to DecalColor */
export function fromPickerHsla(c: HslaColor): DecalColor {
  const h = c.h / 360,
    s = c.s / 100,
    l = c.l / 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: Math.round(c.a * 255),
  };
}
