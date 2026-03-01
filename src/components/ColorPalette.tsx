import { useMemo, useRef, useState } from "react";
import { useDecalStore } from "../store";
import type { DecalColor } from "../types";
import { ColorSwatch } from "./ColorSwatch";
import { ColorPicker } from "./ColorPicker";
import styles from "./ColorPalette.module.css";
import pickerStyles from "./ColorPicker.module.css";

function colorKey(c: DecalColor): string {
  return `${c.r},${c.g},${c.b},${c.a}`;
}

interface UniqueColor {
  color: DecalColor;
  count: number;
}

export function ColorPalette() {
  const layers = useDecalStore((s) => s.layers);
  const { bulkReplaceColor } = useDecalStore((s) => s.actions);
  const [editingColor, setEditingColor] = useState<DecalColor | null>(null);
  const originalColorRef = useRef<DecalColor | null>(null);

  const uniqueColors = useMemo(() => {
    const map = new Map<string, UniqueColor>();
    for (const layer of layers) {
      const key = colorKey(layer.color);
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, { color: { ...layer.color }, count: 1 });
      }
    }
    return Array.from(map.values());
  }, [layers]);

  const handleSwatchClick = (color: DecalColor) => {
    originalColorRef.current = { ...color };
    setEditingColor({ ...color });
  };

  const handleColorChange = (newColor: DecalColor) => {
    if (!originalColorRef.current) return;
    bulkReplaceColor(originalColorRef.current, newColor);
    originalColorRef.current = { ...newColor };
    setEditingColor({ ...newColor });
  };

  const closeEditor = () => {
    setEditingColor(null);
    originalColorRef.current = null;
  };

  if (layers.length === 0) return null;

  return (
    <div>
      <h2 className={styles.sectionTitle}>
        Palette{" "}
        <span className={styles.sectionCount}>({uniqueColors.length})</span>
      </h2>
      <div className={styles.grid}>
        {uniqueColors.map((uc) => {
          const key = colorKey(uc.color);
          const isEditing =
            editingColor !== null && colorKey(editingColor) === key;

          return (
            <div
              key={key}
              className={styles.item}
              style={{ position: "relative" }}
            >
              <ColorSwatch
                color={uc.color}
                size={28}
                onClick={() => handleSwatchClick(uc.color)}
              />
              <span className={styles.count}>
                {uc.count} {uc.count === 1 ? "layer" : "layers"}
              </span>
              {isEditing && (
                <>
                  <div
                    className={pickerStyles.backdrop}
                    onClick={closeEditor}
                  />
                  <div className={pickerStyles.popover}>
                    <ColorPicker
                      color={editingColor}
                      onChange={handleColorChange}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
