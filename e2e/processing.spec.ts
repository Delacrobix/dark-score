import { test, expect } from '@playwright/test'
import { basename } from 'node:path'
import { mkdirSync, readFileSync } from 'node:fs'
import {
  FIXTURES,
  PRESETS,
  openEditorWith,
  pdfPageCount,
  pixelStats,
  presetButton,
  presetColors,
  previewCanvas,
  realScores,
  renderedColor,
  setSlider,
  setZoom,
  sliderByLabel,
  sliderReset,
  sliderValue,
  waitForResult,
  type PresetKey,
} from './helpers'

test.describe('Processing', () => {
  test('PROC-01 the initial preset is Dark stage with its default values', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await expect(presetButton(page, 'Dark stage')).toHaveClass(/border-purple-500/)
    await expect(sliderValue(page, 'Contrast')).toHaveText('110%')
    await expect(sliderValue(page, 'Brightness')).toHaveText('100%')
    await expect(sliderValue(page, 'Scan cleaning')).toHaveText('140')
    await expect(sliderValue(page, 'Line thickening')).toHaveText('0')
    await expect(page.getByRole('button', { name: 'Smooth' })).toHaveClass(/bg-zinc-700/)
    await expect(page.getByRole('button', { name: 'Sharp' })).not.toHaveClass(/bg-zinc-700/)
  })

  test('PROC-02 Dark stage turns black-on-white into white-on-black', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    const stats = await pixelStats(previewCanvas(page), '#000000', '#ffffff')
    expect(stats.bg).toBeGreaterThan(0.85)
    expect(stats.fg).toBeGreaterThan(0.01)
    expect(stats.fg).toBeLessThan(0.2)
  })

  test('PROC-03 every fixed preset applies its colors and default values', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    for (const key of (Object.keys(PRESETS) as PresetKey[]).filter((k) => k !== 'custom')) {
      const preset = PRESETS[key]
      await presetButton(page, preset.name).click()
      await expect(presetButton(page, preset.name)).toHaveClass(/border-purple-500/)
      await expect(sliderValue(page, 'Contrast')).toHaveText(`${preset.contrast}%`)
      await expect(sliderValue(page, 'Brightness')).toHaveText(`${preset.brightness}%`)
      await expect(sliderValue(page, 'Scan cleaning')).toHaveText(`${preset.threshold}`)
      await expect(sliderValue(page, 'Line thickening')).toHaveText('0')
      await waitForResult(page)
      const { bg, fg } = presetColors(key)
      const stats = await pixelStats(previewCanvas(page), bg, fg, 12)
      expect(stats.bg, `${key} background ${bg}`).toBeGreaterThan(0.85)
      expect(stats.fg, `${key} notation ${fg}`).toBeGreaterThan(0.01)
    }
  })

  test('PROC-04 Custom keeps the current values, exposes color pickers and applies the chosen background', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await expect(page.locator('input[type=color]')).toHaveCount(0)
    await presetButton(page, 'Orchestra pit').click()
    await presetButton(page, 'Custom').click()
    await expect(presetButton(page, 'Custom')).toHaveClass(/border-purple-500/)
    // values and colors carried over from Orchestra pit
    await expect(sliderValue(page, 'Brightness')).toHaveText(`${PRESETS.pit.brightness}%`)
    await expect(sliderValue(page, 'Scan cleaning')).toHaveText(`${PRESETS.pit.threshold}`)
    const pickers = page.locator('input[type=color]')
    await expect(pickers).toHaveCount(2)
    await expect(pickers.nth(0)).toHaveValue(PRESETS.pit.bg)
    await expect(pickers.nth(1)).toHaveValue(PRESETS.pit.fg)
    await expect(page.getByText('Background')).toBeVisible()
    await expect(page.getByText('Notation')).toBeVisible()

    await pickers.nth(0).fill('#203040')
    await pickers.nth(0).blur()
    await waitForResult(page)
    const bg = renderedColor('#203040', PRESETS.pit.brightness, PRESETS.pit.contrast)
    const stats = await pixelStats(previewCanvas(page), bg, '#ffffff', 12)
    expect(stats.bg).toBeGreaterThan(0.85)
  })

  test('PROC-05 sliders have their ranges, show their value and re-process', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    for (const [label, min, max] of [
      ['Contrast', 0, 200],
      ['Brightness', 0, 200],
      ['Scan cleaning', 0, 255],
      ['Line thickening', 0, 3],
    ] as const) {
      const slider = sliderByLabel(page, label)
      await expect(slider).toHaveAttribute('min', String(min))
      await expect(slider).toHaveAttribute('max', String(max))
    }
    await setSlider(sliderByLabel(page, 'Brightness'), 50)
    await expect(sliderValue(page, 'Brightness')).toHaveText('50%')
    await waitForResult(page)
    // white notation at 50% brightness, 110% contrast
    const fg = renderedColor('#ffffff', 50, 110)
    const stats = await pixelStats(previewCanvas(page), '#000000', fg, 12)
    expect(stats.fg).toBeGreaterThan(0.01)
  })

  test('PROC-06 ↺ restores the default of the active preset', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await presetButton(page, 'Jazz').click()
    await setSlider(sliderByLabel(page, 'Scan cleaning'), 200)
    await expect(sliderValue(page, 'Scan cleaning')).toHaveText('200')
    await sliderReset(page, 'Scan cleaning').click()
    await expect(sliderValue(page, 'Scan cleaning')).toHaveText(`${PRESETS.jazz.threshold}`)
  })

  test('PROC-07 the dense-passages warning appears from thickening level 2', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    const warning = page.getByText('High level: notes in dense passages may bleed together.')
    await expect(warning).toHaveCount(0)
    await setSlider(sliderByLabel(page, 'Line thickening'), 1)
    await expect(warning).toHaveCount(0)
    await setSlider(sliderByLabel(page, 'Line thickening'), 2)
    await expect(warning).toBeVisible()
    await setSlider(sliderByLabel(page, 'Line thickening'), 3)
    await expect(warning).toBeVisible()
  })

  test('PROC-08 thickening increases the amount of notation pixels', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    const before = await pixelStats(previewCanvas(page), '#000000', '#ffffff')
    await setSlider(sliderByLabel(page, 'Line thickening'), 3)
    await waitForResult(page)
    const after = await pixelStats(previewCanvas(page), '#000000', '#ffffff')
    expect(after.fg).toBeGreaterThan(before.fg * 1.5)
  })

  test('PROC-09 Sharp cleaning gives a binary result, Smooth keeps anti-aliasing', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    const smooth = await pixelStats(previewCanvas(page), '#000000', '#ffffff', 8)
    await page.getByRole('button', { name: 'Sharp' }).click()
    await expect(page.getByRole('button', { name: 'Sharp' })).toHaveClass(/bg-zinc-700/)
    await waitForResult(page)
    const sharp = await pixelStats(previewCanvas(page), '#000000', '#ffffff', 8)
    expect(sharp.other).toBeLessThan(0.001)
    expect(sharp.other).toBeLessThan(smooth.other)
  })

  test('PROC-10 a yellowed, noisy scan comes out with a clean uniform background', async ({ page }) => {
    await openEditorWith(page, FIXTURES.scan)
    const stats = await pixelStats(previewCanvas(page), '#000000', '#ffffff', 24)
    expect(stats.bg).toBeGreaterThan(0.9)
    expect(stats.fg).toBeGreaterThan(0.01)
    expect(stats.other).toBeLessThan(0.02)
    mkdirSync('e2e/.review', { recursive: true })
    await previewCanvas(page).screenshot({ path: 'e2e/.review/scan-fixture-dark-stage.png' })
  })

  test('PROC-11 the previous result stays on screen while settings re-process', async ({ page }) => {
    await openEditorWith(page, FIXTURES.pdf1)
    await setSlider(sliderByLabel(page, 'Contrast'), 150)
    // never back to the loading bar: the canvas stays mounted
    await expect(page.getByText(/Processing\.\.\./)).toHaveCount(0)
    await expect(previewCanvas(page)).toBeVisible()
    await waitForResult(page)
    await expect(sliderValue(page, 'Contrast')).toHaveText('150%')
  })

  test('PROC-13 the DPI sets the render resolution of PDFs and re-renders on change', async ({ page }) => {
    await openEditorWith(page, FIXTURES.pdf1) // letter: 612 x 792 pt
    const at300 = await pixelStats(previewCanvas(page), '#000000', '#ffffff')
    expect(at300.width).toBe(2550)
    expect(at300.height).toBe(3300)

    await page.getByRole('button', { name: '200', exact: true }).click()
    await expect.poll(async () => (await pixelStats(previewCanvas(page), '#000000', '#ffffff')).width, { timeout: 30_000 }).toBe(1700)
    await waitForResult(page)
    const at200 = await pixelStats(previewCanvas(page), '#000000', '#ffffff')
    expect(at200.height).toBe(2200)
    expect(at200.bg).toBeGreaterThan(0.85)
  })

  test('PROC-14 settings are per document; "Apply to all" copies them', async ({ page }) => {
    await openEditorWith(page, [FIXTURES.png, FIXTURES.jpg])
    const tabs = page.getByRole('tab')
    await presetButton(page, 'Orchestra pit').click()
    await waitForResult(page)

    await tabs.nth(1).click()
    await waitForResult(page)
    await expect(presetButton(page, 'Dark stage')).toHaveClass(/border-purple-500/)
    await expect(presetButton(page, 'Orchestra pit')).not.toHaveClass(/border-purple-500/)

    await tabs.nth(0).click()
    await page.getByRole('button', { name: 'Apply to all documents' }).click()
    await tabs.nth(1).click()
    await waitForResult(page)
    await expect(presetButton(page, 'Orchestra pit')).toHaveClass(/border-purple-500/)
    const { bg, fg } = presetColors('pit')
    const stats = await pixelStats(previewCanvas(page), bg, fg, 12)
    expect(stats.bg).toBeGreaterThan(0.85)
  })
})

