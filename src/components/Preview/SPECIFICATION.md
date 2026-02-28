# Preview Component Specification

## Purpose

A WebGL-based 3D preview panel mounted in the existing "Preview" tab (`App.tsx`).
It renders a transparent placeholder car box and a set of arrows representing each
decal layer's projection direction and position. No actual decal images are
projected; this is a directional/positional aid only.

---

## File Structure

```
src/components/Preview/
  Preview.tsx          — React component (canvas mount, toolbar)
  Preview.module.css   — scoped styles
  constants.ts         — car geometry and render constants
  webgl/
    scene.ts           — WebGL context management and render loop
    math.ts            — Vec3 / Mat4 utilities (no external library)
    geometry.ts        — box and arrow mesh builders
    shaders.ts         — GLSL shader source strings
```

No new npm dependencies. All 3D math and rendering is plain WebGL.

---

## Store Changes

Add `selectedLayerIndex: number | null` to the Zustand store (`src/store.ts`):

```ts
selectedLayerIndex: number | null   // null = no selection

setSelectedLayer: (index: number | null) => void
```

`setSelectedLayer` does **not** push to the undo stack.

---

## Coordinate System

| Axis | Meaning                           |
| ---- | --------------------------------- |
| +X   | Car's right side (passenger side) |
| +Y   | Up                                |
| +Z   | Car's front                       |

The car box is horizontally centered at the world origin.
Vertically it sits from `Y = CAR_GROUND_CLEARANCE` to `Y = CAR_GROUND_CLEARANCE + CAR_HEIGHT`.

```
car_center = (0, CAR_GROUND_CLEARANCE + CAR_HEIGHT / 2, 0)
           = (0, 80, 0)  with default constants
```

---

## Arrow Math

### Direction Vector (from yaw + pitch)

Yaw is measured **clockwise from above**, where 0 = projecting from back toward front.

```
yaw_rad = yaw × (π / 180)

dir_horizontal = vec3(sin(yaw_rad), 0, cos(yaw_rad))
```

Verification:

- yaw=0 → (0, 0, 1) — from back, shooting toward front ✓
- yaw=90 → (1, 0, 0) — from left side, shooting rightward ✓
- yaw=180 → (0, 0, −1) — from front, shooting toward back ✓
- yaw=270 → (−1, 0, 0) — from right side, shooting leftward ✓

Apply pitch (rotation around the local right axis):

```
local_right = normalize(vec3(0,1,0) × dir_horizontal)   // (up × forward)

pitch_rad = pitch × (π / 180)

dir = cos(pitch_rad) × dir_horizontal + sin(pitch_rad) × vec3(0,1,0)
```

Verification:

- pitch=0 → dir = dir_horizontal (flat, parallel to ground) ✓
- pitch=−45 → negative Y component → arrow tilts downward (from above) ✓
- pitch=+45 → positive Y component → arrow tilts upward (from below) ✓

### Position Offset

`position.x` and `position.y` shift the arrow origin in the **projection's local
frame**, not world space. `position.x` is right relative to the projection
direction; `position.y` is world up.

```
local_right = normalize(vec3(0,1,0) × dir_horizontal)   // same as above, XZ-plane only

position_offset = position.x × local_right + position.y × vec3(0,1,0)
```

> Note: `local_right` for the position offset uses `dir_horizontal` (ignoring
> pitch) so that position shifts are always horizontal/vertical, not tilted with
> the pitch angle. This matches the game's projection semantics.

### Arrow Origin and Tip

```
tip    = car_center + position_offset
origin = tip − dir × ARROW_LENGTH
```

The arrowhead is at `tip`; the tail is at `origin`. With `position = (0,0)` the
tip is exactly at `car_center` and the arrow points directly toward it.

---

## Constants (`constants.ts`)

```ts
// Car geometry (world units)
export const CAR_LENGTH = 500;
export const CAR_WIDTH = 140;
export const CAR_HEIGHT = 100;
export const CAR_GROUND_CLEARANCE = 30;

// Arrow rendering
export const ARROW_LENGTH = 250; // half car length
export const ARROW_CONE_LENGTH = 20; // length of arrowhead cone
export const ARROW_CONE_RADIUS = 8; // radius of arrowhead base
export const ARROW_CONE_SEGMENTS = 8; // polygons around the cone

// Opacity
export const ARROW_OPACITY_ACTIVE = 1.0;
export const ARROW_OPACITY_DIMMED = 0.08; // non-selected in "all" mode
export const CAR_BOX_OPACITY = 0.25;
```

---

## Geometry

### Car Box

A solid rectangular box (6 faces, 12 triangles) using the car dimensions.
Rendered with alpha blending at `CAR_BOX_OPACITY`. Depth writes are **disabled**
for the box so arrows behind it remain visible. Color: medium gray, e.g. `(0.5, 0.5, 0.5)`.

