import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3]
const DEFAULT_ZOOM_INDEX = 3 // 100%

export function PreviewCanvas() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { pages, currentPage, isLoading, loadingProgress } = useAppStore()
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)

  const zoom = ZOOM_STEPS[zoomIndex]
  const page = pages[currentPage]
  const processedCanvas = page?.processedCanvas ?? null

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
    setZoomIndex(DEFAULT_ZOOM_INDEX)
  }, [currentPage])

  const zoomIn = useCallback(() => {
    setZoomIndex((i) => Math.min(i + 1, ZOOM_STEPS.length - 1))
  }, [])

  const zoomOut = useCallback(() => {
    setZoomIndex((i) => Math.max(i - 1, 0))
  }, [])

  const resetZoom = useCallback(() => {
    setZoomIndex(DEFAULT_ZOOM_INDEX)
  }, [])

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
          disabled={zoomIndex === 0}
          className="w-7 h-7 flex items-center justify-center rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm"
        >
          −
        </button>
        <button
          onClick={resetZoom}
          className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer tabular-nums min-w-[3rem] text-center"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={zoomIn}
          disabled={zoomIndex === ZOOM_STEPS.length - 1}
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
