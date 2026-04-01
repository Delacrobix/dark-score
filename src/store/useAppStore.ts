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

const MAX_HISTORY = 50

interface AppState {
  // Source file
  sourceFile: File | null
  sourceType: SourceType | null
  totalPages: number
  currentPage: number
  pages: PageData[]
  isLoading: boolean
  loadingProgress: number

  // Settings (persisted)
  settings: ProcessingSettings

  // Undo/redo history
  settingsHistory: ProcessingSettings[]
  historyIndex: number

  // UI
  isProcessing: boolean

  // Actions
  setSourceFile: (file: File, type: SourceType) => void
  setTotalPages: (n: number) => void
  setCurrentPage: (n: number) => void
  setPageData: (page: PageData) => void
  setIsLoading: (loading: boolean) => void
  setLoadingProgress: (progress: number) => void
  setIsProcessing: (processing: boolean) => void
  updateSettings: (partial: Partial<ProcessingSettings>) => void
  resetSlider: (key: SliderKey) => void
  applyPreset: (id: PresetId) => void
  undo: () => void
  redo: () => void
  reset: () => void
}

function pushHistory(
  history: ProcessingSettings[],
  index: number,
  next: ProcessingSettings
): { settingsHistory: ProcessingSettings[]; historyIndex: number } {
  const trimmed = history.slice(0, index + 1)
  const newHistory = [...trimmed, next].slice(-MAX_HISTORY)
  return { settingsHistory: newHistory, historyIndex: newHistory.length - 1 }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sourceFile: null,
      sourceType: null,
      totalPages: 0,
      currentPage: 0,
      pages: [],
      isLoading: false,
      loadingProgress: 0,
      settings: DEFAULT_SETTINGS,
      settingsHistory: [DEFAULT_SETTINGS],
      historyIndex: 0,
      isProcessing: false,

      setSourceFile: (file, type) =>
        set({ sourceFile: file, sourceType: type, currentPage: 0, pages: [], totalPages: 0 }),

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
          return {
            settings: next,
            ...pushHistory(state.settingsHistory, state.historyIndex, next),
          }
        }),

      resetSlider: (key) =>
        set((state) => {
          const preset = PRESETS.find((p) => p.id === state.settings.presetId)
          const defaultVal = preset?.defaults[key] ?? DEFAULT_SETTINGS[key]
          const next = { ...state.settings, [key]: defaultVal }
          return {
            settings: next,
            ...pushHistory(state.settingsHistory, state.historyIndex, next),
          }
        }),

      applyPreset: (id) =>
        set((state) => {
          const preset = PRESETS.find((p) => p.id === id)
          if (!preset) return {}
          const next: ProcessingSettings =
            id === 'custom'
              ? { ...state.settings, presetId: 'custom' }
              : {
                  ...state.settings,
                  presetId: id,
                  bgColor: preset.bgColor,
                  fgColor: preset.fgColor,
                  ...preset.defaults,
                }
          return {
            settings: next,
            ...pushHistory(state.settingsHistory, state.historyIndex, next),
          }
        }),

      undo: () =>
        set((state) => {
          const idx = Math.max(0, state.historyIndex - 1)
          return { historyIndex: idx, settings: state.settingsHistory[idx] }
        }),

      redo: () =>
        set((state) => {
          const idx = Math.min(state.settingsHistory.length - 1, state.historyIndex + 1)
          return { historyIndex: idx, settings: state.settingsHistory[idx] }
        }),

      reset: () =>
        set({
          sourceFile: null,
          sourceType: null,
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
        settingsHistory: state.settingsHistory,
        historyIndex: state.historyIndex,
      }),
    }
  )
)
