import { create } from 'zustand'
import type { DecalColor, DecalLayer } from './types'
import { DEFAULT_LAYER, MAX_UNDO } from './constants'

interface DecalState {
  layers: DecalLayer[]
  undoStack: DecalLayer[][]
  redoStack: DecalLayer[][]
  isDirty: boolean
  selectedLayerIndex: number | null

  importLayers: (layers: DecalLayer[]) => void
  setSelectedLayer: (index: number | null) => void
  updateLayer: (index: number, partial: Partial<DecalLayer>) => void
  addLayer: () => void
  duplicateLayer: (index: number) => void
  deleteLayer: (index: number) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  bulkReplaceColor: (oldColor: DecalColor, newColor: DecalColor) => void
  undo: () => void
  redo: () => void
}

function colorsEqual(a: DecalColor, b: DecalColor): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a
}

function pushUndo(undoStack: DecalLayer[][], current: DecalLayer[]): DecalLayer[][] {
  const next = [...undoStack, current]
  if (next.length > MAX_UNDO) {
    return next.slice(next.length - MAX_UNDO)
  }
  return next
}

export const useStore = create<DecalState>((set) => ({
  layers: [],
  undoStack: [],
  redoStack: [],
  isDirty: false,
  selectedLayerIndex: null,

  setSelectedLayer: (index) => set({ selectedLayerIndex: index }),

  importLayers: (layers) =>
    set({
      layers,
      undoStack: [],
      redoStack: [],
      isDirty: false,
    }),

  updateLayer: (index, partial) =>
    set((state) => {
      const newLayers = state.layers.map((layer, i) =>
        i === index ? { ...layer, ...partial } : layer
      )
      return {
        layers: newLayers,
        undoStack: pushUndo(state.undoStack, state.layers),
        redoStack: [],
        isDirty: true,
      }
    }),

  addLayer: () =>
    set((state) => ({
      layers: [...state.layers, { ...DEFAULT_LAYER }],
      undoStack: pushUndo(state.undoStack, state.layers),
      redoStack: [],
      isDirty: true,
    })),

  duplicateLayer: (index) =>
    set((state) => {
      const layer = state.layers[index]
      if (!layer) return state
      const newLayers = [...state.layers]
      newLayers.splice(index + 1, 0, {
        ...layer,
        color: { ...layer.color },
        position: { ...layer.position },
        rotation: { ...layer.rotation },
      })
      return {
        layers: newLayers,
        undoStack: pushUndo(state.undoStack, state.layers),
        redoStack: [],
        isDirty: true,
      }
    }),

  deleteLayer: (index) =>
    set((state) => {
      const newLayers = state.layers.filter((_, i) => i !== index)
      return {
        layers: newLayers,
        undoStack: pushUndo(state.undoStack, state.layers),
        redoStack: [],
        isDirty: true,
      }
    }),

  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      if (fromIndex === toIndex) return state
      const newLayers = [...state.layers]
      const [moved] = newLayers.splice(fromIndex, 1)
      newLayers.splice(toIndex, 0, moved)
      return {
        layers: newLayers,
        undoStack: pushUndo(state.undoStack, state.layers),
        redoStack: [],
        isDirty: true,
      }
    }),

  bulkReplaceColor: (oldColor, newColor) =>
    set((state) => {
      const newLayers = state.layers.map((layer) =>
        colorsEqual(layer.color, oldColor)
          ? { ...layer, color: { ...newColor } }
          : layer
      )
      return {
        layers: newLayers,
        undoStack: pushUndo(state.undoStack, state.layers),
        redoStack: [],
        isDirty: true,
      }
    }),

  undo: () =>
    set((state) => {
      if (state.undoStack.length === 0) return state
      const newUndoStack = [...state.undoStack]
      const previous = newUndoStack.pop()!
      return {
        layers: previous,
        undoStack: newUndoStack,
        redoStack: [...state.redoStack, state.layers],
        isDirty: true,
      }
    }),

  redo: () =>
    set((state) => {
      if (state.redoStack.length === 0) return state
      const newRedoStack = [...state.redoStack]
      const next = newRedoStack.pop()!
      return {
        layers: next,
        undoStack: [...state.undoStack, state.layers],
        redoStack: newRedoStack,
        isDirty: true,
      }
    }),
}))
