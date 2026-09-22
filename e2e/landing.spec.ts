import { test, expect } from '@playwright/test'
import { FIXTURES, dropFiles, pickFiles, previewCanvas, waitForResult } from './helpers'

test.describe('Landing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('LAND-01 shows the headline, the drop zone and the sample link', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Convert your sheet music to dark mode')
    await expect(page.getByRole('button', { name: 'Drag your scores here' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try with a sample score' })).toBeVisible()
  })

  test('LAND-02 picking a file on the landing opens the editor with it processed', async ({ page }) => {
    await pickFiles(page, FIXTURES.pdf2)
    await expect(page).toHaveURL(/\/app$/)
    await waitForResult(page)
    await expect(page.getByRole('tab', { name: /two-pages/ })).toBeVisible()
    await expect(page.getByText('1 / 2')).toBeVisible()
  })

  test('LAND-02 dropping a file on the landing opens the editor with it processed', async ({ page }) => {
    await dropFiles(page.getByRole('button', { name: 'Drag your scores here' }), [
      { name: 'dropped.png', type: 'image/png', path: FIXTURES.png },
    ])
    await expect(page).toHaveURL(/\/app$/)
    await waitForResult(page)
    await expect(page.getByRole('tab', { name: /dropped/ })).toBeVisible()
  })

  test('LAND-03 the sample score opens the editor without a file', async ({ page }) => {
    await page.getByRole('button', { name: 'Try with a sample score' }).click()
    await expect(page).toHaveURL(/\/app$/)
    await waitForResult(page)
    await expect(page.getByRole('tab', { name: /sample-score/ })).toBeVisible()
    await expect(previewCanvas(page)).toBeVisible()
  })

  test('LAND-04 the before/after demo has both labels and a draggable divider', async ({ page }) => {
    const demo = page.getByRole('slider', { name: /compare the original/i })
    await expect(demo).toBeVisible()
    await expect(page.getByText('Original', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Dark stage', { exact: true }).first()).toBeVisible()
    const before = await demo.inputValue()
    const box = (await demo.boundingBox())!
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 5 })
    await page.mouse.up()
    await expect.poll(() => demo.inputValue()).not.toBe(before)
  })

  test('LAND-05 has how-it-works, use cases, privacy, FAQ and the final CTA', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
    await expect(page.locator('ol li')).toHaveCount(3)
    await expect(page.getByRole('heading', { name: 'Who is it for?' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your scores never leave your device' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible()
    await expect(page.getByText('Is Dark Score free?')).toBeVisible()
    await expect(page.getByText('Why not just invert colors in my PDF reader?')).toBeVisible()
    const cta = page.getByRole('link', { name: 'Get started' })
    await expect(cta).toHaveAttribute('href', '/app')
    await cta.click()
    await expect(page).toHaveURL(/\/app$/)
    await expect(page.getByRole('button', { name: 'Drag your scores here' })).toBeVisible()
  })

  test('LAND-06 header links go to About, the app and the other language', async ({ page }) => {
    const header = page.locator('header')
    await expect(header.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    await expect(header.getByRole('link', { name: 'Open the app' })).toHaveAttribute('href', '/app')
    await expect(header.getByRole('link', { name: 'ES' })).toHaveAttribute('href', '/es')
    await header.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Dark Score')
  })

  test('LAND-07 an unsupported file shows an error and stays on the landing', async ({ page }) => {
    await pickFiles(page, FIXTURES.txt)
    await expect(page.getByRole('alert')).toHaveText('notes.txt: unsupported format. Use PDF, PNG or JPG.')
    await expect(page).toHaveURL(/\/$/)
  })
})
