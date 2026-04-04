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
import { DocumentTabs } from './DocumentTabs'

export function AppShell({ onGoHome, onAbout }: Readonly<{ onGoHome: () => void; onAbout: () => void }>) {
  const { t } = useTranslation()
  const [comparing, setComparing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useProcessor()

  const { documents, currentDocIndex, reset } = useAppStore()
  const currentDoc = documents[currentDocIndex] ?? null
  const hasFile = documents.length > 0
  const hasResult = currentDoc?.pages[currentDoc.currentPage]?.processedCanvas != null
  const totalPages = currentDoc?.totalPages ?? 0
  const currentPage = currentDoc?.currentPage ?? 0
  const setCurrentPage = useAppStore((s) => s.setDocCurrentPage)

  const handleGoHome = () => {
    reset()
    onGoHome()
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 relative">
        <button
          onClick={handleGoHome}
          className="flex items-center gap-2 cursor-pointer hover:opacity-75 transition-opacity"
          aria-label="Go to home"
        >
          <span className="text-2xl select-none" role="img" aria-label="Treble clef">𝄞</span>
          <span className="font-semibold text-white tracking-tight">Dark Score</span>
        </button>

        {/* Desktop/tablet nav */}
        <div className="hidden md:flex items-center gap-3 ml-3">
          {hasFile && (
            <button
              onClick={reset}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
            >
              {t('header.newScore')}
            </button>
          )}
        </div>

        <div className="hidden md:flex ml-auto items-center gap-4">
          <button
            onClick={onAbout}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
          >
            About
          </button>
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

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden ml-auto w-8 h-8 flex flex-col items-center justify-center gap-1 cursor-pointer"
          aria-label="Menu"
        >
          <span className={`block w-4 h-0.5 bg-zinc-400 transition-all ${menuOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
          <span className={`block w-4 h-0.5 bg-zinc-400 transition-all ${menuOpen ? '-rotate-45 -translate-y-[3px]' : ''}`} />
        </button>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex flex-col gap-3 z-50">
            {hasFile && (
              <button
                onClick={() => { reset(); setMenuOpen(false) }}
                className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
              >
                {t('header.newScore')}
              </button>
            )}
            <button
              onClick={() => { onAbout(); setMenuOpen(false) }}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
            >
              About
            </button>
            <DonateButton />
            <LanguageSelector />
            <span className="text-xs text-zinc-500 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {t('header.local')}
            </span>
          </div>
        )}
      </header>

      {/* Document tabs */}
      <DocumentTabs />

      {/* Main */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-8 border-r border-zinc-800 gap-4 overflow-auto min-w-0">
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

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 md:px-6 py-3 flex items-center justify-center gap-4 text-xs text-zinc-600">
        <span>{t('footer.bugReport')}</span>
        <a
          href="mailto:rerindev@gmail.com"
          className="hover:text-zinc-400 transition-colors"
        >
          rerindev@gmail.com
        </a>
        <span className="text-zinc-800">|</span>
        <a
          href="https://github.com/Delacrobix/dark-score/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-400 transition-colors"
        >
          GitHub Issues
        </a>
      </footer>
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
      className="relative flex flex-col gap-6 p-4 md:p-6 border-t border-zinc-800 lg:border-t-0 w-full lg:shrink-0"
      style={{ width: globalThis.window !== undefined && globalThis.innerWidth >= 1024 ? width : undefined }}
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
