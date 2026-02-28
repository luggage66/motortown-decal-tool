import { useRef } from "react";
import {
  ActionButton,
  Button,
  AlertDialog,
  DialogTrigger,
  MenuTrigger,
  Menu,
  MenuItem,
  Text,
  ToastQueue,
} from "@react-spectrum/s2";
import { saveAs } from "file-saver";
import { useStore } from "../store";
import { validateDecalJson } from "../utils/validation";
import { MAX_LAYERS } from "../constants";
import type { DecalFile } from "../types";
import styles from "./EditorHeader.module.css";

export function EditorHeader() {
  const layers = useStore((s) => s.layers);
  const isDirty = useStore((s) => s.isDirty);
  const importLayers = useStore((s) => s.importLayers);
  const appendLayers = useStore((s) => s.appendLayers);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.undoStack.length > 0);
  const canRedo = useStore((s) => s.redoStack.length > 0);
  const appendFileInputRef = useRef<HTMLInputElement>(null);

  function buildJson(): string {
    const file: DecalFile = { decal: { decalLayers: layers } };
    return JSON.stringify(file, null, 2);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildJson());
      ToastQueue.positive("Copied to clipboard!", { timeout: 3000 });
    } catch {
      ToastQueue.negative("Failed to copy to clipboard");
    }
  }

  function handleDownload() {
    const blob = new Blob([buildJson()], {
      type: "application/json;charset=utf-8",
    });
    saveAs(blob, "decals.json");
  }

  function handleImportNew() {
    importLayers([]);
  }

  function processAppend(text: string) {
    const result = validateDecalJson(text);
    if (!result.ok) {
      ToastQueue.negative(result.error, { timeout: 5000 });
      return;
    }
    const combined = layers.length + result.layers.length;
    if (combined > MAX_LAYERS) {
      ToastQueue.negative(
        `Cannot append: would exceed the ${MAX_LAYERS} layer limit (${layers.length} + ${result.layers.length} = ${combined})`,
        { timeout: 5000 },
      );
      return;
    }
    appendLayers(result.layers);
    ToastQueue.positive(
      `Appended ${result.layers.length} layer${result.layers.length !== 1 ? "s" : ""}`,
      { timeout: 3000 },
    );
  }

  function handleAppendFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => processAppend(reader.result as string);
      reader.readAsText(file);
      e.target.value = "";
    }
  }

  async function handleAppendClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        ToastQueue.negative("Clipboard is empty", { timeout: 3000 });
        return;
      }
      processAppend(text);
    } catch {
      ToastQueue.negative("Failed to read clipboard", { timeout: 3000 });
    }
  }

  function handleAppendMenuAction(key: React.Key) {
    if (key === "file") {
      appendFileInputRef.current?.click();
    } else if (key === "clipboard") {
      handleAppendClipboard();
    }
  }

  const importNewButton = isDirty ? (
    <DialogTrigger>
      <ActionButton isQuiet>Import New</ActionButton>
      <AlertDialog
        variant="warning"
        title="Unsaved changes"
        primaryActionLabel="Import New"
        cancelLabel="Cancel"
        onPrimaryAction={handleImportNew}
      >
        You have unsaved changes. Return to the import screen and lose changes?
      </AlertDialog>
    </DialogTrigger>
  ) : (
    <ActionButton isQuiet onPress={handleImportNew}>
      Import New
    </ActionButton>
  );

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>MotorTown Decal Editor</h1>
        {importNewButton}
        <MenuTrigger>
          <ActionButton isQuiet>Append JSON ▾</ActionButton>
          <Menu onAction={handleAppendMenuAction}>
            <MenuItem key="file">
              <Text slot="label">From File…</Text>
            </MenuItem>

            <MenuItem key="clipboard">
              <Text slot="label">From Clipboard</Text>
            </MenuItem>
          </Menu>
        </MenuTrigger>
        <input
          ref={appendFileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleAppendFileSelect}
          style={{ display: "none" }}
        />
      </div>
      <div className={styles.center}>
        <ActionButton isDisabled={!canUndo} onPress={undo}>
          ↩ Undo
        </ActionButton>
        <ActionButton isDisabled={!canRedo} onPress={redo}>
          ↪ Redo
        </ActionButton>
      </div>
      <div className={styles.right}>
        <Button variant="secondary" onPress={handleDownload}>
          Download JSON
        </Button>
        <Button variant="primary" onPress={handleCopy}>
          Copy to Clipboard
        </Button>
      </div>
    </header>
  );
}
