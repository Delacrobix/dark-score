import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type ProcessingSettings,
  type PageData,
  type PresetId,
  type SliderKey,
  type DocumentEntry,
  type SourceEntry,
  type HistoryEntry,
  type ExportMode,
  DEFAULT_SETTINGS,
  PRESETS,
} from '../types'

const MAX_HISTORY = 30

function pushHistory(
  history: HistoryEntry[],
  index: number,
  next: ProcessingSettings
): { history: HistoryEntry[]; historyIndex: number } {
  const trimmed = history.slice(0, index + 1)
  const entry: HistoryEntry = { settings: next, timestamp: Date.now() }
  const newHistory = [...trimmed, entry].slice(-MAX_HISTORY)
  return { history: newHistory, historyIndex: newHistory.length - 1 }
}

function createDocument(source: SourceEntry, settings: ProcessingSettings): DocumentEntry {
  return {
    id: crypto.randomUUID(),
    source,
    label: source.file.name.replace(/\.[^.]+$/, ''),
    settings,
    history: [{ settings, timestamp: Date.now() }],
    historyIndex: 0,
    pages: [],
    totalPages: 0,
    currentPage: 0,
    isLoading: false,
    loadingProgress: 0,
    isProcessing: false,
  }
}

function updateDoc(docs: DocumentEntry[], index: number, patch: Partial<DocumentEntry>): DocumentEntry[] {
  const updated = [...docs]
  updated[index] = { ...updated[index], ...patch }
  return updated
}

interface AppState {
  documents: DocumentEntry[]
  currentDocIndex: number

  exportDpi: 200 | 300
  exportMode: ExportMode
  zoomPercent: number

  setZoomPercent: (z: number) => void
  setExportDpi: (dpi: 200 | 300) => void
  setExportMode: (mode: ExportMode) => void

  addDocuments: (sources: SourceEntry[], applyCurrentSettings?: boolean) => void
  setCurrentDocIndex: (i: number) => void
  removeDocument: (i: number) => void

  updateSettings: (partial: Partial<ProcessingSettings>) => void
  updateSettingsLive: (partial: Partial<ProcessingSettings>) => void
  commitToHistory: () => void
  resetSlider: (key: SliderKey) => void
  applyPreset: (id: PresetId) => void
  restoreFromHistory: (index: number) => void
  applySettingsToAll: () => void

  setDocTotalPages: (docIndex: number, n: number) => void
  setDocCurrentPage: (page: number) => void
  setDocPageData: (docIndex: number, page: PageData) => void
  setDocLoading: (docIndex: number, loading: boolean) => void
  setDocLoadingProgress: (docIndex: number, progress: number) => void
  setDocProcessing: (docIndex: number, processing: boolean) => void

  reset: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      documents: [],
      currentDocIndex: 0,

      exportDpi: 200,
      exportMode: 'separate',
      zoomPercent: 100,

      setZoomPercent: (z) => set({ zoomPercent: z }),
      setExportDpi: (dpi) => set({ exportDpi: dpi }),
      setExportMode: (mode) => set({ exportMode: mode }),

      addDocuments: (sources, applyCurrentSettings = false) =>
        set((state) => {
          const baseSettings = applyCurrentSettings && state.documents.length > 0
            ? state.documents[state.currentDocIndex].settings
            : DEFAULT_SETTINGS
          const newDocs = sources.map((s) => createDocument(s, { ...baseSettings }))
          return {
            documents: [...state.documents, ...newDocs],
            currentDocIndex: state.documents.length, // focus first new doc
          }
        }),

      setCurrentDocIndex: (i) => set({ currentDocIndex: i }),

      removeDocument: (i) =>
        set((state) => {
          const docs = state.documents.filter((_, idx) => idx !== i)
          let newIndex = state.currentDocIndex
          if (docs.length === 0) newIndex = 0
          else if (newIndex >= docs.length) newIndex = docs.length - 1
          else if (newIndex > i) newIndex = newIndex - 1
          return { documents: docs, currentDocIndex: newIndex }
        }),

      updateSettings: (partial) =>
        set((state) => {
          const doc = state.documents[state.currentDocIndex]
          if (!doc) return {}
          const next = { ...doc.settings, ...partial }
          const hist = pushHistory(doc.history, doc.historyIndex, next)
          return {
            documents: updateDoc(state.documents, state.currentDocIndex, {
              settings: next,
              ...hist,
            }),
          }
        }),

