import { useEffect, useRef, useCallback } from 'react'
import { useAppStore, type SourceEntry } from '../store/useAppStore'
import { loadPdf, loadImage, type RenderDpi } from './pdfRenderer'
import type { WorkerRequest, WorkerResponse, PageData } from '../types'

let workerRequestId = 0

type SendFn = (imageData: ImageData) => Promise<ImageData>

function putImageDataOnCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  canvas.getContext('2d')!.putImageData(imageData, 0, 0)
  return canvas
}

function cloneImageData(src: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(src.data),
    src.width,
    src.height
  )
}

async function processPage(
  originalImageData: ImageData,
  index: number,
  send: SendFn
): Promise<PageData> {
  const processed = await send(cloneImageData(originalImageData))
  return { index, originalImageData, processedCanvas: putImageDataOnCanvas(processed) }
}

async function processPdfSource(
  src: SourceEntry,
  dpi: RenderDpi,
  startIndex: number,
  send: SendFn,
  onPage: (page: PageData) => void,
  signal: { cancelled: boolean }
): Promise<number> {
  const { totalPages, renderPage } = await loadPdf(src.file, dpi)
  for (let p = 0; p < totalPages; p++) {
    if (signal.cancelled) return p
    const original = await renderPage(p)
    if (signal.cancelled) return p
    const page = await processPage(original, startIndex + p, send)
    if (signal.cancelled) return p
    onPage(page)
  }
  return totalPages
}

async function processImageSource(
  src: SourceEntry,
  index: number,
  send: SendFn,
  onPage: (page: PageData) => void,
  signal: { cancelled: boolean }
): Promise<void> {
  const original = await loadImage(src.file)
  if (signal.cancelled) return
  const page = await processPage(original, index, send)
  if (signal.cancelled) return
  onPage(page)
}

export function useProcessor() {
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<Map<number, (data: ImageData) => void>>(new Map())

  const {
    sources,
    settings,
    exportDpi,
    currentPage,
    setTotalPages,
    setPageData,
    setIsLoading,
    setLoadingProgress,
    setIsProcessing,
  } = useAppStore()

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

  // Load + process all sources
  useEffect(() => {
    if (sources.length === 0) return

    const signal = { cancelled: false }

    const run = async () => {
      setIsLoading(true)
      setLoadingProgress(0)

      try {
        // Count total pages first
        let totalPageCount = 0
        const pageCounts: number[] = []
        for (const src of sources) {
          if (src.type === 'pdf') {
            const { totalPages } = await loadPdf(src.file, exportDpi)
            pageCounts.push(totalPages)
            totalPageCount += totalPages
          } else {
            pageCounts.push(1)
            totalPageCount += 1
          }
        }
        if (signal.cancelled) return
        setTotalPages(totalPageCount)

        // Process each source
        let globalIndex = 0
        let processed = 0

        for (let s = 0; s < sources.length; s++) {
          if (signal.cancelled) break
          const src = sources[s]

          const onPage = (page: PageData) => {
            setPageData(page)
            processed++
            setLoadingProgress(processed / totalPageCount)
          }

          if (src.type === 'pdf') {
            await processPdfSource(src, exportDpi, globalIndex, sendToWorker, onPage, signal)
            globalIndex += pageCounts[s]
          } else {
            await processImageSource(src, globalIndex, sendToWorker, onPage, signal)
            globalIndex++
          }
        }
      } finally {
        if (!signal.cancelled) setIsLoading(false)
      }
    }

    run()
    return () => { signal.cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources, exportDpi])

  // Re-process current page when settings change
  useEffect(() => {
    const store = useAppStore.getState()
    const page = store.pages[store.currentPage]
    if (!page?.originalImageData) return

    const signal = { cancelled: false }
    setIsProcessing(true)

    const reprocess = async () => {
      const processed = await sendToWorker(cloneImageData(page.originalImageData))
      if (signal.cancelled) return
      setPageData({ ...page, processedCanvas: putImageDataOnCanvas(processed) })
      setIsProcessing(false)
    }

    reprocess()
    return () => { signal.cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, currentPage])
}
