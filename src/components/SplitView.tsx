import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore, selectEffectiveZoom } from '../store/useAppStore'
import { useFitToViewer, useWheelZoom } from '../lib/useViewerZoom'
import { ZoomControls } from './ZoomControls'
import { Glyph } from './Icon'

export function SplitView({ layout = 'actual' }: Readonly<{ layout?: 'actual' | 'estudio' }>) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const originalCanvasRef = useRef<HTMLCanvasElement>(null)
  const processedCanvasRef = useRef<HTMLCanvasElement>(null)
  const [splitPos, setSplitPos] = useState(0.5) // 0..1
  const [dragging, setDragging] = useState(false)

  const { documents, currentDocIndex } = useAppStore()
  const zoomPercent = useAppStore(selectEffectiveZoom)
  const currentDoc = documents[currentDocIndex] ?? null
  const zoom = zoomPercent / 100
  const page = currentDoc?.pages[currentDoc.currentPage] ?? null

  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const attachContainer = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el
    setContainer(el)
  }, [])
  useFitToViewer(container, page?.originalImageData?.width, page?.originalImageData?.height)
  useWheelZoom(container)

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
  const estudio = layout === 'estudio'

  const labels = (
    <div className={`flex justify-between text-xs text-zinc-600 ${estudio ? 'shrink-0 px-4 pt-3' : 'px-1'}`}>
      <span>{t('splitView.original')}</span>
      <span>{t('splitView.result')}</span>
    </div>
  )

  return (
    <div className={estudio ? 'absolute inset-0 flex flex-col' : 'w-full flex flex-col gap-2'}>
      {!estudio && <ZoomControls />}

      {labels}

      <div
        ref={attachContainer}
        className={estudio
          ? 'relative flex-1 min-h-0 overflow-auto select-none'
          : 'relative overflow-auto rounded-lg border border-zinc-800 select-none max-h-[calc(100vh-200px)]'}
      >
        <div className={estudio ? 'min-h-full min-w-full w-max flex p-4' : 'contents'}>
        <div
          className={estudio ? 'm-auto shrink-0 rounded-[3px] ring-1 ring-white/10' : undefined}
          style={{
            width: `${page.originalImageData.width * zoom}px`,
            height: `${page.originalImageData.height * zoom}px`,
            position: 'relative',
            margin: estudio ? undefined : '0 auto',
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
            <div className="absolute w-6 h-6 rounded-full bg-white/90 border-2 border-zinc-800 shadow-lg flex items-center justify-center text-zinc-800">
              <Glyph
                icon="arrows-h"
                size={12}
                text={(
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M3 1L1 5L3 9M7 1L9 5L7 9" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
