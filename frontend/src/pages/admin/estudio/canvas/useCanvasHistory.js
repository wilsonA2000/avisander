// Undo/redo para el canvas Konva via snapshots de elementos.
import { useState, useCallback, useRef } from 'react'

const MAX_HISTORY = 30

export default function useCanvasHistory(initialState = []) {
  const [history, setHistory] = useState([JSON.stringify(initialState)])
  const pointer = useRef(0)

  const push = useCallback((elements) => {
    const json = JSON.stringify(elements)
    setHistory(prev => {
      const next = prev.slice(0, pointer.current + 1)
      next.push(json)
      if (next.length > MAX_HISTORY) next.shift()
      else pointer.current = next.length - 1
      return next
    })
    pointer.current += 1
  }, [])

  const undo = useCallback(() => {
    if (pointer.current <= 0) return null
    pointer.current -= 1
    return JSON.parse(history[pointer.current])
  }, [history])

  const redo = useCallback(() => {
    if (pointer.current >= history.length - 1) return null
    pointer.current += 1
    return JSON.parse(history[pointer.current])
  }, [history])

  return {
    push,
    undo,
    redo,
    canUndo: pointer.current > 0,
    canRedo: pointer.current < history.length - 1
  }
}
