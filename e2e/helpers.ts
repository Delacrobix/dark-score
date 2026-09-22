import { expect, type Download, type Locator, type Page } from '@playwright/test'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import JSZip from 'jszip'

export const GENERATED_DIR = resolve('e2e/.generated')

/** Synthetic fixtures written by fixtures.setup.ts. */
export const FIXTURES = {
  pdf2: join(GENERATED_DIR, 'two-pages.pdf'),
  pdf1: join(GENERATED_DIR, 'one-page.pdf'),
  png: join(GENERATED_DIR, 'score.png'),
  jpg: join(GENERATED_DIR, 'score.jpg'),
  scan: join(GENERATED_DIR, 'scan.jpg'),
  txt: join(GENERATED_DIR, 'notes.txt'),
  corrupt: join(GENERATED_DIR, 'corrupt.pdf'),
  encrypted: join(GENERATED_DIR, 'locked.pdf'),
}

/** Real scores, kept out of git. Tests that need them skip when absent. */
export const TEST_SCORES_DIR = resolve('test_scores')

export function realScores(): string[] {
  if (!existsSync(TEST_SCORES_DIR)) return []
  return readdirSync(TEST_SCORES_DIR)
    .filter((f) => /\.(pdf|png|jpe?g)$/i.test(f))
    .sort((a, b) => a.localeCompare(b))
    .map((f) => join(TEST_SCORES_DIR, f))
}

export const MAX_SIZE_MB = 50

// ---------------------------------------------------------------------------
// Editor

/** Opens the editor (empty) in the given language. */
export async function openEditor(page: Page, lang: 'en' | 'es' = 'en') {
  await page.goto(lang === 'es' ? '/es/app' : '/app')
  await expect(page.getByRole('button', { name: uploadPrompt(lang) })).toBeVisible()
}

export function uploadPrompt(lang: 'en' | 'es' = 'en') {
  return lang === 'es' ? 'Arrastra tus partituras aquí' : 'Drag your scores here'
}

/** Picks files through the (hidden) file input. Works on the landing, the editor drop zone and the tabs. */
export async function pickFiles(page: Page, files: string | string[]) {
  await page.locator('input[type=file]').setInputFiles(files)
}

/** Opens the editor and loads files, waiting until the result is on screen. */
export async function openEditorWith(page: Page, files: string | string[], lang: 'en' | 'es' = 'en') {
  await openEditor(page, lang)
  await pickFiles(page, files)
  await waitForResult(page)
}

/** Waits until the current document has finished loading and re-processing. */
export async function waitForResult(page: Page, timeout = 45_000) {
  await expect(page.getByText(/Processing\.\.\.|Procesando\.\.\./)).toHaveCount(0, { timeout })
  await expect(previewCanvas(page)).toBeVisible({ timeout })
  // the ♪ spinner overlays the canvas while settings are re-applied
  await expect(page.locator('.animate-spin')).toHaveCount(0, { timeout })
}

/** The canvas showing the processed result (preview, not split view). */
export function previewCanvas(page: Page) {
  return page.locator('main canvas').first()
}

/** Drops files onto an element with a real DragEvent, the way a user would. */
export async function dropFiles(
  target: Locator,
  files: { name: string; type: string; path?: string; sizeBytes?: number }[]
) {
  const payload = files.map((f) => ({
    name: f.name,
    type: f.type,
    base64: f.path ? readFileSync(f.path).toString('base64') : null,
    sizeBytes: f.sizeBytes ?? 0,
  }))
  const dataTransfer = await target.evaluateHandle((_, items) => {
    const dt = new DataTransfer()
    for (const item of items) {
      const bytes = item.base64
        ? Uint8Array.from(atob(item.base64), (c) => c.charCodeAt(0))
        : new Uint8Array(item.sizeBytes)
      dt.items.add(new File([bytes], item.name, { type: item.type }))
    }
    return dt
  }, payload)
  await target.dispatchEvent('drop', { dataTransfer })
}

/**
 * Sets a range input the way React expects (native setter + input event).
 * `commit` also releases the mouse, which is what pushes the change to history.
 */
