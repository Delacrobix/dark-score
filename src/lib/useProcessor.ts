import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { loadPdf, loadImage, type RenderDpi } from './pdfRenderer'
import type { WorkerRequest, WorkerResponse, ProcessingSettings, PageData, SourceEntry } from '../types'

let workerRequestId = 0

type SendFn = (imageData: ImageData, settings: ProcessingSettings) => Promise<ImageData>

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
  settings: ProcessingSettings,
  send: SendFn
): Promise<PageData> {
  const processed = await send(cloneImageData(originalImageData), settings)
  return { index, originalImageData, processedCanvas: putImageDataOnCanvas(processed) }
}

async function loadDocumentSource(
  source: SourceEntry,
  dpi: RenderDpi,
  settings: ProcessingSettings,
  send: SendFn,
  onTotalPages: (n: number) => void,
  onPage: (page: PageData) => void,
  onProgress: (progress: number) => void,
  signal: { cancelled: boolean }
): Promise<void> {
  if (source.type === 'pdf') {
    const { totalPages, renderPage } = await loadPdf(source.file, dpi)
    onTotalPages(totalPages)
    for (let p = 0; p < totalPages; p++) {
      if (signal.cancelled) return
      const original = await renderPage(p)
      if (signal.cancelled) return
      const page = await processPage(original, p, settings, send)
      if (signal.cancelled) return
      onPage(page)
      onProgress((p + 1) / totalPages)
    }
  } else {
    onTotalPages(1)
    const original = await loadImage(source.file)
    if (signal.cancelled) return
    const page = await processPage(original, 0, settings, send)
    if (signal.cancelled) return
    onPage(page)
    onProgress(1)
  }
}

export function useProcessor() {
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<Map<number, (data: ImageData) => void>>(new Map())
  const loadedDocIdsRef = useRef<Set<string>>(new Set())

  const {
    documents,
    currentDocIndex,
    exportDpi,
    setDocTotalPages,
    setDocPageData,
    setDocLoading,
    setDocLoadingProgress,
    setDocProcessing,
  } = useAppStore()

  const currentDoc = documents[currentDocIndex] ?? null

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
    (imageData: ImageData, settings: ProcessingSettings): Promise<ImageData> =>
      new Promise((resolve) => {
        const id = ++workerRequestId
        pendingRef.current.set(id, resolve)
        const req: WorkerRequest = { id, imageData, settings }
        workerRef.current!.postMessage(req, [imageData.data.buffer])
      }),
    []
  )

  // Load new documents when they appear
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const docIdKey = documents.map((d) => d.id).join(',')

  useEffect(() => {
    if (documents.length === 0) {
      loadedDocIdsRef.current.clear()
      return
    }

    const signals: { cancelled: boolean }[] = []

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]
      if (loadedDocIdsRef.current.has(doc.id)) continue

      loadedDocIdsRef.current.add(doc.id)
      const signal = { cancelled: false }
      signals.push(signal)
      const docId = doc.id

      setDocLoading(docId, true)
      setDocLoadingProgress(docId, 0)

      const run = async () => {
        try {
          await loadDocumentSource(
            doc.source,
            exportDpi,
            doc.settings,
            sendToWorker,
            (n) => setDocTotalPages(docId, n),
            (page) => setDocPageData(docId, page),
            (progress) => setDocLoadingProgress(docId, progress),
            signal
          )
        } finally {
          if (!signal.cancelled) setDocLoading(docId, false)
        }
      }

      run()
    }

    // Clean up removed doc IDs
    const currentIds = new Set(documents.map((d) => d.id))
    for (const id of loadedDocIdsRef.current) {
      if (!currentIds.has(id)) loadedDocIdsRef.current.delete(id)
    }

    return () => {
      for (const s of signals) s.cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docIdKey, exportDpi])

  // Re-process all pages of current doc when settings change
  const docSettings = currentDoc?.settings

  useEffect(() => {
    const store = useAppStore.getState()
    const doc = store.documents[store.currentDocIndex]
    if (!doc) return
    const pagesWithData = doc.pages.filter((p) => p?.originalImageData)
    if (pagesWithData.length === 0) return

    const signal = { cancelled: false }
    const docId = doc.id
    setDocProcessing(docId, true)

    const reprocessAll = async () => {
      for (const page of pagesWithData) {
        if (signal.cancelled) return
        const processed = await sendToWorker(cloneImageData(page.originalImageData), doc.settings)
        if (signal.cancelled) return
        setDocPageData(docId, { ...page, processedCanvas: putImageDataOnCanvas(processed) })
      }
      if (!signal.cancelled) setDocProcessing(docId, false)
    }

    reprocessAll()
    return () => { signal.cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docSettings])
}
