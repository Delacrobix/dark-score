import { test, expect, type Page } from '@playwright/test'
import { FIXTURES, openEditorWith, presetButton, previewCanvas, uploadPrompt } from './helpers'

// Runs under the `ipad` and `iphone` projects (see playwright.config.ts).

async function noHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth, 'page wider than the viewport').toBeLessThanOrEqual(clientWidth)
}

/** A finger drag through the real touch input pipeline (CDP), not synthetic DOM events. */
async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] })
  const steps = 8
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }],
    })
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

test('RESP-01 landing and About fit the screen with the key elements visible', async ({ page }) => {
  await page.goto('/')
  await noHorizontalScroll(page)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: uploadPrompt() })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Get started' })).toBeAttached()
  await page.goto('/about')
  await noHorizontalScroll(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Dark Score')
})

test('RESP-02 on a phone the editor has a ☰ menu and the controls go below the preview', async ({ page, isMobile }) => {
  test.skip(!isMobile || page.viewportSize()!.width >= 768, 'phone layout only')
  await openEditorWith(page, FIXTURES.png)
  await noHorizontalScroll(page)

  const menu = page.getByRole('button', { name: 'Menu' })
  await expect(menu).toBeVisible()
  await expect(page.getByRole('link', { name: 'About' })).toBeHidden()
  await menu.click()
  await expect(page.getByRole('button', { name: '← New score' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'About' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Support the project' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'ES', exact: true })).toBeVisible()
  await expect(page.getByText('Local processing', { exact: true })).toBeVisible()
  await menu.click()

  const preview = (await previewCanvas(page).boundingBox())!
  const presets = (await presetButton(page, 'Dark stage').boundingBox())!
  expect(presets.y).toBeGreaterThan(preview.y)
})

test('RESP-03 on a tablet the editor loads and processes a PDF and fits the screen', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 768, 'tablet only')
  await openEditorWith(page, FIXTURES.pdf2)
  await noHorizontalScroll(page)
  await expect(page.locator('main').getByText('1 / 2')).toBeVisible()
  await expect(presetButton(page, 'Dark stage')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download' })).toBeEnabled()
})

test('RESP-04 the Compare divider follows a finger drag', async ({ page }) => {
  await openEditorWith(page, FIXTURES.png)
  await page.getByRole('button', { name: 'Compare' }).click()
  // zoom out so the whole page (and its divider) fits a phone screen
  await page.getByRole('button', { name: /^\d+%$/ }).click()
  await page.locator('input[type=number]').fill('25')
  await page.locator('input[type=number]').press('Enter')
  const divider = page.locator('main div.cursor-col-resize')
  const before = await divider.evaluate((el) => (el as HTMLElement).style.left)
  const box = (await divider.boundingBox())!
  const y = box.y + Math.min(80, box.height / 2)
  await touchDrag(page, { x: box.x + box.width / 2, y }, { x: box.x + box.width / 2 + 90, y })
  await expect.poll(() => divider.evaluate((el) => (el as HTMLElement).style.left)).not.toBe(before)
})

test.describe('landscape tablet', () => {
  test.use({ viewport: { width: 1080, height: 810 } })

  test('RESP-05 the controls panel can be resized with a finger', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    const handle = page.getByRole('button', { name: 'Resize panel' })
    await expect(handle).toBeVisible()
    const panel = handle.locator('xpath=..')
    const before = (await panel.boundingBox())!.width
    const box = (await handle.boundingBox())!
    await touchDrag(page, { x: box.x + box.width / 2, y: box.y + 200 }, { x: box.x + box.width / 2 - 120, y: box.y + 200 })
    await expect.poll(async () => (await panel.boundingBox())!.width).toBeGreaterThan(before + 50)
  })
})

test('RESP-06 sliders commit to history when the finger lifts', async ({ page }) => {
  await openEditorWith(page, FIXTURES.png)
  const history = page.getByRole('button', { name: /^History/ })
  await expect(history).toContainText('(1)')
  const slider = page.locator('input[type=range]').first() // Contrast
  await slider.scrollIntoViewIfNeeded()
  const box = (await slider.boundingBox())!
  const y = box.y + box.height / 2
  await touchDrag(page, { x: box.x + box.width * 0.55, y }, { x: box.x + box.width * 0.8, y })
  await expect(history).toContainText('(2)')
})
