import {
  CAR_WIDTH,
  CAR_HEIGHT,
  CAR_GROUND_CLEARANCE,
  CAR_LENGTH,
  ARROW_LENGTH,
  ARROW_CONE_LENGTH,
  ARROW_CONE_RADIUS,
  ARROW_CONE_SEGMENTS,
} from '../constants'
import { Vec3, vec3, add, sub, scale, normalize, cross } from './math'
import type { DecalLayer } from '../../../types'

const DEG = Math.PI / 180
const CAR_CENTER_Y = CAR_GROUND_CLEARANCE + CAR_HEIGHT / 2  // 80
const UP: Vec3 = [0, 1, 0]
const CAR_CENTER: Vec3 = [0, CAR_CENTER_Y, 0]

// ---------------------------------------------------------------------------
// Car box — 12 triangles (6 faces × 2), interleaved xyz
// ---------------------------------------------------------------------------

export function buildCarBox(): Float32Array {
  const x0 = -CAR_WIDTH / 2,  x1 = CAR_WIDTH / 2
  const y0 =  CAR_GROUND_CLEARANCE, y1 = CAR_GROUND_CLEARANCE + CAR_HEIGHT
  const z0 = -CAR_LENGTH / 2, z1 = CAR_LENGTH / 2

  // 8 corners
  const c: Vec3[] = [
    [x0, y0, z0], // 0 left  bottom back
    [x1, y0, z0], // 1 right bottom back
    [x1, y1, z0], // 2 right top    back
    [x0, y1, z0], // 3 left  top    back
    [x0, y0, z1], // 4 left  bottom front
    [x1, y0, z1], // 5 right bottom front
    [x1, y1, z1], // 6 right top    front
    [x0, y1, z1], // 7 left  top    front
  ]

  // Two triangles per face, consistent winding
  const quads: [number, number, number, number][] = [
    [0, 3, 2, 1], // back   (z = z0)
    [4, 5, 6, 7], // front  (z = z1)
    [0, 4, 7, 3], // left   (x = x0)
    [1, 2, 6, 5], // right  (x = x1)
    [0, 1, 5, 4], // bottom (y = y0)
    [3, 7, 6, 2], // top    (y = y1)
  ]

  const verts: number[] = []
  for (const [a, b, d, e] of quads) {
    // Triangle 1: a, b, d
    verts.push(...c[a], ...c[b], ...c[d])
    // Triangle 2: a, d, e
    verts.push(...c[a], ...c[d], ...c[e])
  }
  return new Float32Array(verts)
}

// ---------------------------------------------------------------------------
// Arrow geometry — shaft line + cone triangles
// ---------------------------------------------------------------------------

export interface ArrowVerts {
  /** 2 endpoints (6 floats) for GL_LINES */
  lineVerts: Float32Array
  /** Lateral surface + base cap triangles for GL_TRIANGLES */
  coneVerts: Float32Array
}

export function buildArrow(origin: Vec3, tip: Vec3, dir: Vec3): ArrowVerts {
  // Where the shaft meets the cone base
  const coneBase = sub(tip, scale(dir, ARROW_CONE_LENGTH))

  // Shaft: origin → coneBase
  const lineVerts = new Float32Array([...origin, ...coneBase])

  // Two perpendicular axes for the cone base circle
  const arbitrary: Vec3 = Math.abs(dir[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
  const right = normalize(cross(dir, arbitrary))
  const up2   = normalize(cross(right, dir))

  const coneVerts: number[] = []
  for (let i = 0; i < ARROW_CONE_SEGMENTS; i++) {
    const a0 = (i       / ARROW_CONE_SEGMENTS) * Math.PI * 2
    const a1 = ((i + 1) / ARROW_CONE_SEGMENTS) * Math.PI * 2

    const p0 = add(coneBase, add(scale(right, Math.cos(a0) * ARROW_CONE_RADIUS), scale(up2, Math.sin(a0) * ARROW_CONE_RADIUS)))
    const p1 = add(coneBase, add(scale(right, Math.cos(a1) * ARROW_CONE_RADIUS), scale(up2, Math.sin(a1) * ARROW_CONE_RADIUS)))

    // Lateral surface: apex, p0, p1
    coneVerts.push(...tip, ...p0, ...p1)
    // Base cap: center, p1, p0 (reverse winding for inward-facing)
    coneVerts.push(...coneBase, ...p1, ...p0)
  }

  return { lineVerts, coneVerts: new Float32Array(coneVerts) }
}

// ---------------------------------------------------------------------------
// Arrow math — shared by geometry building and picking
// ---------------------------------------------------------------------------

export interface ArrowGeometry {
  origin: Vec3
  tip:    Vec3
  dir:    Vec3
}

export function computeArrowGeometry(layer: DecalLayer): ArrowGeometry {
  const yawRad  = layer.rotation.yaw   * DEG
  const dirHoriz = normalize(vec3(Math.sin(yawRad), 0, Math.cos(yawRad)))

  const localRight = normalize(cross(UP, dirHoriz))

  const pitchRad = layer.rotation.pitch * DEG
  const dir = normalize(
    add(scale(dirHoriz, Math.cos(pitchRad)), scale(UP, Math.sin(pitchRad)))
  )

  const positionOffset = add(
    scale(localRight, layer.position.x),
    scale(UP,         layer.position.y),
  )

  const tip    = add(CAR_CENTER, positionOffset)
  const origin = sub(tip, scale(dir, ARROW_LENGTH))

  return { origin, tip, dir }
}
