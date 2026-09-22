import { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { ZoomControls } from './ZoomControls'

export function PreviewCanvas() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const { documents, currentDocIndex, zoomPercent } = useAppStore()
  const currentDoc = documents[currentDocIndex] ?? null

  const zoom = zoomPercent / 100
  const isLoading = currentDoc?.isLoading ?? false
  const loadingProgress = currentDoc?.loadingProgress ?? 0
  const isProcessing = currentDoc?.isProcessing ?? false
  const page = currentDoc?.pages[currentDoc.currentPage] ?? null
  const processedCanvas = page?.processedCanvas ?? null

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas || !processedCanvas) return
      const ctx = canvas.getContext('2d')!
      canvas.width = processedCanvas.width
      canvas.height = processedCanvas.height
      ctx.drawImage(processedCanvas, 0, 0)
    },
    [processedCanvas]
  )

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

  if (currentDoc?.error) {
    const key = currentDoc.error === 'password-protected' ? 'passwordProtected' : 'loadFailed'
    return (
      <div role="alert" className="flex flex-col items-center gap-3 text-center max-w-sm">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p className="text-sm text-red-400">{t(`errors.${key}`)}</p>
        <p className="text-xs text-zinc-600">{currentDoc.label}</p>
      </div>
    )
  }

  if (!processedCanvas) return null

  return (
    <div className="w-full flex flex-col gap-2">
      <ZoomControls scrollContainer={containerRef} />

      <div
        ref={containerRef}
        className="overflow-auto rounded-lg border border-zinc-800 max-h-[calc(100vh-200px)] relative"
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
        {isProcessing && (
          <div className="sticky top-0 left-0 w-full flex items-center justify-center bg-black/40 pointer-events-none" style={{ height: containerRef.current?.clientHeight ?? '100%', marginTop: -(containerRef.current?.scrollHeight ?? 0) }}>
            <span className="text-3xl animate-spin" style={{ animationDuration: '1.5s' }}>♪</span>
          </div>
        )}
      </div>
    </div>
  )
}