test.describe('Real scores', () => {
  const scores = realScores()
  test.skip(scores.length === 0, 'test_scores/ not present')

  for (const file of scores) {
    const name = basename(file, '.pdf')
    test(`PROC-12 ${name} loads, processes and is mostly background with notation`, async ({ page }) => {
      test.setTimeout(120_000)
      await openEditorWith(page, file)
      const pages = pdfPageCount(readFileSync(file))
      if (pages > 1) await expect(page.locator('main').getByText(`1 / ${pages}`)).toBeVisible()

      const stats = await pixelStats(previewCanvas(page), '#000000', '#ffffff', 24)
      expect(stats.bg, 'background').toBeGreaterThan(0.75)
      expect(stats.fg, 'notation').toBeGreaterThan(0.005)
      expect(stats.other, 'neither background nor notation').toBeLessThan(0.08)

      // Review images: the whole page at 30% (a 300 DPI page is ~2550 px wide), result and side-by-side
      mkdirSync('e2e/.review', { recursive: true })
      const safe = name.replace(/[^\w-]+/g, '_')
      await setZoom(page, 30)
      const stage = page.locator('main > div').first()
      await stage.screenshot({ path: `e2e/.review/${safe}-p1-dark-stage.png` })
      await page.getByRole('button', { name: 'Compare' }).click()
      await expect(page.locator('main canvas')).toHaveCount(2)
      await stage.screenshot({ path: `e2e/.review/${safe}-p1-compare.png` })
    })
  }
})
