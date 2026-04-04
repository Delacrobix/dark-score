export type PresetId =
  | 'stage'
  | 'study'
  | 'pit'
  | 'classical'
  | 'jazz'
  | 'pop'
  | 'bluelight'
  | 'custom'

export type SliderKey = 'contrast' | 'brightness' | 'threshold' | 'dilation'

export interface PresetDefaults {
  contrast: number
  brightness: number
  threshold: number
  dilation: number
}

export interface Preset {
  id: PresetId
  name: string
  description: string
  bgColor: string
  fgColor: string
  defaults: PresetDefaults
}

export interface ProcessingSettings {
  presetId: PresetId
  bgColor: string
  fgColor: string
  contrast: number    // 0–200
  brightness: number  // 0–200
  threshold: number   // 0–255
  dilation: number    // 0–3
}

export interface PageData {
  index: number
  originalImageData: ImageData
  processedCanvas: HTMLCanvasElement | null
}

export type SourceType = 'pdf' | 'image'

export interface SourceEntry {
  file: File
  type: SourceType
}

export interface HistoryEntry {
  settings: ProcessingSettings
  timestamp: number
}

export type ExportMode = 'merged' | 'separate'

export interface DocumentEntry {
  id: string
  source: SourceEntry
  label: string
  settings: ProcessingSettings
  history: HistoryEntry[]
  historyIndex: number
  pages: PageData[]
  totalPages: number
  currentPage: number
  isLoading: boolean
  loadingProgress: number
  isProcessing: boolean
}

export interface WorkerRequest {
  id: number
  imageData: ImageData
  settings: ProcessingSettings
}

export interface WorkerResponse {
  id: number
  imageData: ImageData
}

export const PRESETS: Preset[] = [
  {
    // Pure black + white, boosted contrast — maximum legibility on dark stages
    id: 'stage',
    name: 'Dark stage',
    description: 'AMOLED black',
    bgColor: '#000000',
    fgColor: '#ffffff',
    defaults: { contrast: 110, brightness: 100, threshold: 140, dilation: 0 },
  },
  {
    // Very dark gray + light gray — less aggressive than pure black, easier for long sessions
    id: 'study',
    name: 'Night study',
    description: 'Soft gray',
    bgColor: '#1a1a1a',
    fgColor: '#e0e0e0',
    defaults: { contrast: 100, brightness: 95, threshold: 130, dilation: 0 },
  },
  {
    // Very dark brown + cream — warm amber tones reduce eye strain in dimly lit pits
    id: 'pit',
    name: 'Orchestra pit',
    description: 'Cream / amber',
    bgColor: '#1c1410',
    fgColor: '#f5e6c8',
    defaults: { contrast: 100, brightness: 90, threshold: 120, dilation: 1 },
  },
  {
    // Classical scores are dense with fine notation — high threshold to clean old prints,
    // no dilation to preserve spacing between close staff lines and small noteheads
    id: 'classical',
    name: 'Classical',
    description: 'Dense scores',
    bgColor: '#0f0f0f',
    fgColor: '#efefef',
    defaults: { contrast: 115, brightness: 98, threshold: 150, dilation: 0 },
  },
  {
    // Jazz Real Book style — often handwritten or scanned PDFs with chord symbols.
    // Lower threshold handles uneven ink from old photocopies; slight dilation helps thin lines.
    id: 'jazz',
    name: 'Jazz',
    description: 'Real book style',
    bgColor: '#141414',
    fgColor: '#e8e0d0',
    defaults: { contrast: 105, brightness: 92, threshold: 115, dilation: 1 },
  },
  {
    // Pop/Rock lead sheets are simple with larger notation — slight dilation for bolder look,
    // warmer tone for a relaxed reading feel
    id: 'pop',
    name: 'Pop / Rock',
    description: 'Lead sheets',
    bgColor: '#111318',
    fgColor: '#dde3f0',
    defaults: { contrast: 100, brightness: 100, threshold: 130, dilation: 1 },
  },
  {
    // Very warm amber — filters blue light for late-night practice sessions
    id: 'bluelight',
    name: 'Blue light filter',
    description: 'Late night',
    bgColor: '#1a1200',
    fgColor: '#ffd580',
    defaults: { contrast: 95, brightness: 85, threshold: 125, dilation: 0 },
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Choose colors',
    bgColor: '#000000',
    fgColor: '#ffffff',
    defaults: { contrast: 100, brightness: 100, threshold: 128, dilation: 0 },
  },
]

export const DEFAULT_PRESET = PRESETS[0]

export const DEFAULT_SETTINGS: ProcessingSettings = {
  presetId: 'stage',
  bgColor: DEFAULT_PRESET.bgColor,
  fgColor: DEFAULT_PRESET.fgColor,
  ...DEFAULT_PRESET.defaults,
}
