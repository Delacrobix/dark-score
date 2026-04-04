import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { trackEvent } from '../lib/analytics'
import { PRESETS, DEFAULT_SETTINGS } from '../types'
import { HistoryPanel } from './HistoryPanel'

export function ControlsPanel() {
  const { t } = useTranslation()
  const { documents, currentDocIndex, applyPreset, updateSettingsLive, commitToHistory, resetSlider, applySettingsToAll } = useAppStore()
  const currentDoc = documents[currentDocIndex]
  const settings = currentDoc?.settings ?? DEFAULT_SETTINGS
  const showApplyAll = documents.length > 1

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Presets */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          {t('presets.label')}
        </h2>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
          {PRESETS.map((preset) => {
            const active = settings.presetId === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => { applyPreset(preset.id); trackEvent('preset', 'apply_preset', preset.id) }}
                className={`text-left px-3 py-2.5 rounded-lg border transition-colors text-xs cursor-pointer
                  ${active
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-zinc-800 hover:border-zinc-600 text-zinc-300'
                  }`}
              >
                <span className="block font-medium mb-0.5 break-words">{t(`presets.${preset.id}.name`)}</span>
                <span className="text-zinc-600 block break-words">{t(`presets.${preset.id}.description`)}</span>
              </button>
            )
          })}
        </div>

        {settings.presetId === 'custom' && (
          <div className="mt-3 flex gap-3">
            <label className="flex-1">
              <span className="text-xs text-zinc-500 block mb-1">{t('presets.bgColor')}</span>
              <input
                type="color"
                value={settings.bgColor}
                onChange={(e) => updateSettingsLive({ bgColor: e.target.value })}
                onBlur={commitToHistory}
                className="w-full h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
              />
            </label>
            <label className="flex-1">
              <span className="text-xs text-zinc-500 block mb-1">{t('presets.fgColor')}</span>
              <input
                type="color"
                value={settings.fgColor}
                onChange={(e) => updateSettingsLive({ fgColor: e.target.value })}
                onBlur={commitToHistory}
                className="w-full h-8 rounded cursor-pointer border border-zinc-700 bg-transparent"
              />
            </label>
          </div>
        )}
      </section>

      {/* Sliders */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          {t('controls.label')}
        </h2>

        <div className="flex flex-col gap-4">
          <Slider
            label={t('controls.contrast')}
            value={settings.contrast}
            min={0} max={200}
            onChange={(v) => updateSettingsLive({ contrast: v })}
            onCommit={commitToHistory}
            onReset={() => resetSlider('contrast')}
            format={(v) => `${v}%`}
          />
          <Slider
            label={t('controls.brightness')}
            value={settings.brightness}
            min={0} max={200}
            onChange={(v) => updateSettingsLive({ brightness: v })}
            onCommit={commitToHistory}
            onReset={() => resetSlider('brightness')}
            format={(v) => `${v}%`}
          />
          <Slider
            label={t('controls.threshold')}
            value={settings.threshold}
            min={0} max={255}
            onChange={(v) => updateSettingsLive({ threshold: v })}
            onCommit={commitToHistory}
            onReset={() => resetSlider('threshold')}
            format={String}
          />
          <div>
            <Slider
              label={t('controls.dilation')}
              value={settings.dilation}
              min={0} max={3} step={1}
              onChange={(v) => updateSettingsLive({ dilation: v })}
              onCommit={commitToHistory}
              onReset={() => resetSlider('dilation')}
              format={String}
            />
            {settings.dilation >= 2 && (
              <p className="text-xs text-amber-500/80 mt-1.5">
                {t('controls.dilationWarning')}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Apply to all documents */}
      {showApplyAll && (
        <button
          onClick={applySettingsToAll}
          className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
        >
          {t('documents.applyToAll')}
        </button>
      )}

      {/* History */}
      <HistoryPanel />

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
  onCommit: () => void
  onReset: () => void
  format: (v: number) => string
}

function Slider({ label, value, min, max, step = 1, onChange, onCommit, onReset, format }: Readonly<SliderProps>) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className="text-zinc-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 tabular-nums">{format(value)}</span>
          <button
            onClick={onReset}
            title={t('controls.reset')}
            className="text-zinc-700 hover:text-zinc-400 transition-colors cursor-pointer leading-none"
          >
            ↺
          </button>
        </div>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        className="w-full accent-purple-400 cursor-pointer"
      />
    </div>
  )
}
