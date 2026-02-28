export interface DecalColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Rotation {
  pitch: number;
  yaw: number;
  roll: number;
}

export interface DecalLayer {
  decalKey: string;
  color: DecalColor;
  position: Position;
  rotation: Rotation;
  decalScale: number;
  stretch: number;
  coverage: number;
  flags: number;
}

export interface DecalFile {
  decal: {
    decalLayers: DecalLayer[];
  };
}