export async function setSlider(slider: Locator, value: number, commit = true) {
  await slider.evaluate((el, { v, commit }) => {
    const input = el as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, String(v))
    input.dispatchEvent(new Event('input', { bubbles: true }))
    if (commit) input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  }, { v: value, commit })
}

// A slider is: <div> <div><span>label</span> <div><span>value</span><button>↺</button></div></div> <input type=range> </div>
function sliderLabel(page: Page, label: string) {
  return page.locator(`span:text-is("${label}")`)
}

/** Range input for the given label ("Contrast", "Brightness", "Scan cleaning", "Line thickening"). */
export function sliderByLabel(page: Page, label: string) {
  return sliderLabel(page, label).locator('xpath=ancestor::div[2]//input[@type="range"]')
}

/** The value text shown next to a slider label. */
export function sliderValue(page: Page, label: string) {
  return sliderLabel(page, label).locator('xpath=following-sibling::div/span[1]')
}

/** The ↺ reset button of a slider. */
export function sliderReset(page: Page, label: string) {
  return sliderLabel(page, label).locator('xpath=following-sibling::div/button')
}

/** A preset card in the controls panel (the first <section> of the editor). */
/** Types a zoom percentage into the zoom control. */
export async function setZoom(page: Page, percent: number) {
  await page.getByRole('button', { name: /^\d+%$/ }).click()
  const input = page.locator('input[type=number]')
  await input.fill(String(percent))
  await input.press('Enter')
  await expect(page.getByRole('button', { name: `${percent}%` })).toBeVisible()
}

export function presetButton(page: Page, name: string) {
  return page.locator('section').first().getByRole('button', { name: new RegExp(`^${name}`) })
}

// ---------------------------------------------------------------------------
// Pixels

export interface PixelStats {
  /** Fraction of sampled pixels within `tolerance` of the background color. */
  bg: number
  /** Fraction within tolerance of the notation color. */
  fg: number
  /** Everything else (anti-aliasing, noise, wrong colors). */
  other: number
  width: number
  height: number
}

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * Color a preset color ends up with after the pipeline applies brightness
 * and contrast (same formula as remapColors in src/lib/imageProcessing.ts),
 * so pixel checks can use the exact expected value.
 */
export function renderedColor(hex: string, brightness: number, contrast: number): string {
  const channel = (v: number) => {
    const b = v * (brightness / 100)
    const c = (b - 128) * (contrast / 100) + 128
    return Math.max(0, Math.min(255, Math.round(c)))
  }
  return '#' + hexToRgb(hex).map((v) => channel(v).toString(16).padStart(2, '0')).join('')
}

/** Preset colors and defaults, mirrored from src/types/index.ts. */
export const PRESETS = {
  stage: { name: 'Dark stage', bg: '#000000', fg: '#ffffff', contrast: 110, brightness: 100, threshold: 140 },
  study: { name: 'Night study', bg: '#1a1a1a', fg: '#e0e0e0', contrast: 100, brightness: 95, threshold: 130 },
  pit: { name: 'Orchestra pit', bg: '#1c1410', fg: '#f5e6c8', contrast: 100, brightness: 90, threshold: 120 },
  classical: { name: 'Classical', bg: '#0f0f0f', fg: '#efefef', contrast: 115, brightness: 98, threshold: 150 },
  jazz: { name: 'Jazz', bg: '#141414', fg: '#e8e0d0', contrast: 105, brightness: 92, threshold: 115 },
  pop: { name: 'Pop / Rock', bg: '#111318', fg: '#dde3f0', contrast: 100, brightness: 100, threshold: 130 },
  bluelight: { name: 'Blue light filter', bg: '#1a1200', fg: '#ffd580', contrast: 95, brightness: 85, threshold: 125 },
  custom: { name: 'Custom', bg: '#000000', fg: '#ffffff', contrast: 100, brightness: 100, threshold: 128 },
} as const

export type PresetKey = keyof typeof PRESETS

/** Expected on-screen background and notation colors for a preset at its defaults. */
export function presetColors(key: PresetKey) {
  const p = PRESETS[key]
  return { bg: renderedColor(p.bg, p.brightness, p.contrast), fg: renderedColor(p.fg, p.brightness, p.contrast) }
}

