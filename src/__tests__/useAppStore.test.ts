import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import { PRESETS, DEFAULT_SETTINGS } from '../types'

function getState() {
  return useAppStore.getState()
}

function resetStore() {
  getState().reset()
  // Also reset history which `reset()` doesn't clear
  useAppStore.setState({
    history: [{ settings: DEFAULT_SETTINGS, timestamp: Date.now() }],
    historyIndex: 0,
    settings: DEFAULT_SETTINGS,
    exportDpi: 200,
  })
}

describe('useAppStore', () => {
  beforeEach(() => {
    resetStore()
  })

  // ─── Settings ──────────────────────────────────────────

  describe('updateSettings', () => {
    it('merges partial settings', () => {
      getState().updateSettings({ contrast: 150 })
      expect(getState().settings.contrast).toBe(150)
      // Other settings should remain unchanged
      expect(getState().settings.brightness).toBe(DEFAULT_SETTINGS.brightness)
    })

    it('pushes to history', () => {
      const initialLength = getState().history.length
      getState().updateSettings({ contrast: 150 })
      expect(getState().history.length).toBe(initialLength + 1)
    })

    it('updates historyIndex to latest', () => {
      getState().updateSettings({ contrast: 110 })
      getState().updateSettings({ contrast: 120 })
      expect(getState().historyIndex).toBe(getState().history.length - 1)
    })
  })

  // ─── Presets ───────────────────────────────────────────

  describe('applyPreset', () => {
    it('applies stage preset with correct values', () => {
      getState().applyPreset('stage')
      const { settings } = getState()
      const preset = PRESETS.find((p) => p.id === 'stage')!
      expect(settings.presetId).toBe('stage')
      expect(settings.bgColor).toBe(preset.bgColor)
      expect(settings.fgColor).toBe(preset.fgColor)
      expect(settings.contrast).toBe(preset.defaults.contrast)
      expect(settings.brightness).toBe(preset.defaults.brightness)
      expect(settings.threshold).toBe(preset.defaults.threshold)
      expect(settings.dilation).toBe(preset.defaults.dilation)
    })

    it('applies all 8 presets correctly', () => {
      for (const preset of PRESETS) {
        getState().applyPreset(preset.id)
        const { settings } = getState()
        expect(settings.presetId).toBe(preset.id)
        if (preset.id !== 'custom') {
          expect(settings.bgColor).toBe(preset.bgColor)
          expect(settings.fgColor).toBe(preset.fgColor)
        }
      }
    })

    it('custom preset keeps current colors', () => {
      getState().applyPreset('pit') // set some colors
      const { bgColor, fgColor } = getState().settings
      getState().applyPreset('custom')
      expect(getState().settings.presetId).toBe('custom')
      expect(getState().settings.bgColor).toBe(bgColor)
      expect(getState().settings.fgColor).toBe(fgColor)
    })

    it('pushes to history', () => {
      const initialLength = getState().history.length
      getState().applyPreset('jazz')
      expect(getState().history.length).toBe(initialLength + 1)
    })
  })

  // ─── Slider Reset ─────────────────────────────────────

  describe('resetSlider', () => {
    it('resets a slider to preset default', () => {
      getState().applyPreset('stage')
      getState().updateSettings({ contrast: 50 })
      expect(getState().settings.contrast).toBe(50)

      getState().resetSlider('contrast')
      const preset = PRESETS.find((p) => p.id === 'stage')!
      expect(getState().settings.contrast).toBe(preset.defaults.contrast)
    })

    it('only resets the specified slider', () => {
      getState().applyPreset('stage')
      getState().updateSettings({ contrast: 50, brightness: 50 })
      getState().resetSlider('contrast')

      expect(getState().settings.brightness).toBe(50) // should not change
    })

    it('pushes to history', () => {
      const initialLength = getState().history.length
      getState().resetSlider('contrast')
      expect(getState().history.length).toBe(initialLength + 1)
    })
  })

  // ─── History ───────────────────────────────────────────

  describe('history', () => {
    it('starts with one entry (initial settings)', () => {
      expect(getState().history.length).toBe(1)
      expect(getState().historyIndex).toBe(0)
    })

    it('restoreFromHistory restores settings', () => {
      getState().updateSettings({ contrast: 110 })
      getState().updateSettings({ contrast: 120 })
      getState().updateSettings({ contrast: 130 })

      getState().restoreFromHistory(1) // second entry (contrast: 110)
      expect(getState().settings.contrast).toBe(110)
      expect(getState().historyIndex).toBe(1)
    })

    it('restoreFromHistory with invalid index does nothing', () => {
      const before = getState().settings
      getState().restoreFromHistory(999)
      expect(getState().settings).toEqual(before)
    })

    it('trims forward history when adding new entry after restore', () => {
      getState().updateSettings({ contrast: 110 })
      getState().updateSettings({ contrast: 120 })
      getState().updateSettings({ contrast: 130 })
      // history: [default, 110, 120, 130], index: 3

      getState().restoreFromHistory(1) // go back to 110
      getState().updateSettings({ contrast: 200 }) // new branch

      // history should be trimmed: [default, 110, 200]
      expect(getState().history.length).toBe(3)
      expect(getState().settings.contrast).toBe(200)
    })

    it('limits history to 30 entries', () => {
      for (let i = 0; i < 40; i++) {
        getState().updateSettings({ contrast: i })
      }
      expect(getState().history.length).toBeLessThanOrEqual(30)
    })

    it('history entries have timestamps', () => {
      getState().updateSettings({ contrast: 150 })
      const entry = getState().history[getState().historyIndex]
      expect(entry.timestamp).toBeGreaterThan(0)
      expect(typeof entry.timestamp).toBe('number')
    })
  })

  // ─── Pages and Navigation ─────────────────────────────

  describe('pages and navigation', () => {
    it('setTotalPages updates total', () => {
      getState().setTotalPages(5)
      expect(getState().totalPages).toBe(5)
    })

    it('setCurrentPage updates current page', () => {
      getState().setCurrentPage(3)
      expect(getState().currentPage).toBe(3)
    })

    it('setPageData stores page at correct index', () => {
      const page = {
        index: 0,
        originalImageData: new ImageData(1, 1),
        processedCanvas: null as unknown as HTMLCanvasElement,
      }
      getState().setPageData(page)
      expect(getState().pages[0]).toEqual(page)
    })
  })

  // ─── Export DPI ────────────────────────────────────────

  describe('exportDpi', () => {
    it('defaults to 200', () => {
      expect(getState().exportDpi).toBe(200)
    })

    it('can be set to 300', () => {
      getState().setExportDpi(300)
      expect(getState().exportDpi).toBe(300)
    })
  })

  // ─── Reset ─────────────────────────────────────────────

  describe('reset', () => {
    it('clears sources, pages, and resets to defaults', () => {
      getState().setTotalPages(5)
      getState().setCurrentPage(3)
      getState().updateSettings({ contrast: 150 })

      getState().reset()

      expect(getState().sources).toEqual([])
      expect(getState().totalPages).toBe(0)
      expect(getState().currentPage).toBe(0)
      expect(getState().pages).toEqual([])
      expect(getState().isLoading).toBe(false)
    })
  })
})
