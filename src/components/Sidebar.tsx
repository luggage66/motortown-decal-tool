import { useStore } from "../store";
import { ColorPalette } from "./ColorPalette";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const layerCount = useStore((s) => s.layers.length);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.infoSection}>
        <h2 className={styles.sectionTitle}>Info</h2>
        <p className={styles.stat}>
          {layerCount} layer{layerCount !== 1 ? "s" : ""}
        </p>
      </div>
      <div className={styles.paletteSection}>
        <ColorPalette />
      </div>
    </aside>
  );
}
