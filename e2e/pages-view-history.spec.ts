import { test, expect } from '@playwright/test'
import {
  FIXTURES,
  canvasFingerprint,
  openEditorWith,
  presetButton,
  previewCanvas,
  setSlider,
  sliderByLabel,
  sliderValue,
  uploadPrompt,
  waitForResult,
} from './helpers'

const prev = (page: Parameters<typeof previewCanvas>[0]) => page.getByRole('button', { name: '‹' })
const next = (page: Parameters<typeof previewCanvas>[0]) => page.getByRole('button', { name: '›' })
const zoomLabel = (page: Parameters<typeof previewCanvas>[0]) => page.getByRole('button', { name: /^\d+%$/ })

test.describe('Pages and documents', () => {
  test('PAGE-01 multi-page PDFs paginate, with the edges disabled and distinct pages', async ({ page }) => {
    await openEditorWith(page, FIXTURES.pdf2)
    await expect(page.locator('main').getByText('1 / 2')).toBeVisible()
    await expect(prev(page)).toBeDisabled()
    await expect(next(page)).toBeEnabled()
    const page1 = await canvasFingerprint(previewCanvas(page))

    await next(page).click()
    await expect(page.locator('main').getByText('2 / 2')).toBeVisible()
    await expect(next(page)).toBeDisabled()
    await expect(prev(page)).toBeEnabled()
    await waitForResult(page)
    const page2 = await canvasFingerprint(previewCanvas(page))
    expect(page2).not.toBe(page1)

    await prev(page).click()
    await expect(page.locator('main').getByText('1 / 2')).toBeVisible()
  })

  test('PAGE-02 clicking a tab switches document, preview and settings', async ({ page }) => {
    await openEditorWith(page, [FIXTURES.pdf1, FIXTURES.png])
    const tabs = page.getByRole('tab')
    await expect(tabs.nth(0)).toHaveClass(/text-purple-300/)
    await expect(previewCanvas(page)).toHaveJSProperty('width', 2550)
    await presetButton(page, 'Jazz').click()

    await tabs.nth(1).click()
    await expect(tabs.nth(1)).toHaveClass(/text-purple-300/)
    await expect(tabs.nth(0)).not.toHaveClass(/text-purple-300/)
    await waitForResult(page)
    await expect(previewCanvas(page)).toHaveJSProperty('width', 800)
    await expect(presetButton(page, 'Dark stage')).toHaveClass(/border-purple-500/)

    await tabs.nth(0).click()
    await expect(presetButton(page, 'Jazz')).toHaveClass(/border-purple-500/)
  })

  test('PAGE-03 closing tabs removes documents; closing the last shows the drop zone', async ({ page }) => {
    await openEditorWith(page, [FIXTURES.pdf1, FIXTURES.png, FIXTURES.jpg])
    const tabs = page.getByRole('tab')
    await expect(tabs).toHaveCount(3)

    await page.getByRole('button', { name: 'Remove one-page' }).click()
    await expect(tabs).toHaveCount(2)
    await expect(tabs.nth(0)).toHaveClass(/text-purple-300/)
    await expect(tabs.nth(0)).toContainText('score')

    await page.getByRole('button', { name: /^Remove/ }).last().click()
    await page.getByRole('button', { name: /^Remove/ }).last().click()
    await expect(tabs).toHaveCount(0)
    await expect(page.getByRole('button', { name: uploadPrompt() })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download' })).toBeDisabled()
  })

  test('PAGE-04 the tab shows the file name without extension', async ({ page }) => {
    await openEditorWith(page, FIXTURES.pdf2)
    await expect(page.getByRole('tab').first()).toHaveText(/^two-pages\s*x$/)
  })
})

test.describe('Zoom and compare', () => {
  test('VIEW-01 zoom steps by 25 between 1% and 500% and scales the preview', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await expect(zoomLabel(page)).toHaveText('100%')
    const box100 = (await previewCanvas(page).boundingBox())!
    expect(Math.round(box100.width)).toBe(800)

    await page.getByRole('button', { name: '−', exact: true }).click()
    await expect(zoomLabel(page)).toHaveText('75%')
    const box75 = (await previewCanvas(page).boundingBox())!
    expect(Math.round(box75.width)).toBe(600)

    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '−', exact: true }).click()
    await expect(zoomLabel(page)).toHaveText('1%')
    await expect(page.getByRole('button', { name: '−', exact: true })).toBeDisabled()

    await page.getByRole('button', { name: '+', exact: true }).click()
    await expect(zoomLabel(page)).toHaveText('26%')
  })

  test('VIEW-02 the percentage can be typed; Enter applies (clamped), Escape cancels', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await zoomLabel(page).click()
    const input = page.locator('input[type=number]')
    await input.fill('300')
    await input.press('Enter')
    await expect(zoomLabel(page)).toHaveText('300%')

    await zoomLabel(page).click()
    await input.fill('9999')
    await input.press('Enter')
    await expect(zoomLabel(page)).toHaveText('500%')
    await expect(page.getByRole('button', { name: '+', exact: true })).toBeDisabled()

    await zoomLabel(page).click()
    await input.fill('50')
    await input.press('Escape')
    await expect(zoomLabel(page)).toHaveText('500%')
  })

  test('VIEW-03 Ctrl + wheel over the preview zooms', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    const box = (await previewCanvas(page).boundingBox())!
    await page.mouse.move(box.x + 50, box.y + 50)
    await page.keyboard.down('Control')
    await page.mouse.wheel(0, -100)
    await page.keyboard.up('Control')
    await expect(zoomLabel(page)).toHaveText('125%')
    // plain wheel does not zoom
    await page.mouse.wheel(0, -100)
    await expect(zoomLabel(page)).toHaveText('125%')
  })

  test('VIEW-04 zoom is kept across pages and documents', async ({ page }) => {
    await openEditorWith(page, [FIXTURES.pdf2, FIXTURES.png])
    await page.getByRole('button', { name: '+', exact: true }).click()
    await page.getByRole('button', { name: '+', exact: true }).click()
    await expect(zoomLabel(page)).toHaveText('150%')
    await next(page).click()
    await expect(zoomLabel(page)).toHaveText('150%')
    await page.getByRole('tab').nth(1).click()
    await waitForResult(page)
    await expect(zoomLabel(page)).toHaveText('150%')
  })

  test('VIEW-06 the controls panel can be resized by dragging its edge with the mouse', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    const handle = page.getByRole('button', { name: 'Resize panel' })
    const panel = handle.locator('xpath=..')
    const before = (await panel.boundingBox())!.width
    const box = (await handle.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + 200)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 - 120, box.y + 200, { steps: 6 })
    await page.mouse.up()
    await expect.poll(async () => (await panel.boundingBox())!.width).toBeGreaterThan(before + 50)

    // and it stops following the pointer once released
    const after = (await panel.boundingBox())!.width
    await page.mouse.move(box.x + box.width / 2 - 300, box.y + 200)
    expect((await panel.boundingBox())!.width).toBe(after)
  })

  test('VIEW-05 Compare shows original and result with a draggable divider', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await page.getByRole('button', { name: 'Compare' }).click()
    await expect(page.locator('main canvas')).toHaveCount(2)
    await expect(page.getByText('Original', { exact: true })).toBeVisible()
    await expect(page.getByText('Result', { exact: true })).toBeVisible()

    const divider = page.locator('main div.cursor-col-resize')
    const before = await divider.evaluate((el) => (el as HTMLElement).style.left)
    const box = (await divider.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + 100)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + 100, { steps: 6 })
    await page.mouse.up()
    const after = await divider.evaluate((el) => (el as HTMLElement).style.left)
    expect(after).not.toBe(before)

    await page.getByRole('button', { name: 'Compare' }).click()
    await expect(page.locator('main canvas')).toHaveCount(1)
  })
})

