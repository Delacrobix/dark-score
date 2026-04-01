import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { loadPdf, loadImage } from './pdfRenderer'
import type { WorkerRequest, WorkerResponse } from '../types'

let workerRequestId = 0

export function useProcessor() {
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<Map<number, (data: ImageData) => void>>(new Map())

  const {
    sourceFile,
    sourceType,
    settings,
    currentPage,
    setTotalPages,
    setPageData,
    setIsLoading,
    setLoadingProgress,
    setIsProcessing,
  } = useAppStore()

  // Boot worker once
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/imageProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    )
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, imageData } = e.data
      const resolve = pendingRef.current.get(id)
      if (resolve) {
        pendingRef.current.delete(id)
        resolve(imageData)
      }
    }
    workerRef.current = worker
    return () => worker.terminate()
  }, [])

  const sendToWorker = useCallback(
    (imageData: ImageData): Promise<ImageData> =>
      new Promise((resolve) => {
        const id = ++workerRequestId
        pendingRef.current.set(id, resolve)
        const req: WorkerRequest = { id, imageData, settings }
        workerRef.current!.postMessage(req, [imageData.data.buffer])
      }),
    [settings]
  )

  const putImageDataOnCanvas = (imageData: ImageData): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    canvas.getContext('2d')!.putImageData(imageData, 0, 0)
    return canvas
  }

  // Load + process when file changes
  useEffect(() => {
    if (!sourceFile || !sourceType) return

    let cancelled = false

    const run = async () => {
      setIsLoading(true)
      setLoadingProgress(0)

      try {
        if (sourceType === 'pdf') {
          const { totalPages, renderPage } = await loadPdf(sourceFile)
          if (cancelled) return
          setTotalPages(totalPages)

          for (let i = 0; i < totalPages; i++) {
            if (cancelled) break
            const originalImageData = await renderPage(i)
            if (cancelled) break
            const processed = await sendToWorker(new ImageData(
              new Uint8ClampedArray(originalImageData.data),
              originalImageData.width,
              originalImageData.height
            ))
            if (cancelled) break
            setPageData({
              index: i,
              originalImageData,
              processedCanvas: putImageDataOnCanvas(processed),
            })
            setLoadingProgress((i + 1) / totalPages)
          }
        } else {
          const originalImageData = await loadImage(sourceFile)
          if (cancelled) return
          setTotalPages(1)
          const processed = await sendToWorker(new ImageData(
            new Uint8ClampedArray(originalImageData.data),
            originalImageData.width,
            originalImageData.height
          ))
          if (cancelled) return
          setPageData({
            index: 0,
            originalImageData,
            processedCanvas: putImageDataOnCanvas(processed),
          })
          setLoadingProgress(1)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    run()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFile, sourceType])

  // Re-process current page when settings change
  useEffect(() => {
    const store = useAppStore.getState()
    const page = store.pages[store.currentPage]
    if (!page?.originalImageData) return

    let cancelled = false
    setIsProcessing(true)

    const reprocess = async () => {
      const copy = new ImageData(
        new Uint8ClampedArray(page.originalImageData.data),
        page.originalImageData.width,
        page.originalImageData.height
      )
      const processed = await sendToWorker(copy)
      if (cancelled) return
      setPageData({
        ...page,
        processedCanvas: putImageDataOnCanvas(processed),
      })
      setIsProcessing(false)
    }

    reprocess()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, currentPage])
}
