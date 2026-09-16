import type { PageData } from '../types'

// jspdf and jszip are loaded on demand, only when the user exports.

export type ExportFormat = 'pdf' | 'png'

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob returned null'))
    }, 'image/png')
  })
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportAsPdf(pages: PageData[], filename = 'dark-score.pdf') {
  const firstPage = pages.find((p) => p.processedCanvas)
  if (!firstPage?.processedCanvas) return

  const { jsPDF } = await import('jspdf')
  const { width, height } = firstPage.processedCanvas
  const orientation = width > height ? 'l' : 'p'

  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [width, height],
    hotfixes: ['px_scaling'],
  })

  for (let i = 0; i < pages.length; i++) {
    const canvas = pages[i]?.processedCanvas
    if (!canvas) continue

    if (i > 0) {
      pdf.addPage([canvas.width, canvas.height], canvas.width > canvas.height ? 'l' : 'p')
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    pdf.addImage(dataUrl, 'JPEG', 0, 0, canvas.width, canvas.height)
  }

  pdf.save(filename)
}

export async function exportAsPng(pages: PageData[], baseName = 'dark-score') {
  const ready = pages.filter((p) => p.processedCanvas)

  if (ready.length === 0) return

  if (ready.length === 1) {
    const blob = await canvasToBlob(ready[0].processedCanvas!)
    triggerDownload(URL.createObjectURL(blob), `${baseName}.png`)
    return
  }

  // Multiple pages → ZIP
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const page of ready) {
    const blob = await canvasToBlob(page.processedCanvas!)
    zip.file(`${baseName}-p${page.index + 1}.png`, blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(URL.createObjectURL(zipBlob), `${baseName}.zip`)
}
