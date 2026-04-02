import { describe, it, expect } from 'vitest'
import {
  applyThreshold,
  applyDilation,
  remapColors,
  processImage,
  hexToRgb,
  clamp,
} from '../lib/imageProcessing'
import { PRESETS, DEFAULT_SETTINGS, type ProcessingSettings } from '../types'

// Helper: create RGBA pixel data from grayscale values
function grayPixels(values: number[]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(values.length * 4)
  for (let i = 0; i < values.length; i++) {
    data[i * 4] = values[i]
    data[i * 4 + 1] = values[i]
    data[i * 4 + 2] = values[i]
    data[i * 4 + 3] = 255
  }
  return data
}

// Helper: create binary data
function binaryPixels(values: number[]): Uint8ClampedArray {
  return new Uint8ClampedArray(values)
}

// ─── hexToRgb ───────────────────────────────────────────────

describe('hexToRgb', () => {
  it('converts black', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
  })

  it('converts white', () => {
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
  })

  it('converts a color', () => {
    expect(hexToRgb('#1c1410')).toEqual([28, 20, 16])
  })

  it('converts purple', () => {
    expect(hexToRgb('#c084fc')).toEqual([192, 132, 252])
  })
})

// ─── clamp ──────────────────────────────────────────────────

describe('clamp', () => {
  it('clamps negative to 0', () => {
    expect(clamp(-10)).toBe(0)
  })

  it('clamps above 255 to 255', () => {
    expect(clamp(300)).toBe(255)
  })

  it('rounds to nearest integer', () => {
    expect(clamp(127.6)).toBe(128)
    expect(clamp(127.4)).toBe(127)
  })

  it('leaves values in range unchanged', () => {
    expect(clamp(128)).toBe(128)
  })
})

// ─── applyThreshold ────────────────────────────────────────

describe('applyThreshold', () => {
  it('converts pixels below threshold to 0 (ink)', () => {
    const data = grayPixels([50, 100, 150, 200])
    const result = applyThreshold(data, 4, 1, 128)
    expect(result[0]).toBe(0)   // 50 < 128
    expect(result[1]).toBe(0)   // 100 < 128
    expect(result[2]).toBe(255) // 150 >= 128
    expect(result[3]).toBe(255) // 200 >= 128
  })

  it('handles threshold at 0 (everything is paper)', () => {
    const data = grayPixels([0, 50, 100, 255])
    const result = applyThreshold(data, 4, 1, 0)
    expect(Array.from(result)).toEqual([255, 255, 255, 255])
  })

  it('handles threshold at 256 (everything is ink)', () => {
    const data = grayPixels([0, 128, 200, 255])
    const result = applyThreshold(data, 4, 1, 256)
    expect(Array.from(result)).toEqual([0, 0, 0, 0])
  })

  it('uses luminance formula for colored pixels', () => {
    // R=255, G=0, B=0 → lum = 0.299 * 255 ≈ 76.245
    const data = new Uint8ClampedArray([255, 0, 0, 255])
    const result = applyThreshold(data, 1, 1, 77)
    expect(result[0]).toBe(0) // 76.245 < 77 → ink

    const result2 = applyThreshold(data, 1, 1, 76)
    expect(result2[0]).toBe(255) // 76.245 >= 76 → paper
  })

  it('produces correct output dimensions', () => {
    const data = grayPixels([100, 200, 50, 150, 80, 220])
    const result = applyThreshold(data, 3, 2, 128)
    expect(result.length).toBe(6) // one byte per pixel
  })
})

// ─── applyDilation ─────────────────────────────────────────

