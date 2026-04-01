import { useAppStore } from '../store/useAppStore'
import { PRESETS } from '../types'

export function ControlsPanel() {
  const {
    settings,
    applyPreset,
    updateSettings,
    resetSlider,
    undo,
    redo,
    settingsHistory,
    historyIndex,
    isProcessing,
  } = useAppStore()

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < settingsHistory.length - 1

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Presets */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Modo</h2>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => {
            const active = settings.presetId === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`text-left px-3 py-2.5 rounded-lg border transition-colors text-xs cursor-pointer
                  ${active
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-zinc-800 hover:border-zinc-600 text-zinc-300'
                  }`}
              >
                <span className="block font-medium mb-0.5">{preset.name}</span>
                <span className="text-zinc-600">{preset.description}</span>
              </button>
            )
          })}
        </div>

        {settings.presetId === 'custom' && (
          <div className="mt-3 flex gap-3">
            <label className="flex-1">
              <span className="text-xs text-zinc-500 block mb-1">Fondo</span>
              <input
                type="color"
                value={settings.bgColor}
                onChange={(e) => updateSettings({ bgColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
              />
            </label>
            <label className="flex-1">
              <span className="text-xs text-zinc-500 block mb-1">Notación</span>
              <input
                type="color"
                value={settings.fgColor}
                onChange={(e) => updateSettings({ fgColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
              />
            </label>
          </div>
        )}
      </section>

      {/* Sliders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Ajustes</h2>
          <div className="flex items-center gap-2">
            <UndoRedoButton onClick={undo} disabled={!canUndo} title="Deshacer">↩</UndoRedoButton>
            <UndoRedoButton onClick={redo} disabled={!canRedo} title="Rehacer">↪</UndoRedoButton>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Slider
            label="Contraste"
            value={settings.contrast}
            min={0} max={200}
            onChange={(v) => updateSettings({ contrast: v })}
            onReset={() => resetSlider('contrast')}
            format={(v) => `${v}%`}
          />
          <Slider
            label="Brillo"
            value={settings.brightness}
            min={0} max={200}
            onChange={(v) => updateSettings({ brightness: v })}
            onReset={() => resetSlider('brightness')}
            format={(v) => `${v}%`}
          />
          <Slider
            label="Limpieza de escaneo"
            value={settings.threshold}
            min={0} max={255}
            onChange={(v) => updateSettings({ threshold: v })}
            onReset={() => resetSlider('threshold')}
            format={String}
          />
          <div>
            <Slider
              label="Engrosamiento de líneas"
              value={settings.dilation}
              min={0} max={3}
              step={1}
              onChange={(v) => updateSettings({ dilation: v })}
              onReset={() => resetSlider('dilation')}
              format={String}
            />
            {settings.dilation >= 2 && (
              <p className="text-xs text-amber-500/80 mt-1.5">
                Nivel alto: las notas en pasajes densos pueden empastarse.
              </p>
            )}
          </div>
        </div>
      </section>

      {isProcessing && (
        <p className="text-xs text-zinc-600 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          {' '}Procesando…
        </p>
      )}
    </div>
  )
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  onReset: () => void
  format: (v: number) => string
}

function Slider({ label, value, min, max, step = 1, onChange, onReset, format }: Readonly<SliderProps>) {
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className="text-zinc-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 tabular-nums">{format(value)}</span>
          <button
            onClick={onReset}
            title="Restablecer"
            className="text-zinc-700 hover:text-zinc-400 transition-colors cursor-pointer leading-none"
          >
            ↺
          </button>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-purple-400 cursor-pointer"
      />
    </div>
  )
}

function UndoRedoButton({ onClick, disabled, title, children }: Readonly<{
  onClick: () => void
  disabled: boolean
  title: string
  children: React.ReactNode
}>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
    >
      {children}
    </button>
  )
}