test.describe('History', () => {
  const historyButton = (page: Parameters<typeof previewCanvas>[0]) => page.getByRole('button', { name: /^History/ })
  const entries = (page: Parameters<typeof previewCanvas>[0]) => page.locator('main ul li')

  test('HIST-01 every committed change adds an entry, newest first and highlighted', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await expect(historyButton(page)).toContainText('(1)')
    await historyButton(page).click()
    await expect(entries(page)).toHaveCount(1)
    await expect(entries(page).first().locator('button')).toHaveClass(/bg-purple-500\/10/)

    await presetButton(page, 'Night study').click()
    await expect(historyButton(page)).toContainText('(2)')
    await page.getByRole('button', { name: 'Sharp' }).click()
    await expect(historyButton(page)).toContainText('(3)')
    await setSlider(sliderByLabel(page, 'Contrast'), 140)
    await expect(historyButton(page)).toContainText('(4)')

    await expect(entries(page)).toHaveCount(4)
    await expect(entries(page).first()).toContainText('Night study')
    await expect(entries(page).first()).toContainText('140%')
    await expect(entries(page).first().locator('button')).toHaveClass(/bg-purple-500\/10/)
    await expect(entries(page).last()).toContainText('Dark stage')
  })

  test('HIST-02 restoring an entry applies its settings and re-processes', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await presetButton(page, 'Orchestra pit').click()
    await setSlider(sliderByLabel(page, 'Brightness'), 60)
    await historyButton(page).click()
    await expect(entries(page)).toHaveCount(3)

    await entries(page).last().locator('button').click() // the initial Dark stage entry
    await expect(presetButton(page, 'Dark stage')).toHaveClass(/border-purple-500/)
    await expect(sliderValue(page, 'Brightness')).toHaveText('100%')
    await expect(sliderValue(page, 'Contrast')).toHaveText('110%')
    await expect(entries(page).last().locator('button')).toHaveClass(/bg-purple-500\/10/)
    await waitForResult(page)
  })

  test('HIST-03 dragging a slider without releasing does not add entries', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await setSlider(sliderByLabel(page, 'Contrast'), 120, false)
    await setSlider(sliderByLabel(page, 'Contrast'), 130, false)
    await expect(sliderValue(page, 'Contrast')).toHaveText('130%')
    await expect(historyButton(page)).toContainText('(1)')
    await setSlider(sliderByLabel(page, 'Contrast'), 130, true)
    await expect(historyButton(page)).toContainText('(2)')
  })

  test('HIST-04 history is per document', async ({ page }) => {
    await openEditorWith(page, [FIXTURES.png, FIXTURES.jpg])
    await presetButton(page, 'Jazz').click()
    await presetButton(page, 'Classical').click()
    await expect(historyButton(page)).toContainText('(3)')
    await page.getByRole('tab').nth(1).click()
    await expect(historyButton(page)).toContainText('(1)')
    await page.getByRole('tab').nth(0).click()
    await expect(historyButton(page)).toContainText('(3)')
  })
})
