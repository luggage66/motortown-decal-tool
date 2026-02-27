import { useEffect } from 'react'
import { ActionButton, Flex } from '@adobe/react-spectrum'
import { useStore } from '../store'

export function Toolbar() {
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const canUndo = useStore((s) => s.undoStack.length > 0)
  const canRedo = useStore((s) => s.redoStack.length > 0)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useStore.getState().undo()
      } else if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        useStore.getState().redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Flex gap="size-100" alignItems="center">
      <ActionButton isDisabled={!canUndo} onPress={undo}>
        ↩ Undo
      </ActionButton>
      <ActionButton isDisabled={!canRedo} onPress={redo}>
        ↪ Redo
      </ActionButton>
    </Flex>
  )
}
