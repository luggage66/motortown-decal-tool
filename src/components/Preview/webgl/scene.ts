import type { DecalLayer } from "../../../types";
import {
  ARROW_OPACITY_ACTIVE,
  ARROW_OPACITY_DIMMED,
  CAR_BOX_OPACITY,
  CAR_WIREFRAME_OPACITY,
  ARROW_CONE_LENGTH,
} from "../constants";
import {
  Vec3,
  sub,
  scale,
  normalize,
  dot,
  multiply,
  perspective,
  lookAt,
  invert,
} from "./math";
import { VERT_SRC, FRAG_SRC, compileProgram } from "./shaders";
import {
  buildCarBox,
  buildArrow,
  buildCarBoxWireframe,
  computeArrowGeometry,
} from "./geometry";

const DEG = Math.PI / 180;
const PICK_THRESHOLD = 15;

export interface SceneState {
  layers: DecalLayer[];
  selectedLayerIndex: number | null;
  showMode: "all" | "selected";
}

export interface SceneHandle {
  update(state: SceneState): void;
  destroy(): void;
}

interface ArrowCache {
  lineVbo: WebGLBuffer;
  coneVbo: WebGLBuffer;
  lineCount: number;
  coneCount: number;
  origin: Vec3;
  tip: Vec3;
  dir: Vec3;
}

