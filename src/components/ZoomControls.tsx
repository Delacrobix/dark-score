import { useRef, useState, useCallback, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

const ZOOM_STEP = 25
const MIN_ZOOM = 1
const MAX_ZOOM = 500

function clampZoom(v: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v))
}

export function ZoomControls({ scrollContainer }: { scrollContainer?: React.RefObject<HTMLDivElement | null> }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { zoomPercent, setZoomPercent } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)

  const zoomIn = useCallback(() => {
    setZoomPercent(clampZoom(zoomPercent + ZOOM_STEP))
  }, [zoomPercent, setZoomPercent])

  const zoomOut = useCallback(() => {
    setZoomPercent(clampZoom(zoomPercent - ZOOM_STEP))
  }, [zoomPercent, setZoomPercent])

  const handleEditStart = () => {
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleEditConfirm = () => {
    setIsEditing(false)
    const val = Number.parseInt(inputRef.current?.value ?? '', 10)
    if (!Number.isNaN(val) && val >= MIN_ZOOM) {
      setZoomPercent(clampZoom(val))
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditConfirm()
    if (e.key === 'Escape') setIsEditing(false)
  }

  // Ctrl+scroll to zoom
  useEffect(() => {
    const container = scrollContainer?.current
    if (!container) return

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      if (e.deltaY < 0) setZoomPercent(clampZoom(zoomPercent + ZOOM_STEP))
      else setZoomPercent(clampZoom(zoomPercent - ZOOM_STEP))
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [zoomPercent, setZoomPercent, scrollContainer])

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={zoomOut}
        disabled={zoomPercent <= MIN_ZOOM}
        className="w-7 h-7 flex items-center justify-center rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm"
      >
        −
      </button>
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          defaultValue={zoomPercent}
          onBlur={handleEditConfirm}
          onKeyDown={handleEditKeyDown}
          className="w-14 text-xs text-center text-white bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 tabular-nums outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      ) : (
        <button
          onClick={handleEditStart}
          className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer tabular-nums min-w-[3rem] text-center"
        >
          {zoomPercent}%
        </button>
      )}
      <button
        onClick={zoomIn}
        disabled={zoomPercent >= MAX_ZOOM}
        className="w-7 h-7 flex items-center justify-center rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm"
      >
        +
      </button>
    </div>
  )
}