### Arrows

Each arrow consists of:

1. **Shaft** — a single GL line from `origin` to `(tip − dir × ARROW_CONE_LENGTH)`
2. **Cone** — a closed cone mesh (`ARROW_CONE_SEGMENTS` triangles for the lateral
   surface + `ARROW_CONE_SEGMENTS` triangles for the base cap), tip at `tip`,
   base centered at `tip − dir × ARROW_CONE_LENGTH`.

Color: white `(1, 1, 1)`. Opacity is controlled per-arrow via a uniform.

---

## WebGL Scene Setup (`scene.ts`)

- Single WebGL 1.0 context (broad device compatibility).
- One shader program is sufficient; opacity is passed as a `u_opacity` uniform.
- Depth testing enabled (`LEQUAL`).
- Blending enabled (`SRC_ALPHA`, `ONE_MINUS_SRC_ALPHA`).
- Render order each frame:
  1. Clear color + depth buffer.
  2. Draw car box (depth write off).
  3. Re-enable depth write.
  4. Draw all arrows, sorted back-to-front from the camera (painters algorithm,
     using arrow origin distance).

### Per-frame Update

The scene re-renders whenever:

- Camera orbit state changes (mouse drag / wheel).
- Layer data changes (new import, layer edit).
- `selectedLayerIndex` changes.
- "Show all / selected" toggle changes.

Use a `requestAnimationFrame` loop that only submits draw calls when a dirty flag
is set, to avoid burning CPU when idle.

---

## Camera

- **Projection**: perspective, FOV 60°, near=1, far=5000.
- **Target**: always `car_center = (0, 80, 0)`.
- **Initial position**: azimuth=−135°, elevation=30°, distance=800 units
  (rear-right quarter view, slightly elevated).
- **Orbit**: left-mouse-drag changes azimuth and elevation.
  - Elevation clamped to [−80°, 80°] to avoid gimbal flip.
- **Zoom**: mouse wheel adjusts distance, clamped to [200, 2000].
- **No panning**.

Camera world position from spherical coordinates:

```
cam.x = target.x + distance × cos(elevation) × sin(azimuth)
cam.y = target.y + distance × sin(elevation)
cam.z = target.z + distance × cos(elevation) × cos(azimuth)
```

---

## Interaction

### Visibility Toggle

A toolbar above the canvas (rendered in JSX, not WebGL) contains a toggle:

- **"All layers"** — all arrows rendered; non-selected arrows use `ARROW_OPACITY_DIMMED`.
- **"Selected only"** — only the arrow for `selectedLayerIndex` is rendered at full
  opacity; others are hidden entirely. If `selectedLayerIndex` is null, no arrows
  are shown.

Default state: **All layers**.

### Click-to-Select (Arrow Picking)

On mouse click (no drag occurred):

1. Compute the world-space ray from the camera through the clicked pixel using the
   inverse of the view-projection matrix.
2. For each arrow, compute the **minimum distance from the ray to the arrow's line
   segment** (shaft only; skip cone for simplicity).
3. Select the arrow with the smallest ray-segment distance, provided that distance
   is below a pick threshold (e.g. `15` world units).
4. Call `setSelectedLayer(index)` with the winning index, or `setSelectedLayer(null)`
   if no arrow is within threshold.

Picking operates on **visible** arrows only (respects the "show all / selected"
toggle).

---

## React Component (`Preview.tsx`)

```tsx
export function Preview() {
  const layers = useStore((s) => s.layers);
  const selectedLayerIndex = useStore((s) => s.selectedLayerIndex);
  const setSelectedLayer = useStore((s) => s.setSelectedLayer);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);

  const [showMode, setShowMode] = useState<"all" | "selected">("all");

  // Init WebGL once on mount
  useEffect(() => {
    if (!canvasRef.current) return;
    sceneRef.current = initScene(canvasRef.current, {
      onSelect: setSelectedLayer,
    });
    return () => sceneRef.current?.destroy();
  }, []);

  // Sync data to scene whenever it changes
  useEffect(() => {
    sceneRef.current?.update({ layers, selectedLayerIndex, showMode });
  }, [layers, selectedLayerIndex, showMode]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        {/* Toggle: All layers / Selected only */}
        {/* Uses React Spectrum ToggleButton or similar */}
      </div>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
```

The canvas fills all available space in the tab panel. A `ResizeObserver` in
`scene.ts` updates the WebGL viewport and re-renders on container size changes.

---

## Out of Scope (this iteration)

- `coverage`, `stretch`, and `roll` fields — ignored for now, to be added later.
- Actual car 3D models.
- Actual decal image projection.
- Multiple vehicle support.
