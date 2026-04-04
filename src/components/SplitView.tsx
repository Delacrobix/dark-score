import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { ZoomControls } from './ZoomControls'

export function SplitView() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const originalCanvasRef = useRef<HTMLCanvasElement>(null)
  const processedCanvasRef = useRef<HTMLCanvasElement>(null)
  const [splitPos, setSplitPos] = useState(0.5) // 0..1
  const [dragging, setDragging] = useState(false)

  const { documents, currentDocIndex, zoomPercent } = useAppStore()
  const currentDoc = documents[currentDocIndex] ?? null
  const zoom = zoomPercent / 100
  const page = currentDoc?.pages[currentDoc.currentPage] ?? null

  // Draw original on left canvas
  useEffect(() => {
    const canvas = originalCanvasRef.current
    if (!canvas || !page?.originalImageData) return
    canvas.width = page.originalImageData.width
    canvas.height = page.originalImageData.height
    canvas.getContext('2d')!.putImageData(page.originalImageData, 0, 0)
  }, [page?.originalImageData])

  // Draw processed on right canvas
  useEffect(() => {
    const canvas = processedCanvasRef.current
    if (!canvas || !page?.processedCanvas) return
    canvas.width = page.processedCanvas.width
    canvas.height = page.processedCanvas.height
    canvas.getContext('2d')!.drawImage(page.processedCanvas, 0, 0)
  }, [page?.processedCanvas])

  const updateSplit = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    setSplitPos(Math.max(0.05, Math.min(0.95, x)))
  }, [])

  // Mouse drag
  useEffect(() => {
    if (!dragging) return

    const onMove = (e: MouseEvent) => { e.preventDefault(); updateSplit(e.clientX) }
    const onUp = () => setDragging(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, updateSplit])

  // Touch drag
  useEffect(() => {
    if (!dragging) return

    const onMove = (e: TouchEvent) => { updateSplit(e.touches[0].clientX) }
    const onEnd = () => setDragging(false)

    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [dragging, updateSplit])

  if (!page?.originalImageData || !page?.processedCanvas) return null

  const splitPercent = `${splitPos * 100}%`

  return (
    <div className="w-full flex flex-col gap-2">
      <ZoomControls scrollContainer={containerRef} />

      {/* Labels */}
      <div className="flex justify-between text-xs text-zinc-600 px-1">
        <span>{t('splitView.original')}</span>
        <span>{t('splitView.result')}</span>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-auto rounded-lg border border-zinc-800 select-none max-h-[calc(100vh-200px)]"
      >
        <div
          style={{
            width: `${page.originalImageData.width * zoom}px`,
            height: `${page.originalImageData.height * zoom}px`,
            position: 'relative',
            margin: '0 auto',
          }}
        >
          {/* Original (full size, clipped to left portion) */}
          <canvas
            ref={originalCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ clipPath: `inset(0 ${100 - splitPos * 100}% 0 0)` }}
          />

          {/* Processed (full size, clipped to right portion) */}
          <canvas
            ref={processedCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ clipPath: `inset(0 0 0 ${splitPercent})` }}
          />

          {/* Draggable divider */}
          <div
            className="absolute top-0 bottom-0 z-10 cursor-col-resize flex items-center justify-center"
            style={{ left: splitPercent, transform: 'translateX(-50%)' }}
            onMouseDown={() => setDragging(true)}
            onTouchStart={() => setDragging(true)}
          >
            <div className="w-0.5 h-full bg-white/60" />
            <div className="absolute w-6 h-6 rounded-full bg-white/90 border-2 border-zinc-800 shadow-lg flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M3 1L1 5L3 9M7 1L9 5L7 9" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
