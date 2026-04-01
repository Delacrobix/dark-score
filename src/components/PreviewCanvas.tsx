import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { pages, currentPage, isLoading, loadingProgress } = useAppStore()

  const page = pages[currentPage]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !page?.processedCanvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = page.processedCanvas.width
    canvas.height = page.processedCanvas.height
    ctx.drawImage(page.processedCanvas, 0, 0)
  }, [page?.processedCanvas])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-zinc-500 w-full max-w-lg">
        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-purple-500 h-full transition-all duration-200"
            style={{ width: `${Math.round(loadingProgress * 100)}%` }}
          />
        </div>
        <p className="text-xs">Procesando… {Math.round(loadingProgress * 100)}%</p>
      </div>
    )
  }

  if (!page?.processedCanvas) return null

  return (
    <div className="w-full overflow-auto rounded-lg border border-zinc-800 max-h-[calc(100vh-160px)]">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto block"
        aria-label="Previsualización de la partitura procesada"
      />
    </div>
  )
}
