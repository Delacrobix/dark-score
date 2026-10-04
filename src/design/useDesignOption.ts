import { create } from 'zustand'
import { DESIGN_OPTIONS, OPTION_IDS, type DesignValues, type OptionId } from './options'

const STORAGE_KEY = 'dark-score-design-options'

const CHOSEN = Object.fromEntries(OPTION_IDS.map((id) => [id, DESIGN_OPTIONS[id].chosen])) as DesignValues
const PREVIOUS = Object.fromEntries(OPTION_IDS.map((id) => [id, 'actual'])) as DesignValues

/** Overrides picked in the dev panel. Ignored in production and on the server. */
function readOverrides(): Partial<DesignValues> {
  if (!import.meta.env.DEV || typeof window === 'undefined') return {}
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, string>
    const valid: Record<string, string> = {}
    for (const id of OPTION_IDS) {
      if ((DESIGN_OPTIONS[id].variants as readonly string[]).includes(raw[id])) valid[id] = raw[id]
    }
    return valid as Partial<DesignValues>
  } catch {
    return {}
  }
}

function persist(values: DesignValues) {
  if (!import.meta.env.DEV) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
  } catch {
    // private mode or storage disabled: the choice just won't survive a reload
  }
}

interface DesignOptionsState {
  values: DesignValues
  setOption: <K extends OptionId>(id: K, variant: DesignValues[K]) => void
  /** 'chosen' = what production renders; 'previous' = the design before 2026-10-04. */
  setAll: (preset: 'chosen' | 'previous') => void
}

export const useDesignOptions = create<DesignOptionsState>()((set) => ({
  values: { ...CHOSEN, ...readOverrides() },
  setOption: (id, variant) =>
    set((state) => {
      const values = { ...state.values, [id]: variant }
      persist(values)
      return { values }
    }),
  setAll: (preset) =>
    set(() => {
      const values = { ...(preset === 'previous' ? PREVIOUS : CHOSEN) }
      persist(values)
      return { values }
    }),
}))

/** Active variant of a design option. */
export function useDesignOption<K extends OptionId>(id: K): DesignValues[K] {
  return useDesignOptions((s) => s.values[id])
}

/** Same, outside React (store actions, event handlers). */
export function getDesignOption<K extends OptionId>(id: K): DesignValues[K] {
  return useDesignOptions.getState().values[id]
}
