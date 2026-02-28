import { useEffect, useRef, useState } from "react";
import { ToggleButton } from "@adobe/react-spectrum";
import { useStore } from "../../store";
import { initScene } from "./webgl/scene";
import type { SceneHandle } from "./webgl/scene";
import styles from "./Preview.module.css";

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
