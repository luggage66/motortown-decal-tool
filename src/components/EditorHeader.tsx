import {
  ActionButton,
  Button,
  AlertDialog,
  DialogTrigger,
  ToastQueue,
} from '@adobe/react-spectrum'
import { saveAs } from 'file-saver'
import { useStore } from '../store'
import type { DecalFile } from '../types'
import styles from './EditorHeader.module.css'

export function EditorHeader() {
  const layers = useStore((s) => s.layers)
  const isDirty = useStore((s) => s.isDirty)
  const importLayers = useStore((s) => s.importLayers)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const canUndo = useStore((s) => s.undoStack.length > 0)
  const canRedo = useStore((s) => s.redoStack.length > 0)

  function buildJson(): string {
    const file: DecalFile = { decal: { decalLayers: layers } }
    return JSON.stringify(file, null, 2)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildJson())
      ToastQueue.positive('Copied to clipboard!', { timeout: 3000 })
    } catch {
      ToastQueue.negative('Failed to copy to clipboard')
    }
  }

  function handleDownload() {
    const blob = new Blob([buildJson()], {
      type: 'application/json;charset=utf-8',
    })
    saveAs(blob, 'decals.json')
  }

  function handleImportNew() {
    importLayers([])
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
        You have unsaved changes. Return to the import screen and lose
        changes?
      </AlertDialog>
    </DialogTrigger>
  ) : (
    <ActionButton isQuiet onPress={handleImportNew}>
      Import New
    </ActionButton>
  )

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>MotorTown Decal Editor</h1>
        {importNewButton}
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
  )
}