/**
 * Samples the visible result canvas and classifies pixels as background,
 * notation or other. A correct dark-mode result is mostly `bg` with a few
 * percent of `fg` and very little `other`.
 */
export async function pixelStats(
  canvas: Locator,
  bgHex: string,
  fgHex: string,
  tolerance = 40
): Promise<PixelStats> {
  return canvas.evaluate(
    (el, { bg, fg, tol }) => {
      const c = el as HTMLCanvasElement
      const ctx = c.getContext('2d')!
      const { data } = ctx.getImageData(0, 0, c.width, c.height)
      const step = Math.max(1, Math.floor((c.width * c.height) / 400_000)) // ~400k samples max
      let nBg = 0
      let nFg = 0
      let n = 0
      const near = (i: number, [r, g, b]: number[]) =>
        Math.abs(data[i] - r) <= tol && Math.abs(data[i + 1] - g) <= tol && Math.abs(data[i + 2] - b) <= tol
      for (let p = 0; p < c.width * c.height; p += step) {
        const i = p * 4
        if (near(i, bg)) nBg++
        else if (near(i, fg)) nFg++
        n++
      }
      return { bg: nBg / n, fg: nFg / n, other: 1 - (nBg + nFg) / n, width: c.width, height: c.height }
    },
    { bg: hexToRgb(bgHex), fg: hexToRgb(fgHex), tol: tolerance }
  )
}

/** Cheap content fingerprint of a canvas, to tell two pages/results apart. */
export async function canvasFingerprint(canvas: Locator): Promise<string> {
  return canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement
    const small = document.createElement('canvas')
    small.width = 32
    small.height = 32
    small.getContext('2d')!.drawImage(c, 0, 0, 32, 32)
    const { data } = small.getContext('2d')!.getImageData(0, 0, 32, 32)
    let out = ''
    for (let i = 0; i < data.length; i += 4) out += data[i] > 128 ? '1' : '0'
    return out
  })
}

// ---------------------------------------------------------------------------
// Downloads

export async function downloadBuffer(download: Download): Promise<Buffer> {
  const path = await download.path()
  return readFileSync(path)
}

/** Number of pages in a PDF written by jsPDF (one `/Type /Page` object per page). */
export function pdfPageCount(pdf: Buffer): number {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length
}

export function pngSize(png: Buffer): { width: number; height: number } {
  if (png.toString('latin1', 1, 4) !== 'PNG') throw new Error('not a PNG')
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }
}

export async function zipEntries(zip: Buffer): Promise<string[]> {
  const z = await JSZip.loadAsync(zip)
  return Object.keys(z.files).sort((a, b) => a.localeCompare(b))
}

/** Clicks the export button and returns the download it produces. */
export async function exportAndDownload(page: Page, buttonName = /^(Download|Descargar)$/): Promise<Download> {
  const waiting = page.waitForEvent('download', { timeout: 60_000 })
  await page.getByRole('button', { name: buttonName }).click()
  return waiting
}

// ---------------------------------------------------------------------------
// Analytics

export interface UmamiPayload {
  type: string
  url?: string
  name?: string
  data?: Record<string, string | number>
  website?: string
  hostname?: string
}

/**
 * Answers Umami's collect endpoint locally so tests send nothing to the
 * cloud, and records every payload the page tried to send. The tracker
 * script itself is still fetched from cloud.umami.is.
 */
export async function mockUmami(page: Page): Promise<UmamiPayload[]> {
  const sent: UmamiPayload[] = []
  await page.route(/https:\/\/[a-z-]+\.umami\.is\/api\/send/, async (route) => {
    const body = route.request().postDataJSON() as { type: string; payload: UmamiPayload }
    sent.push({ ...body.payload, type: body.type })
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"beep":"boop"}' })
  })
  return sent
}

export const HAS_UMAMI_ID = /^VITE_UMAMI_WEBSITE_ID=\S+/m.test(
  existsSync('.env') ? readFileSync('.env', 'utf8') : ''
)
