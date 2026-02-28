import type { DecalLayer } from "./types";

export const FLAG_DEFINITIONS: Record<number, string> = {
  0: "Unknown flag 0",
  1: "Unknown flag 1",
  2: "Unknown flag 2",
  3: "Unknown flag 3",
  4: "Unknown flag 4",
  5: "Unknown flag 5",
  6: "Unknown flag 6",
  7: "Unknown flag 7",
};

export function getFlagBit(flags: number, bit: number): boolean {
  return (flags & (1 << bit)) !== 0;
}

export function setFlagBit(flags: number, bit: number, value: boolean): number {
  if (value) {
    return flags | (1 << bit);
  }
  return flags & ~(1 << bit);
}

export const MAX_LAYERS = 200;

export const MAX_UNDO = 50;

export const DEFAULT_LAYER: DecalLayer = {
  decalKey: "",
  color: { r: 255, g: 255, b: 255, a: 255 },
  position: { x: 0, y: 0 },
  rotation: { pitch: 0, yaw: 0, roll: 0 },
  decalScale: 1,
  stretch: 1,
  coverage: 1,
  flags: 0,
};
