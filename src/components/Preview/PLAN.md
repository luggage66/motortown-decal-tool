# Preview Component Implementation Plan

## Overview

Implement the WebGL-based 3D preview panel described in SPECIFICATION.md. The
component lives in `src/components/Preview/` and plugs into the existing
"Preview" tab in `App.tsx`. No new npm dependencies are required.

---

## Step 1 — Store changes (`src/store.ts`)

Add `selectedLayerIndex` and `setSelectedLayer` to `DecalState`:

```ts
selectedLayerIndex: number | null
setSelectedLayer: (index: number | null) => void
```

`setSelectedLayer` calls `set({ selectedLayerIndex: index })` only — no undo
push, no `isDirty` change. This is a UI-only selection, not an edit.

---

## Step 2 — Constants (`constants.ts`)

Create `src/components/Preview/constants.ts` with all geometry and render
constants from the spec:

```ts
export const CAR_LENGTH = 500;
export const CAR_WIDTH = 140;
export const CAR_HEIGHT = 100;
export const CAR_GROUND_CLEARANCE = 30;

export const ARROW_LENGTH = 250;
export const ARROW_CONE_LENGTH = 20;
export const ARROW_CONE_RADIUS = 8;
export const ARROW_CONE_SEGMENTS = 8;

export const ARROW_OPACITY_ACTIVE = 1.0;
export const ARROW_OPACITY_DIMMED = 0.08;
export const CAR_BOX_OPACITY = 0.25;
```

Derived constants (computed once, not exported):

```ts
const CAR_CENTER_Y = CAR_GROUND_CLEARANCE + CAR_HEIGHT / 2; // 80
```

---

## Step 3 — Math utilities (`webgl/math.ts`)

Minimal Vec3/Mat4 library. Only what the scene actually needs:

**Vec3 operations**

- `vec3(x, y, z)` — typed array or plain object, whichever is simplest
- `add`, `sub`, `scale`, `normalize`, `dot`, `cross`, `length`

**Mat4 operations**

- `identity()`, `multiply(a, b)`
- `perspective(fovY, aspect, near, far)`
- `lookAt(eye, target, up)`
- `invert(m)` — needed for ray-casting (picking)

All functions return new values; no mutation. Plain `Float32Array` or simple
`number[]` tuples are fine — no class hierarchy needed.

---

## Step 4 — GLSL shaders (`webgl/shaders.ts`)

Single shader program handles both the car box and arrows. Uniforms:

- `u_mvp` — `mat4` model-view-projection
- `u_color` — `vec3` base color
- `u_opacity` — `float`

```glsl
// vertex shader
attribute vec3 a_position;
uniform mat4 u_mvp;
void main() {
  gl_Position = u_mvp * vec4(a_position, 1.0);
}

// fragment shader
precision mediump float;
uniform vec3 u_color;
uniform float u_opacity;
void main() {
  gl_FragColor = vec4(u_color, u_opacity);
}
```

Export source strings as `VERT_SRC` and `FRAG_SRC`. Include a helper
`compileProgram(gl, vertSrc, fragSrc)` that compiles/links and throws a
descriptive error on failure.

---

## Step 5 — Geometry builders (`webgl/geometry.ts`)

### `buildCarBox(): Float32Array`

Returns interleaved vertex positions (x, y, z) for 12 triangles (6 faces × 2
triangles each). Vertices derived from:

```
min = (-CAR_WIDTH/2, CAR_GROUND_CLEARANCE, -CAR_LENGTH/2)
max = ( CAR_WIDTH/2, CAR_GROUND_CLEARANCE + CAR_HEIGHT, CAR_LENGTH/2)
```

### `buildArrow(origin, tip, dir): { lineVerts, coneVerts }`

- `lineVerts` — two points: `origin` → `tip - dir * ARROW_CONE_LENGTH` (for
  `GL_LINES`)
- `coneVerts` — lateral surface triangles + base cap triangles, computed from
  `ARROW_CONE_SEGMENTS`, `ARROW_CONE_RADIUS`, `ARROW_CONE_LENGTH`

**Arrow math** (from spec):

```
yaw_rad  = yaw * π/180
dir_horiz = normalize(sin(yaw_rad), 0, cos(yaw_rad))
local_right = normalize(up × dir_horiz)
pitch_rad = pitch * π/180
dir = cos(pitch_rad)*dir_horiz + sin(pitch_rad)*up

position_offset = position.x * local_right + position.y * up
tip    = car_center + position_offset
origin = tip - dir * ARROW_LENGTH
```

Expose a helper `computeArrowGeometry(layer: DecalLayer)` that returns `{
origin, tip, dir }` — used by both geometry building and picking.

---

## Step 6 — Scene manager (`webgl/scene.ts`)

### Public interface

```ts
export interface SceneState {
  layers: DecalLayer[];
  selectedLayerIndex: number | null;
  showMode: "all" | "selected";
}

export interface SceneHandle {
  update(state: SceneState): void;
  destroy(): void;
}

export function initScene(
  canvas: HTMLCanvasElement,
  opts: { onSelect: (index: number | null) => void },
): SceneHandle;
```

