import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { PRESETS } from '../types'

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function HistoryPanel() {
  const { t } = useTranslation()
  const { documents, currentDocIndex, restoreFromHistory } = useAppStore()
  const currentDoc = documents[currentDocIndex]
  const history = currentDoc?.history ?? []
  const historyIndex = currentDoc?.historyIndex ?? 0
  const [open, setOpen] = useState(false)

  // Show most recent first
  const entries = [...history].reverse()
  const reversedCurrentIndex = history.length - 1 - historyIndex

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="12 8 12 12 14 14" />
          <path d="M3.05 11a9 9 0 1 1 .5 4" />
          <polyline points="3 16 3 11 8 11" />
        </svg>
        {t('history.label')}
        <span className="text-zinc-700">({history.length})</span>
        <span className="ml-auto">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-zinc-800 overflow-hidden">
          {entries.length === 0 ? (
            <p className="text-xs text-zinc-600 px-3 py-2">{t('history.empty')}</p>
          ) : (
            <ul className="max-h-48 overflow-y-auto divide-y divide-zinc-800/60">
              {entries.map((entry, i) => {
                const isCurrent = i === reversedCurrentIndex
                const presetName = PRESETS.find((p) => p.id === entry.settings.presetId)?.id ?? entry.settings.presetId
                const originalIndex = history.length - 1 - i

                return (
                  <li key={entry.timestamp}>
                    <button
                      onClick={() => restoreFromHistory(originalIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer
                        ${isCurrent
                          ? 'bg-purple-500/10 text-white'
                          : 'text-zinc-400 hover:bg-zinc-800/60'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                        )}
                        <span className={isCurrent ? 'font-medium' : ''}>
                          {t(`presets.${presetName}.name`)}
                        </span>
                        <span className="text-zinc-600 tabular-nums">
                          {entry.settings.contrast}% · {entry.settings.brightness}% · {entry.settings.threshold}
                        </span>
                      </span>
                      <span className="text-zinc-700 tabular-nums shrink-0 ml-2">
                        {formatTime(entry.timestamp)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
