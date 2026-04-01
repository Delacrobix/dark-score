import type { WorkerRequest, WorkerResponse, ProcessingSettings } from '../types'

declare const self: DedicatedWorkerGlobalScope

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, imageData, settings } = e.data
  const result = processImage(imageData, settings)
  const response: WorkerResponse = { id, imageData: result }
  self.postMessage(response, [result.data.buffer])
}

function processImage(src: ImageData, settings: ProcessingSettings): ImageData {
  const { width, height } = src
  const input = new Uint8ClampedArray(src.data)

  // Step 1: threshold — convert to binary (black/white)
  const binary = applyThreshold(input, width, height, settings.threshold)

  // Step 2: dilation — thicken lines (operates on binary data)
  const dilated = applyDilation(binary, width, height, settings.dilation)

  // Step 3: remap colors to preset + apply contrast & brightness
  const output = remapColors(dilated, width, height, settings)

  // output.buffer is always ArrayBuffer here (never SharedArrayBuffer)
  return new ImageData(new Uint8ClampedArray(output.buffer as ArrayBuffer), width, height)
}

/**
 * Threshold: pixels darker than `threshold` → 0 (ink), lighter → 255 (paper).
 * Returns a single-channel Uint8ClampedArray (one byte per pixel).
 */
function applyThreshold(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(width * height)
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    // Luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    out[i] = lum < threshold ? 0 : 255
  }
  return out
}

/**
 * Morphological dilation on single-channel binary image.
 *
 * Level 0 = no-op
 * Level 1 = sutil: only horizontal neighbors (left + right) — widens strokes
 *           without affecting vertical spacing between staff lines
 * Level 2 = moderado: 4 cardinal directions
 * Level 3 = máximo: 8 directions (cardinal + diagonal)
 */
function applyDilation(
  binary: Uint8ClampedArray,
  width: number,
  height: number,
  level: number
): Uint8ClampedArray {
  if (level === 0) return binary

  const dirsByLevel = [
    [],                                                              // 0
    [[0, -1], [0, 1]] as const,                                     // 1 — horizontal only
    [[-1, 0], [1, 0], [0, -1], [0, 1]] as const,                   // 2 — 4 dirs
    [[-1, 0], [1, 0], [0, -1], [0, 1],                             // 3 — 8 dirs
     [-1, -1], [-1, 1], [1, -1], [1, 1]] as const,
  ]

  const dirs = dirsByLevel[level]
  const next = new Uint8ClampedArray(binary)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (binary[y * width + x] === 0) {
        for (const [dy, dx] of dirs) {
          const ny = y + dy
          const nx = x + dx
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            next[ny * width + nx] = 0
          }
        }
      }
    }
  }

  return next
}

/**
 * Map binary pixel values to preset colors, then apply brightness & contrast.
 */
function remapColors(
  binary: Uint8ClampedArray,
  width: number,
  height: number,
  settings: ProcessingSettings
): Uint8ClampedArray {
  const { bgColor, fgColor, contrast, brightness } = settings
  const bg = hexToRgb(bgColor)
  const fg = hexToRgb(fgColor)

  const contrastFactor = contrast / 100
  const brightnessFactor = brightness / 100

  const out = new Uint8ClampedArray(width * height * 4)

  for (let i = 0; i < width * height; i++) {
    const isInk = binary[i] === 0
    const base = isInk ? fg : bg

    let r = base[0] * brightnessFactor
    let g = base[1] * brightnessFactor
    let b = base[2] * brightnessFactor

    // Contrast around mid-gray (128)
    r = (r - 128) * contrastFactor + 128
    g = (g - 128) * contrastFactor + 128
    b = (b - 128) * contrastFactor + 128

    out[i * 4] = clamp(r)
    out[i * 4 + 1] = clamp(g)
    out[i * 4 + 2] = clamp(b)
    out[i * 4 + 3] = 255
  }

  return out
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}
