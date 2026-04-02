import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { useProcessor } from '../lib/useProcessor'
import { UploadZone } from './UploadZone'
import { PreviewCanvas } from './PreviewCanvas'
import { SplitView } from './SplitView'
import { ControlsPanel } from './ControlsPanel'
import { ExportButton } from './ExportButton'
import { LanguageSelector } from './LanguageSelector'
import { DonateButton } from './DonateButton'

export function AppShell({ onGoHome }: Readonly<{ onGoHome: () => void }>) {
  const { t } = useTranslation()
  const [comparing, setComparing] = useState(false)
  useProcessor()

  const { sources, totalPages, currentPage, setCurrentPage, reset, pages } = useAppStore()
  const hasFile = sources.length > 0
  const hasResult = pages[currentPage]?.processedCanvas != null

  const handleGoHome = () => {
    reset()
    onGoHome()
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3">
        <button
          onClick={handleGoHome}
          className="flex items-center gap-2 cursor-pointer hover:opacity-75 transition-opacity"
          aria-label="Go to home"
        >
          <span className="text-2xl select-none" role="img" aria-label="Treble clef">𝄞</span>
          <span className="font-semibold text-white tracking-tight">Dark Score</span>
        </button>

        {hasFile && (
          <button
            onClick={reset}
            className="ml-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
          >
            {t('header.newScore')}
          </button>
        )}

        <div className="ml-auto flex items-center gap-4">
          <DonateButton />
          <LanguageSelector />
          <span className="text-xs text-zinc-700 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {t('header.local')}
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] overflow-hidden">
        <div className="flex flex-col items-center justify-center p-8 border-r border-zinc-800 gap-4 overflow-auto">
          {hasFile ? (
            <>
              {hasResult && (
                <button
                  onClick={() => setComparing((c) => !c)}
                  className={`text-xs px-3 py-1 rounded border transition-colors cursor-pointer
                    ${comparing
                      ? 'border-purple-500 text-purple-400'
                      : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  {t('splitView.toggle')}
                </button>
              )}
              {comparing && hasResult ? <SplitView /> : <PreviewCanvas />}
              {totalPages > 1 && (
                <PageNav current={currentPage} total={totalPages} onChange={setCurrentPage} />
              )}
            </>
          ) : (
            <UploadZone />
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 lg:border-t-0 flex flex-col gap-6">
          <ControlsPanel />
          <div className="mt-auto">
            <ExportButton />
          </div>
        </div>
      </main>
    </div>
  )
}

function PageNav({ current, total, onChange }: Readonly<{ current: number; total: number; onChange: (n: number) => void }>) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 0}
        className="px-3 py-1 rounded border border-zinc-700 disabled:opacity-30 hover:border-zinc-500 transition-colors cursor-pointer disabled:cursor-default"
      >
        ‹
      </button>
      <span className="text-zinc-500 tabular-nums">{current + 1} / {total}</span>
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total - 1}
        className="px-3 py-1 rounded border border-zinc-700 disabled:opacity-30 hover:border-zinc-500 transition-colors cursor-pointer disabled:cursor-default"
      >
        ›
      </button>
    </div>
  )
}
