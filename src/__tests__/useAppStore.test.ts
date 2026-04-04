import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import { PRESETS, DEFAULT_SETTINGS } from '../types'
import type { SourceEntry } from '../types'

function getState() {
  return useAppStore.getState()
}

function resetStore() {
  getState().reset()
  useAppStore.setState({
    documents: [],
    currentDocIndex: 0,
    exportDpi: 200,
    exportMode: 'separate',
  })
}

function createFakeSource(name = 'test.pdf', type: 'pdf' | 'image' = 'pdf'): SourceEntry {
  return {
    file: new File([''], name, { type: type === 'pdf' ? 'application/pdf' : 'image/png' }),
    type,
  }
}

function addOneDoc(name = 'test.pdf') {
  getState().addDocuments([createFakeSource(name)])
}

function currentDoc() {
  const s = getState()
  return s.documents[s.currentDocIndex]
}

describe('useAppStore', () => {
  beforeEach(() => {
    resetStore()
  })

  // ─── Document Management ──────────────────────────────

  describe('addDocuments', () => {
    it('creates a document per source', () => {
      getState().addDocuments([createFakeSource('a.pdf'), createFakeSource('b.png', 'image')])
      expect(getState().documents.length).toBe(2)
      expect(getState().documents[0].label).toBe('a')
      expect(getState().documents[1].label).toBe('b')
    })

    it('focuses first new document', () => {
      addOneDoc('first.pdf')
      addOneDoc('second.pdf')
      expect(getState().currentDocIndex).toBe(1)
    })

    it('assigns default settings', () => {
      addOneDoc()
      expect(currentDoc().settings).toEqual(DEFAULT_SETTINGS)
    })

    it('applies current doc settings when flag is true', () => {
      addOneDoc('first.pdf')
      getState().updateSettings({ contrast: 180 })
      getState().addDocuments([createFakeSource('second.pdf')], true)
      expect(getState().documents[1].settings.contrast).toBe(180)
    })

    it('each document has unique id', () => {
      getState().addDocuments([createFakeSource('a.pdf'), createFakeSource('b.pdf')])
      const ids = getState().documents.map((d) => d.id)
      expect(new Set(ids).size).toBe(2)
    })

    it('initializes each doc with one history entry', () => {
      addOneDoc()
      expect(currentDoc().history.length).toBe(1)
      expect(currentDoc().historyIndex).toBe(0)
    })
  })

  describe('setCurrentDocIndex', () => {
    it('switches active document', () => {
      getState().addDocuments([createFakeSource('a.pdf'), createFakeSource('b.pdf')])
      getState().setCurrentDocIndex(0)
      expect(getState().currentDocIndex).toBe(0)
    })
  })

  describe('removeDocument', () => {
    it('removes the document at index', () => {
      getState().addDocuments([createFakeSource('a.pdf'), createFakeSource('b.pdf')])
      getState().setCurrentDocIndex(0)
      getState().removeDocument(1)
      expect(getState().documents.length).toBe(1)
      expect(getState().documents[0].label).toBe('a')
    })

    it('adjusts currentDocIndex when removing before current', () => {
      getState().addDocuments([createFakeSource('a.pdf'), createFakeSource('b.pdf'), createFakeSource('c.pdf')])
      getState().setCurrentDocIndex(2)
      getState().removeDocument(0)
      expect(getState().currentDocIndex).toBe(1)
    })

    it('clamps currentDocIndex when removing last', () => {
      getState().addDocuments([createFakeSource('a.pdf'), createFakeSource('b.pdf')])
      getState().setCurrentDocIndex(1)
      getState().removeDocument(1)
      expect(getState().currentDocIndex).toBe(0)
    })
  })

  // ─── Settings (per document) ──────────────────────────

  describe('updateSettings', () => {
    it('merges partial settings on current doc', () => {
      addOneDoc()
      getState().updateSettings({ contrast: 150 })
      expect(currentDoc().settings.contrast).toBe(150)
      expect(currentDoc().settings.brightness).toBe(DEFAULT_SETTINGS.brightness)
    })

    it('pushes to current doc history', () => {
      addOneDoc()
      const initialLength = currentDoc().history.length
      getState().updateSettings({ contrast: 150 })
      expect(currentDoc().history.length).toBe(initialLength + 1)
    })

    it('does not affect other documents', () => {
      getState().addDocuments([createFakeSource('a.pdf'), createFakeSource('b.pdf')])
      getState().setCurrentDocIndex(0)
      getState().updateSettings({ contrast: 180 })
      expect(getState().documents[1].settings.contrast).toBe(DEFAULT_SETTINGS.contrast)
    })
  })

  // ─── Presets ───────────────────────────────────────────

  describe('applyPreset', () => {
    it('applies stage preset with correct values', () => {
      addOneDoc()
      getState().applyPreset('stage')
      const settings = currentDoc().settings
      const preset = PRESETS.find((p) => p.id === 'stage')!
      expect(settings.presetId).toBe('stage')
      expect(settings.bgColor).toBe(preset.bgColor)
      expect(settings.fgColor).toBe(preset.fgColor)
      expect(settings.contrast).toBe(preset.defaults.contrast)
    })

    it('applies all 8 presets correctly', () => {
      addOneDoc()
      for (const preset of PRESETS) {
        getState().applyPreset(preset.id)
        const settings = currentDoc().settings
        expect(settings.presetId).toBe(preset.id)
        if (preset.id !== 'custom') {
          expect(settings.bgColor).toBe(preset.bgColor)
          expect(settings.fgColor).toBe(preset.fgColor)
        }
      }
    })

    it('custom preset keeps current colors', () => {
      addOneDoc()
      getState().applyPreset('pit')
      const { bgColor, fgColor } = currentDoc().settings
      getState().applyPreset('custom')
      expect(currentDoc().settings.presetId).toBe('custom')
      expect(currentDoc().settings.bgColor).toBe(bgColor)
      expect(currentDoc().settings.fgColor).toBe(fgColor)
    })

    it('pushes to history', () => {
      addOneDoc()
      const initialLength = currentDoc().history.length
      getState().applyPreset('jazz')
      expect(currentDoc().history.length).toBe(initialLength + 1)
    })
  })

  // ─── Slider Reset ─────────────────────────────────────

  describe('resetSlider', () => {
    it('resets a slider to preset default', () => {
      addOneDoc()
      getState().applyPreset('stage')
      getState().updateSettings({ contrast: 50 })
      expect(currentDoc().settings.contrast).toBe(50)

      getState().resetSlider('contrast')
      const preset = PRESETS.find((p) => p.id === 'stage')!
      expect(currentDoc().settings.contrast).toBe(preset.defaults.contrast)
    })

    it('only resets the specified slider', () => {
      addOneDoc()
      getState().applyPreset('stage')
      getState().updateSettings({ contrast: 50, brightness: 50 })
      getState().resetSlider('contrast')
      expect(currentDoc().settings.brightness).toBe(50)
    })

    it('pushes to history', () => {
      addOneDoc()
      const initialLength = currentDoc().history.length
      getState().resetSlider('contrast')
      expect(currentDoc().history.length).toBe(initialLength + 1)
    })
  })

  // ─── History ───────────────────────────────────────────

  describe('history', () => {
    it('starts with one entry (initial settings)', () => {
      addOneDoc()
      expect(currentDoc().history.length).toBe(1)
      expect(currentDoc().historyIndex).toBe(0)
    })

    it('restoreFromHistory restores settings', () => {
      addOneDoc()
      getState().updateSettings({ contrast: 110 })
      getState().updateSettings({ contrast: 120 })
      getState().updateSettings({ contrast: 130 })

      getState().restoreFromHistory(1)
      expect(currentDoc().settings.contrast).toBe(110)
      expect(currentDoc().historyIndex).toBe(1)
    })

    it('restoreFromHistory with invalid index does nothing', () => {
      addOneDoc()
      const before = currentDoc().settings
      getState().restoreFromHistory(999)
      expect(currentDoc().settings).toEqual(before)
    })

    it('trims forward history when adding new entry after restore', () => {
      addOneDoc()
      getState().updateSettings({ contrast: 110 })
      getState().updateSettings({ contrast: 120 })
      getState().updateSettings({ contrast: 130 })

      getState().restoreFromHistory(1)
      getState().updateSettings({ contrast: 200 })

      expect(currentDoc().history.length).toBe(3)
      expect(currentDoc().settings.contrast).toBe(200)
    })

    it('limits history to 30 entries', () => {
      addOneDoc()
      for (let i = 0; i < 40; i++) {
        getState().updateSettings({ contrast: i })
      }
      expect(currentDoc().history.length).toBeLessThanOrEqual(30)
    })

    it('history entries have timestamps', () => {
      addOneDoc()
      getState().updateSettings({ contrast: 150 })
      const entry = currentDoc().history[currentDoc().historyIndex]
      expect(entry.timestamp).toBeGreaterThan(0)
      expect(typeof entry.timestamp).toBe('number')
    })
  })

  // ─── Pages and Navigation ─────────────────────────────

  describe('pages and navigation', () => {
    it('setDocTotalPages updates total on specific doc', () => {
      addOneDoc()
      getState().setDocTotalPages(0, 5)
      expect(currentDoc().totalPages).toBe(5)
    })

    it('setDocCurrentPage updates current page', () => {
      addOneDoc()
      getState().setDocCurrentPage(3)
      expect(currentDoc().currentPage).toBe(3)
    })

    it('setDocPageData stores page at correct index', () => {
      addOneDoc()
      const page = {
        index: 0,
        originalImageData: new ImageData(1, 1),
        processedCanvas: null as unknown as HTMLCanvasElement,
      }
      getState().setDocPageData(0, page)
      expect(currentDoc().pages[0]).toEqual(page)
    })
  })

  // ─── Settings apply to all pages (document-level) ─────

  describe('settings are document-level, not page-level', () => {
    it('updateSettings changes settings shared by all pages in a document', () => {
      addOneDoc()
      // Add multiple pages to the document
      const page0 = { index: 0, originalImageData: new ImageData(1, 1), processedCanvas: null as unknown as HTMLCanvasElement }
      const page1 = { index: 1, originalImageData: new ImageData(1, 1), processedCanvas: null as unknown as HTMLCanvasElement }
      const page2 = { index: 2, originalImageData: new ImageData(1, 1), processedCanvas: null as unknown as HTMLCanvasElement }
      getState().setDocPageData(0, page0)
      getState().setDocPageData(0, page1)
      getState().setDocPageData(0, page2)
      getState().setDocTotalPages(0, 3)

      // Change settings while on page 0
      getState().setDocCurrentPage(0)
      getState().updateSettings({ contrast: 180 })

      // Settings live at document level, so switching pages should show the same settings
      getState().setDocCurrentPage(1)
      expect(currentDoc().settings.contrast).toBe(180)
      getState().setDocCurrentPage(2)
      expect(currentDoc().settings.contrast).toBe(180)
    })

    it('updateSettingsLive changes settings for all pages without pushing history', () => {
      addOneDoc()
      const page0 = { index: 0, originalImageData: new ImageData(1, 1), processedCanvas: null as unknown as HTMLCanvasElement }
      const page1 = { index: 1, originalImageData: new ImageData(1, 1), processedCanvas: null as unknown as HTMLCanvasElement }
      getState().setDocPageData(0, page0)
      getState().setDocPageData(0, page1)
      getState().setDocTotalPages(0, 2)

      const historyBefore = currentDoc().history.length
      getState().updateSettingsLive({ brightness: 60 })

      // Settings updated for all pages (document-level)
      expect(currentDoc().settings.brightness).toBe(60)
      getState().setDocCurrentPage(1)
      expect(currentDoc().settings.brightness).toBe(60)
      // No history entry added
      expect(currentDoc().history.length).toBe(historyBefore)
    })

    it('commitToHistory only adds entry when settings actually changed', () => {
      addOneDoc()
      const historyBefore = currentDoc().history.length

      // Commit without any change should not add entry
      getState().commitToHistory()
      expect(currentDoc().history.length).toBe(historyBefore)

      // Change settings live, then commit
      getState().updateSettingsLive({ contrast: 170 })
      getState().commitToHistory()
      expect(currentDoc().history.length).toBe(historyBefore + 1)

      // Commit again without change should not add entry
      getState().commitToHistory()
      expect(currentDoc().history.length).toBe(historyBefore + 1)
    })
  })

  // ─── Apply to All ─────────────────────────────────────

  describe('applySettingsToAll', () => {
    it('copies current doc settings to all other docs', () => {
      getState().addDocuments([createFakeSource('a.pdf'), createFakeSource('b.pdf'), createFakeSource('c.pdf')])
      getState().setCurrentDocIndex(0)
      getState().updateSettings({ contrast: 175, brightness: 80 })
      getState().applySettingsToAll()

      expect(getState().documents[1].settings.contrast).toBe(175)
      expect(getState().documents[1].settings.brightness).toBe(80)
      expect(getState().documents[2].settings.contrast).toBe(175)
    })

    it('pushes to history on other docs', () => {
      getState().addDocuments([createFakeSource('a.pdf'), createFakeSource('b.pdf')])
      getState().setCurrentDocIndex(0)
      getState().updateSettings({ contrast: 175 })
      const beforeHistory = getState().documents[1].history.length
      getState().applySettingsToAll()
      expect(getState().documents[1].history.length).toBe(beforeHistory + 1)
    })
  })

  // ─── Export DPI and Mode ──────────────────────────────

  describe('exportDpi', () => {
    it('defaults to 200', () => {
      expect(getState().exportDpi).toBe(200)
    })

    it('can be set to 300', () => {
      getState().setExportDpi(300)
      expect(getState().exportDpi).toBe(300)
    })
  })

  describe('exportMode', () => {
    it('defaults to separate', () => {
      expect(getState().exportMode).toBe('separate')
    })

    it('can be set to merged', () => {
      getState().setExportMode('merged')
      expect(getState().exportMode).toBe('merged')
    })
  })

  // ─── Reset ─────────────────────────────────────────────

  describe('reset', () => {
    it('clears all documents', () => {
      addOneDoc()
      getState().updateSettings({ contrast: 150 })
      getState().reset()

      expect(getState().documents).toEqual([])
      expect(getState().currentDocIndex).toBe(0)
    })
  })
})
