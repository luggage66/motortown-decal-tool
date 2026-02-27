import { useState } from 'react'
import { Button, Text } from '@adobe/react-spectrum'
import { saveAs } from 'file-saver'
import { useStore } from '../store'
import type { DecalFile } from '../types'
import styles from '../App.module.css'

export function ExportBar() {
  const layers = useStore((s) => s.layers)
  const [copyLabel, setCopyLabel] = useState('Copy to Clipboard')
  const hasLayers = layers.length > 0

  function buildJson(): string {
    const file: DecalFile = { decal: { decalLayers: layers } }
    return JSON.stringify(file, null, 2)
  }

  async function handleCopy() {
    const json = buildJson()
    await navigator.clipboard.writeText(json)
    setCopyLabel('Copied!')
    setTimeout(() => setCopyLabel('Copy to Clipboard'), 2000)
  }

  function handleDownload() {
    const json = buildJson()
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    saveAs(blob, 'decals.json')
  }

  return (
    <section className={styles.section}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button variant="primary" onPress={handleCopy} isDisabled={!hasLayers}>
          {copyLabel}
        </Button>
        <Button variant="secondary" onPress={handleDownload} isDisabled={!hasLayers}>
          Download JSON
        </Button>
        {hasLayers && (
          <Text UNSAFE_style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            {layers.length} layer{layers.length !== 1 ? 's' : ''}
          </Text>
        )}
      </div>
    </section>
  )
}