describe('applyDilation', () => {
  it('level 0 returns input unchanged', () => {
    const binary = binaryPixels([0, 255, 255, 255])
    const result = applyDilation(binary, 2, 2, 0)
    expect(result).toBe(binary) // same reference
  })

  it('level 1 dilates horizontally only', () => {
    // 3x3 grid with single ink pixel at center
    const binary = binaryPixels([
      255, 255, 255,
      255,   0, 255,
      255, 255, 255,
    ])
    const result = applyDilation(binary, 3, 3, 1)
    // Center row should be dilated left and right
    expect(result[3]).toBe(0)   // left of center
    expect(result[4]).toBe(0)   // center (original)
    expect(result[5]).toBe(0)   // right of center
    // Top and bottom rows should remain unchanged
    expect(result[1]).toBe(255) // above center
    expect(result[7]).toBe(255) // below center
  })

  it('level 2 dilates in 4 cardinal directions', () => {
    const binary = binaryPixels([
      255, 255, 255,
      255,   0, 255,
      255, 255, 255,
    ])
    const result = applyDilation(binary, 3, 3, 2)
    expect(result[1]).toBe(0)   // above
    expect(result[3]).toBe(0)   // left
    expect(result[4]).toBe(0)   // center
    expect(result[5]).toBe(0)   // right
    expect(result[7]).toBe(0)   // below
    // Corners should remain paper
    expect(result[0]).toBe(255) // top-left
    expect(result[2]).toBe(255) // top-right
    expect(result[6]).toBe(255) // bottom-left
    expect(result[8]).toBe(255) // bottom-right
  })

  it('level 3 dilates in all 8 directions', () => {
    const binary = binaryPixels([
      255, 255, 255,
      255,   0, 255,
      255, 255, 255,
    ])
    const result = applyDilation(binary, 3, 3, 3)
    // All 9 pixels should be ink
    expect(Array.from(result)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('handles ink pixel at edge without out-of-bounds', () => {
    const binary = binaryPixels([
      0, 255,
      255, 255,
    ])
    const result = applyDilation(binary, 2, 2, 3)
    // Should not throw, and adjacent pixels should be dilated
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
    expect(result[2]).toBe(0)
    expect(result[3]).toBe(0)
  })

  it('does not dilate paper pixels', () => {
    const binary = binaryPixels([255, 255, 255, 255])
    const result = applyDilation(binary, 2, 2, 3)
    expect(Array.from(result)).toEqual([255, 255, 255, 255])
  })
})

// ─── remapColors ───────────────────────────────────────────

describe('remapColors', () => {
  it('maps ink pixels to foreground color', () => {
    const binary = binaryPixels([0]) // ink
    const settings: ProcessingSettings = {
      ...DEFAULT_SETTINGS,
      bgColor: '#000000',
      fgColor: '#ffffff',
      contrast: 100,
      brightness: 100,
    }
    const result = remapColors(binary, 1, 1, settings)
    expect(result[0]).toBe(255) // R
    expect(result[1]).toBe(255) // G
    expect(result[2]).toBe(255) // B
    expect(result[3]).toBe(255) // A
  })

  it('maps paper pixels to background color', () => {
    const binary = binaryPixels([255]) // paper
    const settings: ProcessingSettings = {
      ...DEFAULT_SETTINGS,
      bgColor: '#1a1a1a',
      fgColor: '#ffffff',
      contrast: 100,
      brightness: 100,
    }
    const result = remapColors(binary, 1, 1, settings)
    expect(result[0]).toBe(26)  // 0x1a
    expect(result[1]).toBe(26)
    expect(result[2]).toBe(26)
    expect(result[3]).toBe(255)
  })

  it('applies brightness adjustment', () => {
    const binary = binaryPixels([0]) // ink → fg color
    const settings: ProcessingSettings = {
      ...DEFAULT_SETTINGS,
      bgColor: '#000000',
      fgColor: '#808080', // mid gray (128, 128, 128)
      contrast: 100,
      brightness: 50, // half brightness
    }
    const result = remapColors(binary, 1, 1, settings)
    // 128 * 0.5 = 64, then contrast: (64 - 128) * 1 + 128 = 64
    expect(result[0]).toBe(64)
  })

  it('applies contrast adjustment', () => {
    const binary = binaryPixels([0])
    const settings: ProcessingSettings = {
      ...DEFAULT_SETTINGS,
      bgColor: '#000000',
      fgColor: '#808080',
      contrast: 200, // double contrast
      brightness: 100,
    }
    const result = remapColors(binary, 1, 1, settings)
    // 128 * 1 = 128, then contrast: (128 - 128) * 2 + 128 = 128
    expect(result[0]).toBe(128)
  })

  it('clamps values that exceed 0-255 range', () => {
    const binary = binaryPixels([0])
    const settings: ProcessingSettings = {
      ...DEFAULT_SETTINGS,
      bgColor: '#000000',
      fgColor: '#ffffff',
      contrast: 200,
      brightness: 200,
    }
    const result = remapColors(binary, 1, 1, settings)
    // 255 * 2 = 510, (510 - 128) * 2 + 128 = 892 → clamped to 255
    expect(result[0]).toBe(255)
  })

  it('output has correct RGBA format', () => {
    const binary = binaryPixels([0, 255])
    const result = remapColors(binary, 2, 1, DEFAULT_SETTINGS)
    expect(result.length).toBe(8) // 2 pixels * 4 channels
    expect(result[3]).toBe(255)   // alpha of pixel 0
    expect(result[7]).toBe(255)   // alpha of pixel 1
  })
})

// ─── processImage (full pipeline) ──────────────────────────

describe('processImage', () => {
  it('produces consistent output for the same input and settings', () => {
    const data = grayPixels([0, 50, 100, 150, 200, 255])
    const imageData = new ImageData(data, 3, 2)

    const result1 = processImage(imageData, DEFAULT_SETTINGS)
    // Re-create input since buffer was transferred
    const data2 = grayPixels([0, 50, 100, 150, 200, 255])
    const imageData2 = new ImageData(data2, 3, 2)
    const result2 = processImage(imageData2, DEFAULT_SETTINGS)

    expect(Array.from(result1.data)).toEqual(Array.from(result2.data))
  })

  it('produces correct dimensions', () => {
    const data = grayPixels([100, 200, 50, 150, 80, 220])
    const imageData = new ImageData(data, 3, 2)
    const result = processImage(imageData, DEFAULT_SETTINGS)
    expect(result.width).toBe(3)
    expect(result.height).toBe(2)
    expect(result.data.length).toBe(24) // 6 pixels * 4 channels
  })

  it('produces different output for different presets', () => {
    const data = grayPixels([0, 128, 255])
    const stageSettings: ProcessingSettings = {
      presetId: 'stage',
      ...PRESETS[0],
      bgColor: PRESETS[0].bgColor,
      fgColor: PRESETS[0].fgColor,
      ...PRESETS[0].defaults,
    }
    const pitSettings: ProcessingSettings = {
      presetId: 'pit',
      ...PRESETS[2],
      bgColor: PRESETS[2].bgColor,
      fgColor: PRESETS[2].fgColor,
      ...PRESETS[2].defaults,
    }

    const result1 = processImage(new ImageData(grayPixels([0, 128, 255]), 3, 1), stageSettings)
    const result2 = processImage(new ImageData(grayPixels([0, 128, 255]), 3, 1), pitSettings)

    expect(Array.from(result1.data)).not.toEqual(Array.from(result2.data))
  })
})

// ─── Preset regression tests ───────────────────────────────
// These ensure that processing with each preset produces the same
// output over time. If the pipeline changes, these will catch it.

describe('preset regression', () => {
  const testInput = grayPixels([0, 64, 128, 192, 255])

  for (const preset of PRESETS) {
    it(`${preset.id} preset produces deterministic output`, () => {
      const settings: ProcessingSettings = {
        presetId: preset.id,
        bgColor: preset.bgColor,
        fgColor: preset.fgColor,
        ...preset.defaults,
      }

      const result1 = processImage(new ImageData(grayPixels([0, 64, 128, 192, 255]), 5, 1), settings)
      const result2 = processImage(new ImageData(grayPixels([0, 64, 128, 192, 255]), 5, 1), settings)

      expect(Array.from(result1.data)).toEqual(Array.from(result2.data))
    })
  }

  // Snapshot of expected output for each preset to catch pipeline regressions
  it('stage preset snapshot', () => {
    const settings: ProcessingSettings = {
      presetId: 'stage',
      bgColor: '#000000',
      fgColor: '#ffffff',
      ...PRESETS[0].defaults,
    }
    const result = processImage(new ImageData(grayPixels([0, 64, 128, 192, 255]), 5, 1), settings)
    expect(Array.from(result.data)).toMatchSnapshot()
  })

  it('study preset snapshot', () => {
    const settings: ProcessingSettings = {
      presetId: 'study',
      bgColor: '#1a1a1a',
      fgColor: '#e0e0e0',
      ...PRESETS[1].defaults,
    }
    const result = processImage(new ImageData(grayPixels([0, 64, 128, 192, 255]), 5, 1), settings)
    expect(Array.from(result.data)).toMatchSnapshot()
  })

  it('pit preset snapshot', () => {
    const settings: ProcessingSettings = {
      presetId: 'pit',
      bgColor: '#1c1410',
      fgColor: '#f5e6c8',
      ...PRESETS[2].defaults,
    }
    const result = processImage(new ImageData(grayPixels([0, 64, 128, 192, 255]), 5, 1), settings)
    expect(Array.from(result.data)).toMatchSnapshot()
  })

  it('classical preset snapshot', () => {
    const settings: ProcessingSettings = {
      presetId: 'classical',
      bgColor: '#0f0f0f',
      fgColor: '#efefef',
      ...PRESETS[3].defaults,
    }
    const result = processImage(new ImageData(grayPixels([0, 64, 128, 192, 255]), 5, 1), settings)
    expect(Array.from(result.data)).toMatchSnapshot()
  })

  it('jazz preset snapshot', () => {
    const settings: ProcessingSettings = {
      presetId: 'jazz',
      bgColor: '#141414',
      fgColor: '#e8e0d0',
      ...PRESETS[4].defaults,
    }
    const result = processImage(new ImageData(grayPixels([0, 64, 128, 192, 255]), 5, 1), settings)
    expect(Array.from(result.data)).toMatchSnapshot()
  })

  it('pop preset snapshot', () => {
    const settings: ProcessingSettings = {
      presetId: 'pop',
      bgColor: '#111318',
      fgColor: '#dde3f0',
      ...PRESETS[5].defaults,
    }
    const result = processImage(new ImageData(grayPixels([0, 64, 128, 192, 255]), 5, 1), settings)
    expect(Array.from(result.data)).toMatchSnapshot()
  })

  it('bluelight preset snapshot', () => {
    const settings: ProcessingSettings = {
      presetId: 'bluelight',
      bgColor: '#1a1200',
      fgColor: '#ffd580',
      ...PRESETS[6].defaults,
    }
    const result = processImage(new ImageData(grayPixels([0, 64, 128, 192, 255]), 5, 1), settings)
    expect(Array.from(result.data)).toMatchSnapshot()
  })

  it('custom preset snapshot', () => {
    const result = processImage(new ImageData(grayPixels([0, 64, 128, 192, 255]), 5, 1), DEFAULT_SETTINGS)
    expect(Array.from(result.data)).toMatchSnapshot()
  })
})
