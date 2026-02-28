import { useRef, useState, useMemo } from "react";
import { Button } from "@react-spectrum/s2";
import { useStore } from "../store";
import { LayerCard } from "./LayerCard";
import styles from "./LayerList.module.css";

export function LayerList() {
  const layers = useStore((s) => s.layers);
  const addLayer = useStore((s) => s.addLayer);
  const reorderLayers = useStore((s) => s.reorderLayers);

  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const uniqueKeys = useMemo(() => {
    const keys = new Set(layers.map((l) => l.decalKey).filter(Boolean));
    return Array.from(keys).sort();
  }, [layers]);

  function handleDrop(targetIndex: number) {
    const from = dragIndexRef.current;
    if (from !== null && from !== targetIndex) {
      reorderLayers(from, targetIndex);
    }
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  if (layers.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No layers loaded. Import a decal JSON file to get started.</p>
        <Button variant="secondary" onPress={addLayer}>
          Add Layer
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {layers.map((_, i) => (
        <div
          key={i}
          className={styles.layerWrapper}
          data-drag-over={dragOverIndex === i || undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverIndex(i);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOverIndex(null);
            }
          }}
          onDrop={() => handleDrop(i)}
        >
          <div
            draggable
            onDragStart={() => {
              dragIndexRef.current = i;
            }}
            onDragEnd={() => {
              dragIndexRef.current = null;
              setDragOverIndex(null);
            }}
            className={styles.dragHandle}
            title="Drag to reorder"
          >
            ⠿
          </div>
          <LayerCard index={i} uniqueKeys={uniqueKeys} />
        </div>
      ))}
      <Button variant="secondary" onPress={addLayer} width="100%">
        Add Layer
      </Button>
    </div>
  );
}
