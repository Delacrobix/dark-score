import { test, expect } from '@playwright/test'
import {
  FIXTURES,
  MAX_SIZE_MB,
  dropFiles,
  openEditor,
  openEditorWith,
  pickFiles,
  presetButton,
  previewCanvas,
  realScores,
  uploadPrompt,
  waitForResult,
} from './helpers'

test.describe('Upload', () => {
  test('UP-01 the editor drop zone accepts PDF, PNG and JPG via the file picker', async ({ page }) => {
    for (const [file, label] of [
      [FIXTURES.pdf1, 'one-page'],
      [FIXTURES.png, 'score'],
      [FIXTURES.jpg, 'score'],
    ] as const) {
      await openEditorWith(page, file)
      await expect(page.getByRole('tab', { name: new RegExp(label) })).toBeVisible()
      await expect(previewCanvas(page)).toBeVisible()
    }
  })

  test('UP-02 files can be dragged and dropped onto the zone', async ({ page }) => {
    await openEditor(page)
    await dropFiles(page.getByRole('button', { name: uploadPrompt() }), [
      { name: 'dropped-a.pdf', type: 'application/pdf', path: FIXTURES.pdf1 },
      { name: 'dropped-b.png', type: 'image/png', path: FIXTURES.png },
    ])
    await waitForResult(page)
    await expect(page.getByRole('tab')).toHaveCount(2)
    await expect(page.getByRole('tab', { name: /dropped-a/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /dropped-b/ })).toBeVisible()
  })

  test('UP-03 several files at once become one tab each, the first new one active', async ({ page }) => {
    await openEditorWith(page, [FIXTURES.pdf2, FIXTURES.png, FIXTURES.jpg])
    const tabs = page.getByRole('tab')
    await expect(tabs).toHaveCount(3)
    await expect(tabs.nth(0)).toContainText('two-pages')
    await expect(tabs.nth(0)).toHaveClass(/text-purple-300/)
    await expect(tabs.nth(1)).not.toHaveClass(/text-purple-300/)
    await expect(page.getByText('1 / 2')).toBeVisible()
  })

  test('UP-04 an unsupported format is refused with a message naming the file', async ({ page }) => {
    await openEditor(page)
    await pickFiles(page, FIXTURES.txt)
    await expect(page.getByRole('alert')).toHaveText('notes.txt: unsupported format. Use PDF, PNG or JPG.')
    await expect(page.getByRole('tab')).toHaveCount(0)
  })

  test(`UP-05 a file over ${MAX_SIZE_MB} MB is refused with a message`, async ({ page }) => {
    await openEditor(page)
    await dropFiles(page.getByRole('button', { name: uploadPrompt() }), [
      { name: 'huge.pdf', type: 'application/pdf', sizeBytes: MAX_SIZE_MB * 1024 * 1024 + 1 },
    ])
    await expect(page.getByRole('alert')).toHaveText(`huge.pdf: over ${MAX_SIZE_MB} MB.`)
    await expect(page.getByRole('tab')).toHaveCount(0)
  })

  test('UP-06 a batch keeps the valid files and reports the rejected ones', async ({ page }) => {
    await openEditor(page)
    await pickFiles(page, [FIXTURES.png, FIXTURES.txt, FIXTURES.pdf1])
    await waitForResult(page)
    await expect(page.getByRole('tab')).toHaveCount(2)
    await expect(page.getByRole('tab', { name: /score/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /one-page/ })).toBeVisible()
    await expect(page.getByRole('alert')).toHaveText('notes.txt: unsupported format. Use PDF, PNG or JPG.')
  })

  test('UP-06 the report survives the jump from the landing to the editor', async ({ page }) => {
    await page.goto('/')
    await pickFiles(page, [FIXTURES.png, FIXTURES.txt])
    await expect(page).toHaveURL(/\/app$/)
    await waitForResult(page)
    await expect(page.getByRole('tab')).toHaveCount(1)
    await expect(page.getByRole('alert')).toHaveText('notes.txt: unsupported format. Use PDF, PNG or JPG.')
  })

  test('UP-06 every rejected file is listed, by its own reason', async ({ page }) => {
    await openEditor(page)
    await dropFiles(page.getByRole('button', { name: uploadPrompt() }), [
      { name: 'good.png', type: 'image/png', path: FIXTURES.png },
      { name: 'notes.txt', type: 'text/plain', path: FIXTURES.txt },
      { name: 'huge.pdf', type: 'application/pdf', sizeBytes: MAX_SIZE_MB * 1024 * 1024 + 1 },
    ])
    await waitForResult(page)
    await expect(page.getByRole('tab')).toHaveCount(1)
    const alert = page.getByRole('alert')
    await expect(alert).toContainText('notes.txt: unsupported format')
    await expect(alert).toContainText(`huge.pdf: over ${MAX_SIZE_MB} MB.`)

    // a clean selection afterwards clears the report
    await pickFiles(page, FIXTURES.jpg)
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('tab')).toHaveCount(2)
  })

  test('UP-06 "+ Add files" applies the same rules', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await pickFiles(page, [FIXTURES.txt, FIXTURES.pdf1])
    await waitForResult(page)
    await expect(page.getByRole('tab')).toHaveCount(2)
    await expect(page.getByRole('alert')).toContainText('notes.txt: unsupported format')
  })

  test('UP-07 "+ Add files" adds documents with the settings of the active one', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await presetButton(page, 'Night study').click()
    await waitForResult(page)

    await expect(page.getByRole('button', { name: '+ Add files' })).toBeVisible()
    await pickFiles(page, FIXTURES.pdf1) // the tabs' file input: the drop zone is gone once a document exists
    await waitForResult(page)

    await expect(page.getByRole('tab')).toHaveCount(2)
    await expect(page.getByRole('tab').nth(1)).toHaveClass(/text-purple-300/)
    await expect(presetButton(page, 'Night study')).toHaveClass(/border-purple-500/)
  })

  test('UP-08 after loading, the progress bar is gone and the tab shows no percentage', async ({ page }) => {
    await openEditorWith(page, FIXTURES.pdf2)
    await expect(page.getByText(/Processing\.\.\./)).toHaveCount(0)
    await expect(page.getByRole('tab').first()).not.toContainText('%')
    await expect(page.locator('main').getByText('1 / 2')).toBeVisible()
  })

  test('UP-09 adding a document while another loads does not interrupt it', async ({ page }) => {
    // A real multi-page score takes longer to render, which makes the overlap real
    const big = realScores().find((f) => /Brisas|Bandola 1\.pdf$/.test(f)) ?? FIXTURES.pdf2
    await openEditor(page)
    await pickFiles(page, big)
    await expect(page.getByRole('tab')).toHaveCount(1)
    await pickFiles(page, FIXTURES.png) // tabs input: documents already exist
    await expect(page.getByRole('tab')).toHaveCount(2)

    await page.getByRole('tab').first().click()
    await waitForResult(page, 90_000)
    await expect(page.getByRole('tab').first()).not.toContainText('%')
    await page.getByRole('tab').nth(1).click()
    await waitForResult(page)
    await expect(page.getByRole('tab').nth(1)).not.toContainText('%')
  })
})
