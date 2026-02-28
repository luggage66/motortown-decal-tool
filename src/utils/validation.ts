import type { DecalLayer } from "../types";
import { MAX_LAYERS } from "../constants";

export type ValidationResult =
  | { ok: true; layers: DecalLayer[] }
  | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && !Number.isNaN(v);
}

function validateColor(color: unknown, path: string): string | null {
  if (!isObject(color)) return `${path} must be an object`;
  for (const ch of ["r", "g", "b", "a"] as const) {
    const val = color[ch];
    if (!isNumber(val)) return `${path}.${ch} must be a number`;
    if (val < 0 || val > 255) return `${path}.${ch} must be between 0 and 255`;
  }
  return null;
}

function validatePosition(pos: unknown, path: string): string | null {
  if (!isObject(pos)) return `${path} must be an object`;
  for (const ch of ["x", "y"] as const) {
    if (!isNumber(pos[ch])) return `${path}.${ch} must be a number`;
  }
  return null;
}

function validateRotation(rot: unknown, path: string): string | null {
  if (!isObject(rot)) return `${path} must be an object`;
  for (const ch of ["pitch", "yaw", "roll"] as const) {
    if (!isNumber(rot[ch])) return `${path}.${ch} must be a number`;
  }
  return null;
}

function validateLayer(layer: unknown, index: number): string | null {
  const path = `decalLayers[${index}]`;
  if (!isObject(layer)) return `${path} must be an object`;

  if (typeof layer.decalKey !== "string")
    return `${path}.decalKey must be a string`;

  const colorErr = validateColor(layer.color, `${path}.color`);
  if (colorErr) return colorErr;

  const posErr = validatePosition(layer.position, `${path}.position`);
  if (posErr) return posErr;

  const rotErr = validateRotation(layer.rotation, `${path}.rotation`);
  if (rotErr) return rotErr;

  if (!isNumber(layer.decalScale)) return `${path}.decalScale must be a number`;
  if (!isNumber(layer.stretch)) return `${path}.stretch must be a number`;
  if (!isNumber(layer.coverage)) return `${path}.coverage must be a number`;
  if (!Number.isInteger(layer.flags)) return `${path}.flags must be an integer`;

  return null;
}

export function validateDecalJson(input: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, error: "Invalid JSON: unable to parse." };
  }

  if (!isObject(parsed)) {
    return { ok: false, error: "JSON root must be an object." };
  }

  const decal = parsed.decal;
  if (!isObject(decal)) {
    return { ok: false, error: 'Missing "decal" object at root.' };
  }

  const layers = decal.decalLayers;
  if (!Array.isArray(layers)) {
    return { ok: false, error: 'Missing "decal.decalLayers" array.' };
  }

  if (layers.length > MAX_LAYERS) {
    return {
      ok: false,
      error: `Too many layers: ${layers.length} exceeds the maximum of ${MAX_LAYERS}.`,
    };
  }

  for (let i = 0; i < layers.length; i++) {
    const err = validateLayer(layers[i], i);
    if (err) return { ok: false, error: err };
  }

  return { ok: true, layers: layers as DecalLayer[] };
}
