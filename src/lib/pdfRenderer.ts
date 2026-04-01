import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

const RENDER_DPI = 200
const SCALE = RENDER_DPI / 72  // pdf.js uses 72 dpi as base

export interface PdfRenderResult {
  totalPages: number
  renderPage: (pageIndex: number) => Promise<ImageData>
}

export async function loadPdf(file: File): Promise<PdfRenderResult> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const renderPage = async (pageIndex: number): Promise<ImageData> => {
    const page = await pdf.getPage(pageIndex + 1)  // pdf.js is 1-indexed
    const viewport = page.getViewport({ scale: SCALE })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise

    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  return { totalPages: pdf.numPages, renderPage }
}

export async function loadImage(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo cargar la imagen'))
    }

    img.src = url
  })
}