### Internals

**Initialization** (runs once):

1. Get `WebGLRenderingContext` with `{ antialias: true, alpha: true }`.
2. Compile shader program (`compileProgram`).
3. Cache uniform/attribute locations.
4. Build and upload car box geometry to a static VBO (never changes).
5. Set GL state: `enable(DEPTH_TEST)`, `depthFunc(LEQUAL)`,
   `enable(BLEND)`, `blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)`.
6. Attach `ResizeObserver` on the canvas's parent to call `gl.viewport` and
   set `dirty = true`.
7. Attach mouse event listeners for orbit (mousedown/mousemove/mouseup),
   wheel (zoom), and click (picking).
8. Start `requestAnimationFrame` loop.

**Camera state**:

```ts
let azimuth = -135 * DEG; // degrees converted to radians
let elevation = 30 * DEG;
let distance = 800;
const target = [0, 80, 0];
```

**rAF loop**:

```
function frame() {
  if (dirty) {
    render()
    dirty = false
  }
  rafId = requestAnimationFrame(frame)
}
```

**Render sequence**:

1. Clear color + depth.
2. Compute view and projection matrices via `lookAt` and `perspective`.
3. Upload `u_mvp = projection * view`.
4. Draw car box:
   - `depthMask(false)`, color gray, `u_opacity = CAR_BOX_OPACITY`.
   - `drawArrays(TRIANGLES, ...)`.
   - `depthMask(true)`.
5. Rebuild arrow geometry from current `layers` (only when `layers` reference
   changed — cache with a ref).
6. Sort arrows back-to-front by distance from camera (using `origin`).
7. For each arrow (sorted):
   - Determine opacity: active = `ARROW_OPACITY_ACTIVE`, dimmed =
     `ARROW_OPACITY_DIMMED`, hidden = skip draw.
   - Draw shaft as `GL_LINES`.
   - Draw cone as `TRIANGLES`.

**Orbit controls** (mouse):

- `mousedown` → record `startX, startY`, set `isDragging = true`.
- `mousemove` → if dragging: `azimuth += dx * 0.5°`, `elevation -= dy * 0.5°`
  (clamp elevation to [−80°, 80°]); set `dirty`.
- `mouseup` → if total drag distance < 4px, treat as click; set `isDragging = false`.
- `wheel` → `distance = clamp(distance * 1.1^sign, 200, 2000)`; set `dirty`.

**Picking** (on click):

1. Compute NDC of click position.
2. Reconstruct world-space ray using `invert(projection * view)`.
3. For each visible arrow, compute ray-to-segment minimum distance
   (shaft segment only).
4. If closest distance < 15 world units → call `onSelect(index)`.
5. Else → call `onSelect(null)`.

**`update(state)`**: Store new state, set `dirty = true`.

**`destroy()`**: Cancel rAF, remove event listeners, disconnect ResizeObserver.

---

## Step 7 — React component (`Preview.tsx`)

Matches the spec skeleton. Uses React Spectrum `ToggleButtonGroup` (or two
`ToggleButton` elements) for the All / Selected toggle in the toolbar.

```tsx
import { ToggleButton } from "@adobe/react-spectrum";
```

Canvas gets `width` / `height` set by the ResizeObserver inside `scene.ts`
(the canvas element itself; CSS makes the container fill available space).

---

## Step 8 — CSS (`Preview.module.css`)

```css
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--spectrum-global-color-gray-200);
}
.canvas {
  flex: 1;
  display: block;
  width: 100%;
  height: 100%;
}
```

---

## Step 9 — Wire up in `App.tsx`

Replace the placeholder div in the Preview tab panel:

```tsx
import { Preview } from "./components/Preview/Preview";
// ...
<Item key="preview">
  <Preview />
</Item>;
```

---

## Implementation Order

1. `src/store.ts` — add `selectedLayerIndex` / `setSelectedLayer`
2. `src/components/Preview/constants.ts`
3. `src/components/Preview/webgl/math.ts`
4. `src/components/Preview/webgl/shaders.ts`
5. `src/components/Preview/webgl/geometry.ts`
6. `src/components/Preview/webgl/scene.ts`
7. `src/components/Preview/Preview.tsx`
8. `src/components/Preview/Preview.module.css`
9. `src/App.tsx` — swap placeholder for `<Preview />`

Each step is independently testable in the browser (dev server). Steps 3–6
contain no React and can be verified with `console.log` before the component
exists.

---

## Key Decisions & Risks

| Topic                      | Decision                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| WebGL version              | WebGL 1.0 for broadest compatibility                                     |
| Math library               | Hand-rolled in `math.ts` — spec requires no external deps                |
| Arrow geometry upload      | Rebuild VBO each frame when layers change (simple; layer count is small) |
| Picking accuracy           | Ray-to-segment distance on shaft only; cone ignored                      |
| Canvas sizing              | ResizeObserver sets `canvas.width/height` to match CSS pixel size        |
| `depthMask(false)` for box | Allows arrows behind the car to remain visible                           |
| `selectedLayerIndex`       | UI-only store field; no undo stack impact                                |
