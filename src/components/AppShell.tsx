import { useState, useRef, useCallback, type ReactNode } from 'react'
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
          <span className="text-xs text-zinc-700 flex items-center gap-1.5 relative group">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {t('header.local')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 cursor-help" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="absolute top-full right-0 mt-2 w-56 px-3 py-2 bg-zinc-800 text-zinc-300 text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
              {t('header.localTooltip')}
            </span>
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 border-r border-zinc-800 gap-4 overflow-auto min-w-0">
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

        <ResizablePanel>
          <ControlsPanel />
          <div className="mt-auto">
            <ExportButton />
          </div>
        </ResizablePanel>
      </main>
    </div>
  )
}

const MIN_PANEL_WIDTH = 300
const MAX_PANEL_RATIO = 0.4

function ResizablePanel({ children }: Readonly<{ children: ReactNode }>) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(MIN_PANEL_WIDTH)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width

    const onMouseMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX
      const maxWidth = window.innerWidth * MAX_PANEL_RATIO
      setWidth(Math.max(MIN_PANEL_WIDTH, Math.min(startWidth + delta, maxWidth)))
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [width])

  return (
    <div
      ref={panelRef}
      className="relative flex flex-col gap-6 p-6 border-t border-zinc-800 lg:border-t-0 shrink-0"
      style={{ width }}
    >
      <button
        type="button"
        aria-label="Resize panel"
        onMouseDown={onMouseDown}
        className="hidden lg:flex absolute left-0 top-0 bottom-0 w-3 -ml-1.5 cursor-col-resize items-center justify-center border-0 bg-transparent p-0 group/handle"
      >
        <span className="w-0.5 h-8 rounded-full bg-zinc-700 group-hover/handle:bg-purple-400 group-active/handle:bg-purple-500 transition-colors" />
      </button>
      {children}
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
