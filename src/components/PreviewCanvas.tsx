import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'

const ZOOM_STEP = 25
const DEFAULT_ZOOM = 100
const MIN_ZOOM = 1
const MAX_ZOOM = 500

export function PreviewCanvas() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { pages, currentPage, isLoading, loadingProgress } = useAppStore()
  const [zoomPercent, setZoomPercent] = useState(DEFAULT_ZOOM)
  const [isEditing, setIsEditing] = useState(false)

  const zoom = zoomPercent / 100
  const page = pages[currentPage]
  const processedCanvas = page?.processedCanvas ?? null

  const clampZoom = (v: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v))

  // Draw processed canvas — useLayoutEffect ensures it paints before browser renders
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !processedCanvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = processedCanvas.width
    canvas.height = processedCanvas.height
    ctx.drawImage(processedCanvas, 0, 0)
  }, [processedCanvas])

  useEffect(() => {
    setZoomPercent(DEFAULT_ZOOM)
  }, [currentPage])

  const zoomIn = useCallback(() => {
    setZoomPercent((z) => clampZoom(z + ZOOM_STEP))
  }, [])

  const zoomOut = useCallback(() => {
    setZoomPercent((z) => clampZoom(z - ZOOM_STEP))
  }, [])

  const handleEditStart = () => {
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleEditConfirm = () => {
    setIsEditing(false)
    const val = parseInt(inputRef.current?.value ?? '', 10)
    if (!isNaN(val) && val >= MIN_ZOOM) {
      setZoomPercent(clampZoom(val))
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditConfirm()
    if (e.key === 'Escape') setIsEditing(false)
  }

  // Ctrl+scroll to zoom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      if (e.deltaY < 0) zoomIn()
      else zoomOut()
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [zoomIn, zoomOut])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-zinc-500 w-full max-w-lg">
        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-purple-500 h-full transition-all duration-200"
            style={{ width: `${Math.round(loadingProgress * 100)}%` }}
          />
        </div>
        <p className="text-xs">{t('controls.processing')} {Math.round(loadingProgress * 100)}%</p>
      </div>
    )
  }

  if (!processedCanvas) return null

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Zoom controls */}
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

      {/* Canvas container - centered when zoomed out */}
      <div
        ref={containerRef}
        className="overflow-auto rounded-lg border border-zinc-800 max-h-[calc(100vh-200px)]"
      >
        <div
          style={{
            width: `${processedCanvas.width * zoom}px`,
            height: `${processedCanvas.height * zoom}px`,
            margin: '0 auto',
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              transformOrigin: 'top left',
              transform: `scale(${zoom})`,
            }}
            className="block"
          />
        </div>
      </div>
    </div>
  )
}