export function initScene(
  canvas: HTMLCanvasElement,
  opts: { onSelect: (index: number | null) => void },
): SceneHandle {
  const gl = canvas.getContext("webgl", { antialias: true, alpha: true })!;
  if (!gl) throw new Error("WebGL not supported");

  // -------------------------------------------------------------------------
  // Shader program
  // -------------------------------------------------------------------------

  const program = compileProgram(gl, VERT_SRC, FRAG_SRC);
  const aPosition = gl.getAttribLocation(program, "a_position");
  const uMvp = gl.getUniformLocation(program, "u_mvp");
  const uColor = gl.getUniformLocation(program, "u_color");
  const uOpacity = gl.getUniformLocation(program, "u_opacity");

  // -------------------------------------------------------------------------
  // Static car box VBO
  // -------------------------------------------------------------------------

  const carBoxData = buildCarBox();
  const carBoxVbo = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, carBoxVbo);
  gl.bufferData(gl.ARRAY_BUFFER, carBoxData, gl.STATIC_DRAW);

  const carFaces = buildCarBoxWireframe();
  const carFaceVbos = carFaces.map((face) => {
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, face.lineVerts, gl.STATIC_DRAW);
    return vbo;
  });

  // -------------------------------------------------------------------------
  // GL state
  // -------------------------------------------------------------------------

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // -------------------------------------------------------------------------
  // Viewport / ResizeObserver
  // -------------------------------------------------------------------------

  let viewWidth = Math.max(1, canvas.clientWidth || canvas.width);
  let viewHeight = Math.max(1, canvas.clientHeight || canvas.height);
  canvas.width = viewWidth;
  canvas.height = viewHeight;
  gl.viewport(0, 0, viewWidth, viewHeight);

  const parent = canvas.parentElement ?? canvas;
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = Math.max(1, Math.round(entry.contentRect.width));
      const h = Math.max(1, Math.round(entry.contentRect.height));
      canvas.width = w;
      canvas.height = h;
      viewWidth = w;
      viewHeight = h;
      gl.viewport(0, 0, w, h);
      dirty = true;
    }
  });
  resizeObserver.observe(parent);

  // -------------------------------------------------------------------------
  // Camera state
  // -------------------------------------------------------------------------

  let azimuth = -135 * DEG;
  let elevation = 30 * DEG;
  let distance = 800;
  const target: Vec3 = [0, 80, 0];

  function cameraEye(): Vec3 {
    return [
      target[0] + distance * Math.cos(elevation) * Math.sin(azimuth),
      target[1] + distance * Math.sin(elevation),
      target[2] + distance * Math.cos(elevation) * Math.cos(azimuth),
    ];
  }

  // -------------------------------------------------------------------------
  // Scene state & arrow cache
  // -------------------------------------------------------------------------

  let state: SceneState = {
    layers: [],
    selectedLayerIndex: null,
    showMode: "all",
  };
  let dirty = true;

  let arrowCache: ArrowCache[] = [];
  let lastLayersRef: DecalLayer[] | null = null;

  function rebuildArrows() {
    for (const c of arrowCache) {
      gl.deleteBuffer(c.lineVbo);
      gl.deleteBuffer(c.coneVbo);
    }
    arrowCache = state.layers.map((layer) => {
      const { origin, tip, dir } = computeArrowGeometry(layer);
      const { lineVerts, coneVerts } = buildArrow(origin, tip, dir);

      const lineVbo = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, lineVbo);
      gl.bufferData(gl.ARRAY_BUFFER, lineVerts, gl.DYNAMIC_DRAW);

      const coneVbo = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, coneVbo);
      gl.bufferData(gl.ARRAY_BUFFER, coneVerts, gl.DYNAMIC_DRAW);

      return {
        lineVbo,
        coneVbo,
        lineCount: lineVerts.length / 3,
        coneCount: coneVerts.length / 3,
        origin,
        tip,
        dir,
      };
    });
    lastLayersRef = state.layers;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  function getArrowOpacity(index: number): number {
    const { selectedLayerIndex, showMode } = state;
    if (showMode === "all") {
      return selectedLayerIndex === null || index === selectedLayerIndex
        ? ARROW_OPACITY_ACTIVE
        : ARROW_OPACITY_DIMMED;
    }
    // 'selected': only the selected arrow, or nothing
    return index === selectedLayerIndex ? ARROW_OPACITY_ACTIVE : 0;
  }

  function render() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const eye = cameraEye();
    const aspect = viewWidth / viewHeight;
    const proj = perspective(60 * DEG, aspect, 1, 5000);
    const view = lookAt(eye, target, [0, 1, 0]);
    const vp = multiply(proj, view);

    gl.useProgram(program);
    gl.uniformMatrix4fv(uMvp, false, vp);
    gl.enableVertexAttribArray(aPosition);

    // 1. Car box + wireframe — depth write off so arrows behind it stay visible
    gl.depthMask(false);

    // solid fill
    gl.uniform3f(uColor, 0.5, 0.5, 0.5);
    gl.uniform1f(uOpacity, CAR_BOX_OPACITY);
    gl.bindBuffer(gl.ARRAY_BUFFER, carBoxVbo);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, carBoxData.length / 3);

    // wireframe — visible faces only
    gl.uniform3f(uColor, 1, 1, 1);
    gl.uniform1f(uOpacity, CAR_WIREFRAME_OPACITY);
    for (let i = 0; i < carFaces.length; i++) {
      if (dot(carFaces[i].normal, sub(eye, carFaces[i].planePoint)) <= 0)
        continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, carFaceVbos[i]);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINES, 0, 8); // 4 edges × 2 endpoints
    }

    gl.depthMask(true);

    // 2. Rebuild arrow VBOs if layer array changed
    if (state.layers !== lastLayersRef) rebuildArrows();

    // 3. Sort back-to-front by origin distance from camera
    const order = arrowCache
      .map((c, i) => ({ i, d: distSq(c.origin, eye) }))
      .sort((a, b) => b.d - a.d)
      .map((x) => x.i);

    // 4. Draw arrows
    gl.uniform3f(uColor, 1, 1, 1);
    for (const i of order) {
      const opacity = getArrowOpacity(i);
      if (opacity === 0) continue;

      gl.uniform1f(uOpacity, opacity);
      const c = arrowCache[i];

      gl.bindBuffer(gl.ARRAY_BUFFER, c.lineVbo);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINES, 0, c.lineCount);

      gl.bindBuffer(gl.ARRAY_BUFFER, c.coneVbo);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, c.coneCount);
    }

    gl.disableVertexAttribArray(aPosition);
  }

  // -------------------------------------------------------------------------
  // Mouse orbit
  // -------------------------------------------------------------------------

  let isDragging = false;
  let startX = 0,
    startY = 0;
  let lastX = 0,
    lastY = 0;

  function onMouseDown(e: MouseEvent) {
    isDragging = true;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    azimuth += dx * 0.5 * DEG;
    elevation -= dy * 0.5 * DEG;
    elevation = Math.max(-80 * DEG, Math.min(80 * DEG, elevation));
    dirty = true;
  }

  function onMouseUp(e: MouseEvent) {
    const totalDist = Math.hypot(e.clientX - startX, e.clientY - startY);
    isDragging = false;
    if (totalDist < 4) handleClick(e);
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const sign = e.deltaY > 0 ? 1 : -1;
    distance = Math.max(200, Math.min(2000, distance * Math.pow(1.1, sign)));
    dirty = true;
  }

  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // -------------------------------------------------------------------------
  // Picking
  // -------------------------------------------------------------------------

  function handleClick(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / viewWidth) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / viewHeight) * 2 + 1;

    const eye = cameraEye();
    const proj = perspective(60 * DEG, viewWidth / viewHeight, 1, 5000);
    const view = lookAt(eye, target, [0, 1, 0]);
    const vpInv = invert(multiply(proj, view));
    if (!vpInv) return;

    const near = unproject(ndcX, ndcY, -1, vpInv);
    const far = unproject(ndcX, ndcY, 1, vpInv);
    const rayDir = normalize(sub(far, near));
    const rayOrigin = near;

    let bestIndex: number | null = null;
    let bestDist = PICK_THRESHOLD;

    for (let i = 0; i < arrowCache.length; i++) {
      if (getArrowOpacity(i) === 0) continue;
      const { origin, tip, dir } = arrowCache[i];
      const shaftEnd = sub(tip, scale(dir, ARROW_CONE_LENGTH));
      const d = rayToSegmentDist(rayOrigin, rayDir, origin, shaftEnd);
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }

    opts.onSelect(bestIndex);
  }

  /** Transform a clip-space point (w=1) through an inverse VP matrix, divide by w. */
  function unproject(
    nx: number,
    ny: number,
    nz: number,
    m: Float32Array,
  ): Vec3 {
    const rx = m[0] * nx + m[4] * ny + m[8] * nz + m[12];
    const ry = m[1] * nx + m[5] * ny + m[9] * nz + m[13];
    const rz = m[2] * nx + m[6] * ny + m[10] * nz + m[14];
    const rw = m[3] * nx + m[7] * ny + m[11] * nz + m[15];
    return [rx / rw, ry / rw, rz / rw];
  }

  /** Minimum distance from ray (O + t·D, t≥0) to segment (A→B, 0≤s≤1). */
  function rayToSegmentDist(O: Vec3, D: Vec3, A: Vec3, B: Vec3): number {
    const V = sub(B, A);
    const W = sub(O, A);
    const dd = dot(D, D);
    const vv = dot(V, V);
    const dv = dot(D, V);
    const dw = dot(D, W);
    const vw = dot(V, W);
    const denom = dd * vv - dv * dv;

    let t: number, s: number;
    if (Math.abs(denom) < 1e-10) {
      // Parallel lines
      t = 0;
      s = vv > 0 ? Math.max(0, Math.min(1, vw / vv)) : 0;
    } else {
      t = Math.max(0, (dv * vw - vv * dw) / denom);
      s = Math.max(0, Math.min(1, (dd * vw - dv * dw) / denom));
    }

    const px = O[0] + t * D[0],
      qx = A[0] + s * V[0];
    const py = O[1] + t * D[1],
      qy = A[1] + s * V[1];
    const pz = O[2] + t * D[2],
      qz = A[2] + s * V[2];
    return Math.sqrt((px - qx) ** 2 + (py - qy) ** 2 + (pz - qz) ** 2);
  }

  // -------------------------------------------------------------------------
  // rAF loop
  // -------------------------------------------------------------------------

  let rafId: number;
  function frame() {
    if (dirty) {
      render();
      dirty = false;
    }
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  // -------------------------------------------------------------------------
  // Public handle
  // -------------------------------------------------------------------------

  return {
    update(newState: SceneState) {
      state = newState;
      dirty = true;
    },
    destroy() {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      resizeObserver.disconnect();
      for (const c of arrowCache) {
        gl.deleteBuffer(c.lineVbo);
        gl.deleteBuffer(c.coneVbo);
      }
      for (const vbo of carFaceVbos) gl.deleteBuffer(vbo);
      gl.deleteBuffer(carBoxVbo);
      gl.deleteProgram(program);
    },
  };
}

function distSq(a: Vec3, b: Vec3): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}
