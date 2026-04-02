import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type ProcessingSettings,
  type PageData,
  type PresetId,
  type SourceType,
  type SliderKey,
  DEFAULT_SETTINGS,
  PRESETS,
} from '../types'

const MAX_HISTORY = 30

export interface SourceEntry {
  file: File
  type: SourceType
}

export interface HistoryEntry {
  settings: ProcessingSettings
  timestamp: number
}

interface AppState {
  sources: SourceEntry[]
  totalPages: number
  currentPage: number
  pages: PageData[]
  isLoading: boolean
  loadingProgress: number

  settings: ProcessingSettings
  exportDpi: 200 | 300

  history: HistoryEntry[]
  historyIndex: number

  isProcessing: boolean

  setExportDpi: (dpi: 200 | 300) => void
  setSources: (sources: SourceEntry[]) => void
  addSources: (sources: SourceEntry[]) => void
  setTotalPages: (n: number) => void
  setCurrentPage: (n: number) => void
  setPageData: (page: PageData) => void
  setIsLoading: (loading: boolean) => void
  setLoadingProgress: (progress: number) => void
  setIsProcessing: (processing: boolean) => void
  updateSettings: (partial: Partial<ProcessingSettings>) => void
  resetSlider: (key: SliderKey) => void
  applyPreset: (id: PresetId) => void
  restoreFromHistory: (index: number) => void
  reset: () => void
}

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

const initialHistory: HistoryEntry[] = [{ settings: DEFAULT_SETTINGS, timestamp: Date.now() }]

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sources: [],
      totalPages: 0,
      currentPage: 0,
      pages: [],
      isLoading: false,
      loadingProgress: 0,
      settings: DEFAULT_SETTINGS,
      exportDpi: 200,
      history: initialHistory,
      historyIndex: 0,
      isProcessing: false,

      setExportDpi: (dpi) => set({ exportDpi: dpi }),

      setSources: (sources) =>
        set({ sources, currentPage: 0, pages: [], totalPages: 0 }),

      addSources: (newSources) =>
        set((state) => ({
          sources: [...state.sources, ...newSources],
        })),

      setTotalPages: (n) => set({ totalPages: n }),
      setCurrentPage: (n) => set({ currentPage: n }),

      setPageData: (page) =>
        set((state) => {
          const pages = [...state.pages]
          pages[page.index] = page
          return { pages }
        }),

      setIsLoading: (loading) => set({ isLoading: loading }),
      setLoadingProgress: (progress) => set({ loadingProgress: progress }),
      setIsProcessing: (processing) => set({ isProcessing: processing }),

      updateSettings: (partial) =>
        set((state) => {
          const next = { ...state.settings, ...partial }
          return { settings: next, ...pushHistory(state.history, state.historyIndex, next) }
        }),

      resetSlider: (key) =>
        set((state) => {
          const preset = PRESETS.find((p) => p.id === state.settings.presetId)
          const defaultVal = preset?.defaults[key] ?? DEFAULT_SETTINGS[key]
          const next = { ...state.settings, [key]: defaultVal }
          return { settings: next, ...pushHistory(state.history, state.historyIndex, next) }
        }),

      applyPreset: (id) =>
        set((state) => {
          const preset = PRESETS.find((p) => p.id === id)
          if (!preset) return {}
          const next: ProcessingSettings =
            id === 'custom'
              ? { ...state.settings, presetId: 'custom' }
              : { ...state.settings, presetId: id, bgColor: preset.bgColor, fgColor: preset.fgColor, ...preset.defaults }
          return { settings: next, ...pushHistory(state.history, state.historyIndex, next) }
        }),

      restoreFromHistory: (index) =>
        set((state) => {
          const entry = state.history[index]
          if (!entry) return {}
          return { settings: entry.settings, historyIndex: index }
        }),

      reset: () =>
        set({
          sources: [],
          totalPages: 0,
          currentPage: 0,
          pages: [],
          isLoading: false,
          loadingProgress: 0,
          isProcessing: false,
        }),
    }),
    {
      name: 'dark-score-settings',
      partialize: (state) => ({
        settings: state.settings,
        exportDpi: state.exportDpi,
        history: state.history,
        historyIndex: state.historyIndex,
      }),
    }
  )
)
