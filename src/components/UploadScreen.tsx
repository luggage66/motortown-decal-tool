import { useState, useCallback, useRef } from "react";
import { Button, ToastQueue } from "@adobe/react-spectrum";
import { useStore } from "../store";
import { validateDecalJson } from "../utils/validation";
import styles from "./UploadScreen.module.css";

export function UploadScreen() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const importLayers = useStore((s) => s.importLayers);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processJson = useCallback(
    (text: string) => {
      const result = validateDecalJson(text);
      if (!result.ok) {
        setError(result.error);
        ToastQueue.negative(result.error, { timeout: 5000 });
        return;
      }
      setError(null);
      importLayers(result.layers);
      ToastQueue.positive(
        `Imported ${result.layers.length} layer${result.layers.length !== 1 ? "s" : ""}`,
        { timeout: 3000 },
      );
    },
    [importLayers],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => processJson(reader.result as string);
        reader.readAsText(file);
      }
    },
    [processJson],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text");
      if (text) processJson(text);
    },
    [processJson],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => processJson(reader.result as string);
        reader.readAsText(file);
      }
    },
    [processJson],
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>MotorTown Decal Editor</h1>
      <div
        className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ""} ${error ? styles.hasError : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
      >
        <div className={styles.dropContent}>
          <div className={styles.uploadIcon}>&#x2191;</div>
          <p className={styles.dropText}>Upload or Paste JSON</p>
          <p className={styles.dropHint}>
            Drop a .json file, paste with Ctrl+V, or browse
          </p>
          {error && <p className={styles.errorText}>{error}</p>}
          <Button
            variant="accent"
            onPress={() => fileInputRef.current?.click()}
          >
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className={styles.hiddenInput}
          />
        </div>
      </div>
    </div>
  );
}
