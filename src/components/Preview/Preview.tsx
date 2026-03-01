import { useEffect, useRef, useState } from "react";
import { ToggleButton } from "@react-spectrum/s2";
import { useDecalStore } from "../../store";
import { initScene } from "./webgl/scene";
import type { SceneHandle } from "./webgl/scene";
import styles from "./Preview.module.css";

export function Preview() {
  const { layers, selectedLayerIndex } = useDecalStore((s) => ({
    layers: s.layers,
    selectedLayerIndex: s.selectedLayerIndex,
  }));
  const { setSelectedLayer } = useDecalStore((s) => s.actions);

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
        <ToggleButton
          isSelected={showMode === "all"}
          onChange={(sel) => {
            if (sel) setShowMode("all");
          }}
        >
          All layers
        </ToggleButton>
        <ToggleButton
          isSelected={showMode === "selected"}
          onChange={(sel) => {
            if (sel) setShowMode("selected");
          }}
        >
          Selected only
        </ToggleButton>
      </div>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
