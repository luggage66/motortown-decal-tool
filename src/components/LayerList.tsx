import { useRef, useState, useMemo } from 'react'
import { Button } from '@adobe/react-spectrum'
import { useStore } from '../store'
import { LayerCard } from './LayerCard'

export function LayerList() {
  const layers = useStore((s) => s.layers)
  const addLayer = useStore((s) => s.addLayer)
  const reorderLayers = useStore((s) => s.reorderLayers)

  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const uniqueKeys = useMemo(() => {
    const keys = new Set(layers.map((l) => l.decalKey).filter(Boolean))
    return Array.from(keys).sort()
  }, [layers])

  function handleDrop(targetIndex: number) {
    const from = dragIndexRef.current
    if (from !== null && from !== targetIndex) {
      reorderLayers(from, targetIndex)
    }
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  if (layers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
        <p>No layers loaded. Import a decal JSON file to get started.</p>
        <Button variant="secondary" onPress={addLayer}>Add Layer</Button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {layers.map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            outline: dragOverIndex === i ? '2px solid var(--accent)' : undefined,
            outlineOffset: dragOverIndex === i ? -2 : undefined,
            borderRadius: 6,
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i) }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOverIndex(null)
            }
          }}
          onDrop={() => handleDrop(i)}
        >
          <div
            draggable
            onDragStart={() => { dragIndexRef.current = i }}
            onDragEnd={() => { dragIndexRef.current = null; setDragOverIndex(null) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 6px',
              cursor: 'grab',
              color: 'var(--text-secondary)',
              fontSize: 20,
              userSelect: 'none',
              opacity: 0.5,
              flexShrink: 0,
            }}
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
  )
}
