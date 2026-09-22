import { test as setup } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { jsPDF } from 'jspdf'
import { FIXTURES, GENERATED_DIR } from './helpers'

// Synthetic scores: white paper with staff lines and note heads, enough for
// the pipeline to have something to invert, clean and thicken. Generated on
// every run so no binaries live in git.

/** Draws N staves with note heads on a jsPDF page (units: pt). */
function drawStaves(pdf: jsPDF, title: string, pageNumber: number) {
  pdf.setFontSize(20).text(title, 60, 60)
  // a big page number so pages are distinguishable even at thumbnail size
  pdf.setFontSize(320).text(String(pageNumber), 180, 520)
  pdf.setLineWidth(0.8)
  for (let s = 0; s < 6; s++) {
    const top = 110 + s * 100
    for (let l = 0; l < 5; l++) pdf.line(60, top + l * 8, 550, top + l * 8)
    for (let n = 0; n < 12; n++) {
      pdf.ellipse(90 + n * 38, top + (n % 5) * 8, 4, 3, 'F')
      pdf.line(94 + n * 38, top + (n % 5) * 8, 94 + n * 38, top + (n % 5) * 8 - 28)
    }
  }
}

function makePdf(pages: number): Buffer {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' })
  for (let p = 1; p <= pages; p++) {
    if (p > 1) pdf.addPage()
    drawStaves(pdf, `Fixture score - page ${p}`, p)
  }
  return Buffer.from(pdf.output('arraybuffer'))
}

setup('generate fixture files', async ({ browser }) => {
  mkdirSync(GENERATED_DIR, { recursive: true })

  writeFileSync(FIXTURES.pdf2, makePdf(2))
  writeFileSync(FIXTURES.pdf1, makePdf(1))
  writeFileSync(FIXTURES.txt, 'not a score\n')
  writeFileSync(FIXTURES.corrupt, '%PDF-1.4\nthis is not a valid pdf body\n%%EOF\n')

  const locked = new jsPDF({ unit: 'pt', format: 'letter', encryption: { userPassword: 'secret' } })
  drawStaves(locked, 'Locked score', 1)
  writeFileSync(FIXTURES.encrypted, Buffer.from(locked.output('arraybuffer')))

  // Raster fixtures come from a canvas in the browser: a clean PNG and a
  // "scanned" JPEG with yellowed paper and noise.
  const page = await browser.newPage()
  const images = await page.evaluate(() => {
    function draw(paper: string, noisy: boolean) {
      const c = document.createElement('canvas')
      c.width = 800
      c.height = 1000
      const ctx = c.getContext('2d')!
      ctx.fillStyle = paper
      ctx.fillRect(0, 0, c.width, c.height)
      if (noisy) {
        for (let i = 0; i < 20000; i++) {
          const g = 150 + Math.floor(Math.random() * 90)
          ctx.fillStyle = `rgb(${g},${g - 10},${g - 30})`
          ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2)
        }
      }
      ctx.fillStyle = '#000'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1.5
      for (let s = 0; s < 6; s++) {
        const top = 120 + s * 140
        for (let l = 0; l < 5; l++) {
          ctx.beginPath()
          ctx.moveTo(60, top + l * 12)
          ctx.lineTo(740, top + l * 12)
          ctx.stroke()
        }
        for (let n = 0; n < 14; n++) {
          ctx.beginPath()
          ctx.ellipse(100 + n * 46, top + (n % 5) * 12, 6, 4.5, -0.3, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.moveTo(106 + n * 46, top + (n % 5) * 12)
          ctx.lineTo(106 + n * 46, top + (n % 5) * 12 - 40)
          ctx.stroke()
        }
      }
      return c
    }
    return {
      png: draw('#ffffff', false).toDataURL('image/png'),
      jpg: draw('#ffffff', false).toDataURL('image/jpeg', 0.92),
      scan: draw('#efe4c6', true).toDataURL('image/jpeg', 0.85),
    }
  })
  await page.close()

  const fromDataUrl = (d: string) => Buffer.from(d.split(',')[1], 'base64')
  writeFileSync(FIXTURES.png, fromDataUrl(images.png))
  writeFileSync(FIXTURES.jpg, fromDataUrl(images.jpg))
  writeFileSync(FIXTURES.scan, fromDataUrl(images.scan))
})
