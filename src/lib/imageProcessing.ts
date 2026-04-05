import type { ProcessingSettings } from '../types'

/**
 * Full processing pipeline: threshold → dilation → color remap.
 */
export function processImage(src: ImageData, settings: ProcessingSettings): ImageData {
  const { width, height } = src
  const input = new Uint8ClampedArray(src.data)

  const thresholded = settings.thresholdMode === 'soft'
    ? applySoftThreshold(input, width, height, settings.threshold)
    : applyThreshold(input, width, height, settings.threshold)

  const dilated = applyDilation(thresholded, width, height, settings.dilation)
  const output = remapColors(dilated, width, height, settings)

  return new ImageData(new Uint8ClampedArray(output.buffer as ArrayBuffer), width, height)
}

/**
 * Hard threshold: pixels darker than `threshold` → 0 (ink), lighter → 255 (paper).
 * Returns a single-channel Uint8ClampedArray (one byte per pixel).
 */
export function applyThreshold(
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
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    out[i] = lum < threshold ? 0 : 255
  }
  return out
}

/**
 * Soft threshold using smoothstep: pixels near the threshold get a smooth
 * blend instead of a hard binary cut. Preserves edge anti-aliasing and
 * reduces scan noise.
 *
 * Returns a single-channel Uint8ClampedArray where:
 *   0 = fully ink (foreground)
 *   255 = fully paper (background)
 *   values in between = smooth transition
 */
export function applySoftThreshold(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(width * height)
  const softness = 50
  const low = Math.max(0, threshold - softness)
  const high = Math.min(255, threshold + softness)
  const range = high - low

  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b

    if (lum <= low) {
      out[i] = 0
    } else if (lum >= high) {
      out[i] = 255
    } else {
      const t = (lum - low) / range
      out[i] = Math.round(t * t * (3 - 2 * t) * 255)
    }
  }
  return out
}

/**
 * Morphological dilation on binary or near-binary image.
 *
 * When level > 0, binarizes the input first (dilation requires binary data),
 * then expands ink pixels.
 *
 * Level 0 = no-op (preserves smooth anti-aliased values)
 * Level 1 = horizontal neighbors only (left + right)
 * Level 2 = 4 cardinal directions
 * Level 3 = 8 directions (cardinal + diagonal)
 */
export function applyDilation(
  smooth: Uint8ClampedArray,
  width: number,
  height: number,
  level: number
): Uint8ClampedArray {
  if (level === 0) return smooth

  // Binarize for dilation
  const binary = new Uint8ClampedArray(smooth.length)
  for (let i = 0; i < smooth.length; i++) {
    binary[i] = smooth[i] < 128 ? 0 : 255
  }

  const dirsByLevel = [
    [],
    [[0, -1], [0, 1]] as const,
    [[-1, 0], [1, 0], [0, -1], [0, 1]] as const,
    [[-1, 0], [1, 0], [0, -1], [0, 1],
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
 * Map pixel values to preset colors with interpolation.
 * Uses the blend value (0=ink, 255=paper) to smoothly interpolate
 * between foreground and background colors, preserving anti-aliasing.
 */
export function remapColors(
  blendMap: Uint8ClampedArray,
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
    const t = blendMap[i] / 255 // 0 = ink (fg), 1 = paper (bg)

    let r = (fg[0] * (1 - t) + bg[0] * t) * brightnessFactor
    let g = (fg[1] * (1 - t) + bg[1] * t) * brightnessFactor
    let b = (fg[2] * (1 - t) + bg[2] * t) * brightnessFactor

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

export function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

export function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}
