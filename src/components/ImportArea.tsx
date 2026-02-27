import { useState } from 'react'
import {
  TextArea,
  Button,
  AlertDialog,
  DialogTrigger,
} from '@adobe/react-spectrum'
import { useStore } from '../store'
import { validateDecalJson } from '../utils/validation'
import styles from '../App.module.css'

export function ImportArea() {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const importLayers = useStore((s) => s.importLayers)
  const isDirty = useStore((s) => s.isDirty)

  function doImport() {
    const result = validateDecalJson(jsonText)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    importLayers(result.layers)
  }

  const importButton = isDirty ? (
    <DialogTrigger>
      <Button variant="accent">Import</Button>
      <AlertDialog
        variant="warning"
        title="Unsaved changes"
        primaryActionLabel="Import"
        cancelLabel="Cancel"
        onPrimaryAction={doImport}
      >
        You have unsaved changes. Import new data and lose changes?
      </AlertDialog>
    </DialogTrigger>
  ) : (
    <Button variant="accent" onPress={doImport}>
      Import
    </Button>
  )

  return (
    <section className={styles.section}>
      <TextArea
        label="Paste JSON"
        width="100%"
        height="size-1600"
        value={jsonText}
        onChange={setJsonText}
        validationState={error ? 'invalid' : undefined}
        description={!error ? 'Paste a MotorTown decal JSON file' : undefined}
        errorMessage={error ?? undefined}
      />
      <div style={{ marginTop: 8 }}>{importButton}</div>
    </section>
  )
}