      updateSettingsLive: (partial) =>
        set((state) => {
          const doc = state.documents[state.currentDocIndex]
          if (!doc) return {}
          const next = { ...doc.settings, ...partial }
          return {
            documents: updateDoc(state.documents, state.currentDocIndex, {
              settings: next,
            }),
          }
        }),

      commitToHistory: () =>
        set((state) => {
          const doc = state.documents[state.currentDocIndex]
          if (!doc) return {}
          const lastEntry = doc.history[doc.historyIndex]
          if (lastEntry && JSON.stringify(lastEntry.settings) === JSON.stringify(doc.settings)) return {}
          const hist = pushHistory(doc.history, doc.historyIndex, doc.settings)
          return {
            documents: updateDoc(state.documents, state.currentDocIndex, hist),
          }
        }),

      resetSlider: (key) =>
        set((state) => {
          const doc = state.documents[state.currentDocIndex]
          if (!doc) return {}
          const preset = PRESETS.find((p) => p.id === doc.settings.presetId)
          const defaultVal = preset?.defaults[key] ?? DEFAULT_SETTINGS[key]
          const next = { ...doc.settings, [key]: defaultVal }
          const hist = pushHistory(doc.history, doc.historyIndex, next)
          return {
            documents: updateDoc(state.documents, state.currentDocIndex, {
              settings: next,
              ...hist,
            }),
          }
        }),

      applyPreset: (id) =>
        set((state) => {
          const doc = state.documents[state.currentDocIndex]
          if (!doc) return {}
          const preset = PRESETS.find((p) => p.id === id)
          if (!preset) return {}
          const next: ProcessingSettings =
            id === 'custom'
              ? { ...doc.settings, presetId: 'custom' }
              : { ...doc.settings, presetId: id, bgColor: preset.bgColor, fgColor: preset.fgColor, ...preset.defaults }
          const hist = pushHistory(doc.history, doc.historyIndex, next)
          return {
            documents: updateDoc(state.documents, state.currentDocIndex, {
              settings: next,
              ...hist,
            }),
          }
        }),

      restoreFromHistory: (index) =>
        set((state) => {
          const doc = state.documents[state.currentDocIndex]
          if (!doc) return {}
          const entry = doc.history[index]
          if (!entry) return {}
          return {
            documents: updateDoc(state.documents, state.currentDocIndex, {
              settings: entry.settings,
              historyIndex: index,
            }),
          }
        }),

      applySettingsToAll: () =>
        set((state) => {
          const doc = state.documents[state.currentDocIndex]
          if (!doc) return {}
          const docs = state.documents.map((d, i) => {
            if (i === state.currentDocIndex) return d
            const hist = pushHistory(d.history, d.historyIndex, doc.settings)
            return { ...d, settings: { ...doc.settings }, ...hist }
          })
          return { documents: docs }
        }),

      setDocTotalPages: (docIndex, n) =>
        set((state) => ({
          documents: updateDoc(state.documents, docIndex, { totalPages: n }),
        })),

      setDocCurrentPage: (page) =>
        set((state) => ({
          documents: updateDoc(state.documents, state.currentDocIndex, { currentPage: page }),
        })),

      setDocPageData: (docIndex, page) =>
        set((state) => {
          const doc = state.documents[docIndex]
          if (!doc) return {}
          const pages = [...doc.pages]
          pages[page.index] = page
          return {
            documents: updateDoc(state.documents, docIndex, { pages }),
          }
        }),

      setDocLoading: (docIndex, loading) =>
        set((state) => ({
          documents: updateDoc(state.documents, docIndex, { isLoading: loading }),
        })),

      setDocLoadingProgress: (docIndex, progress) =>
        set((state) => ({
          documents: updateDoc(state.documents, docIndex, { loadingProgress: progress }),
        })),

      setDocProcessing: (docIndex, processing) =>
        set((state) => ({
          documents: updateDoc(state.documents, docIndex, { isProcessing: processing }),
        })),

      reset: () =>
        set({
          documents: [],
          currentDocIndex: 0,
        }),
    }),
    {
      name: 'dark-score-settings',
      partialize: (state) => ({
        exportDpi: state.exportDpi,
        exportMode: state.exportMode,
      }),
    }
  )
)
