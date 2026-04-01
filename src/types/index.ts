export type PresetId = 'stage' | 'study' | 'pit' | 'custom'

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
    id: 'stage',
    name: 'Escenario oscuro',
    description: 'Negro AMOLED',
    bgColor: '#000000',
    fgColor: '#ffffff',
    defaults: { contrast: 110, brightness: 100, threshold: 140, dilation: 0 },
  },
  {
    id: 'study',
    name: 'Estudio nocturno',
    description: 'Gris suave',
    bgColor: '#1a1a1a',
    fgColor: '#e0e0e0',
    defaults: { contrast: 100, brightness: 95, threshold: 130, dilation: 0 },
  },
  {
    id: 'pit',
    name: 'Foso de orquesta',
    description: 'Crema / ámbar',
    bgColor: '#1c1410',
    fgColor: '#f5e6c8',
    defaults: { contrast: 100, brightness: 90, threshold: 120, dilation: 1 },
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Elige colores',
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
