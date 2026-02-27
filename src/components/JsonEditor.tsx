import { useRef, useEffect, useCallback } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useStore } from '../store'
import type { DecalFile } from '../types'
import { validateDecalJson } from '../utils/validation'
import styles from './JsonEditor.module.css'

function buildJson(layers: DecalFile['decal']['decalLayers']): string {
  const file: DecalFile = { decal: { decalLayers: layers } }
  return JSON.stringify(file, null, 2)
}

export function JsonEditor() {
  const layers = useStore((s) => s.layers)
  const importLayers = useStore((s) => s.importLayers)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const isInternalUpdate = useRef(false)

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor
  }

  // Sync store → editor when layers change externally (e.g. undo, layer card edits)
  useEffect(() => {
    const ed = editorRef.current
    if (!ed || isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    const newValue = buildJson(layers)
    if (ed.getValue() !== newValue) {
      ed.setValue(newValue)
    }
  }, [layers])

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!value) return
      const result = validateDecalJson(value)
      if (result.ok) {
        isInternalUpdate.current = true
        importLayers(result.layers)
      }
    },
    [importLayers]
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.editorContainer}>
        <Editor
          defaultLanguage="json"
          defaultValue={buildJson(layers)}
          theme="vs-dark"
          onChange={handleChange}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  )
}
