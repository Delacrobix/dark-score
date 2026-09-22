import { test, expect } from '@playwright/test'
import {
  FIXTURES,
  downloadBuffer,
  exportAndDownload,
  openEditor,
  openEditorWith,
  pdfPageCount,
  pngSize,
  uploadPrompt,
  zipEntries,
} from './helpers'

const download = (page: Parameters<typeof openEditor>[0]) => page.getByRole('button', { name: 'Download' })
const format = (page: Parameters<typeof openEditor>[0], f: 'pdf' | 'png') =>
  page.getByRole('button', { name: new RegExp(`^${f}( \\(ZIP\\))?$`, 'i') })

test.describe('Export', () => {
  test('EXP-01 Download is disabled until there is a result', async ({ page }) => {
    await openEditor(page)
    await expect(download(page)).toBeDisabled()
    await openEditorWith(page, FIXTURES.png)
    await expect(download(page)).toBeEnabled()
  })

  test('EXP-02 PDF export keeps the page count and file name', async ({ page }) => {
    await openEditorWith(page, FIXTURES.pdf2)
    const dl = await exportAndDownload(page)
    expect(dl.suggestedFilename()).toBe('two-pages.pdf')
    const pdf = await downloadBuffer(dl)
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdfPageCount(pdf)).toBe(2)

    await openEditorWith(page, FIXTURES.png)
    const single = await exportAndDownload(page)
    expect(single.suggestedFilename()).toBe('score.pdf')
    expect(pdfPageCount(await downloadBuffer(single))).toBe(1)
  })

  test('EXP-03 PNG export: one page → .png at result size; several → .zip with one PNG per page', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await expect(format(page, 'png')).toHaveText(/^png$/i)
    await format(page, 'png').click()
    const single = await exportAndDownload(page)
    expect(single.suggestedFilename()).toBe('score.png')
    expect(pngSize(await downloadBuffer(single))).toEqual({ width: 800, height: 1000 })

    await openEditorWith(page, FIXTURES.pdf2)
    await expect(format(page, 'png')).toHaveText(/ZIP/)
    await format(page, 'png').click()
    const zip = await exportAndDownload(page)
    expect(zip.suggestedFilename()).toBe('two-pages.zip')
    expect(await zipEntries(await downloadBuffer(zip))).toEqual(['two-pages-p1.png', 'two-pages-p2.png'])
  })

  test('EXP-04 several documents: Separate exports the active one, Merged all of them', async ({ page }) => {
    await openEditorWith(page, [FIXTURES.pdf2, FIXTURES.pdf1])
    await expect(page.getByRole('button', { name: 'Separate' })).toHaveClass(/bg-zinc-700/)
    await expect(page.getByRole('button', { name: 'Merged' })).toBeVisible()

    const separate = await exportAndDownload(page)
    expect(separate.suggestedFilename()).toBe('two-pages.pdf')
    expect(pdfPageCount(await downloadBuffer(separate))).toBe(2)

    await page.getByRole('button', { name: 'Merged' }).click()
    const merged = await exportAndDownload(page)
    expect(merged.suggestedFilename()).toBe('dark-score-batch.pdf')
    expect(pdfPageCount(await downloadBuffer(merged))).toBe(3)

    // the mode selector only applies to PDF
    await format(page, 'png').click()
    await expect(page.getByRole('button', { name: 'Merged' })).toHaveCount(0)
  })

  test('EXP-05 the DPI selector only shows when a PDF is loaded', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await expect(page.getByText('DPI')).toHaveCount(0)
    await openEditorWith(page, FIXTURES.pdf1)
    await expect(page.getByText('DPI')).toBeVisible()
    await expect(page.getByRole('button', { name: '300', exact: true })).toHaveClass(/bg-zinc-700/)
  })

  test('EXP-06 the button returns to Download after exporting and works again', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await exportAndDownload(page)
    await expect(download(page)).toHaveText('Download')
    await expect(download(page)).toBeEnabled()
    const again = await exportAndDownload(page)
    expect(again.suggestedFilename()).toBe('score.pdf')
  })
})

test.describe('Persistence', () => {
  test('PERS-01 DPI and export mode survive a reload', async ({ page }) => {
    await openEditorWith(page, [FIXTURES.pdf1, FIXTURES.pdf2])
    await page.getByRole('button', { name: '200', exact: true }).click()
    await page.getByRole('button', { name: 'Merged' }).click()
    await expect(page.getByRole('button', { name: 'Merged' })).toHaveClass(/bg-zinc-700/)

    await page.reload()
    await openEditorWith(page, [FIXTURES.pdf1, FIXTURES.pdf2])
    await expect(page.getByRole('button', { name: '200', exact: true })).toHaveClass(/bg-zinc-700/)
    await expect(page.getByRole('button', { name: 'Merged' })).toHaveClass(/bg-zinc-700/)
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('dark-score-settings') ?? '{}'))
    expect(stored.state).toEqual({ exportDpi: 200, exportMode: 'merged' })
  })

  test('PERS-02 documents are not persisted: a reload shows the empty drop zone', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await page.reload()
    await expect(page.getByRole('button', { name: uploadPrompt() })).toBeVisible()
    await expect(page.getByRole('tab')).toHaveCount(0)
    const keys = await page.evaluate(() => Object.keys(localStorage))
    expect(keys.join(' ')).not.toMatch(/document|pages|score\.png/)
  })
})
