import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'wouter'
import { useAppStore, type ClearedSnapshot } from '../store/useAppStore'
import { ROUTES } from '../lib/routes'
import { useProcessor } from '../lib/useProcessor'
import { useDesignOption } from '../design/useDesignOption'
import { UploadZone } from './UploadZone'
import { PreviewCanvas } from './PreviewCanvas'
import { SplitView } from './SplitView'
import { ControlsPanel } from './ControlsPanel'
import { ExportButton, DownloadButton } from './ExportButton'
import { LanguageSelector } from './LanguageSelector'
import { DonateButton } from './DonateButton'
import { DocumentTabs } from './DocumentTabs'
import { UploadErrors } from './UploadErrors'
import { ViewerToolbar } from './ViewerToolbar'
import { SampleScoreButton } from './SampleScoreButton'
import { Glyph, Icon } from './Icon'

export function AppShell() {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const [comparing, setComparing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cleared, setCleared] = useState<ClearedSnapshot | null>(null)
  const [confirming, setConfirming] = useState(false)
  useProcessor()

  const layout = useDesignOption('editorLayout')
  const clearStyle = useDesignOption('clear')
  const emptyStyle = useDesignOption('empty')
  const estudio = layout === 'estudio'

  const { documents, currentDocIndex, reset } = useAppStore()
  const clearDocuments = useAppStore((s) => s.clearDocuments)
  const restoreDocuments = useAppStore((s) => s.restoreDocuments)
  const currentDoc = documents[currentDocIndex] ?? null
  const hasFile = documents.length > 0
  const hasResult = currentDoc?.pages[currentDoc.currentPage]?.processedCanvas != null
  const totalPages = currentDoc?.totalPages ?? 0
  const currentPage = currentDoc?.currentPage ?? 0
  const setCurrentPage = useAppStore((s) => s.setDocCurrentPage)
  const guided = emptyStyle === 'guiado' && !hasFile

  // Clearing is undoable ('deshacer') or confirmed first; the previous design cleared at once
  const closeAll = () => {
    if (clearStyle === 'deshacer') {
      const snapshot = clearDocuments()
      setCleared(snapshot.documents.length > 0 ? snapshot : null)
    } else {
      reset()
    }
    setConfirming(false)
    setMenuOpen(false)
    setComparing(false)
  }

  const onNewScore = () => {
    if (clearStyle === 'confirmar') setConfirming(true)
    else closeAll()
  }

  const handleGoHome = () => {
    // Only the previous design throws the open scores away on the way out
    if (clearStyle === 'actual') reset()
    navigate(ROUTES.home)
  }

  const dismissToast = useCallback(() => setCleared(null), [])
  const undoClear = () => {
    if (cleared) restoreDocuments(cleared)
    setCleared(null)
  }

  const newScoreControl = (mobile: boolean) =>
    confirming ? (
      <ConfirmClear count={documents.length} onConfirm={closeAll} onCancel={() => setConfirming(false)} />
    ) : (
      <button
        onClick={onNewScore}
        className={mobile
          ? 'text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1.5'
          : 'text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer flex items-center gap-1.5'}
      >
        <NewScoreLabel />
      </button>
    )

  const panelBody = (
    <>
      {guided && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <p className="text-sm font-medium text-zinc-200">{t('panel.emptyTitle')}</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{t('panel.emptyBody')}</p>
        </div>
      )}
      {guided ? (
        <div inert className="opacity-35 select-none">
          <ControlsPanel layout={layout} />
        </div>
      ) : (
        <ControlsPanel layout={layout} />
      )}
    </>
  )

  const emptyStage = (
    <div className="w-full max-w-lg flex flex-col items-center gap-4">
      <UploadZone />
      {emptyStyle === 'guiado' && <SampleScoreButton />}
    </div>
  )

  return (
    <div className={`bg-zinc-950 text-white flex flex-col ${estudio ? 'min-h-dvh lg:h-dvh' : 'min-h-screen'} ${estudio && hasFile ? 'max-lg:pb-20' : ''}`}>
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
          {hasFile && newScoreControl(false)}
        </div>

        <div className="hidden md:flex ml-auto items-center gap-4">
          <Link
            href={ROUTES.about}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
          >
            {t('header.about')}
          </Link>
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
          aria-expanded={menuOpen}
        >
          <span className={`block w-4 h-0.5 bg-zinc-400 transition-all ${menuOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
          <span className={`block w-4 h-0.5 bg-zinc-400 transition-all ${menuOpen ? '-rotate-45 -translate-y-[3px]' : ''}`} />
        </button>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex flex-col gap-3 z-50">
            {hasFile && newScoreControl(true)}
            <Link
              href={ROUTES.about}
              onClick={() => setMenuOpen(false)}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
            >
              {t('header.about')}
            </Link>
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
      {hasFile && (
        <div className="px-4 md:px-6 pt-2 empty:hidden">
          <UploadErrors />
        </div>
      )}

      {estudio ? (
        <main className="flex-1 flex flex-col lg:flex-row lg:min-h-0 lg:overflow-hidden">
          {/* Stage: the page sits on a desk a shade lighter than the chrome */}
          <div className="flex flex-col min-w-0 lg:flex-1 lg:min-h-0 bg-zinc-900/45 lg:border-r border-zinc-800">
            {hasFile && (
              <ViewerToolbar
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                hasResult={hasResult}
                comparing={comparing && hasResult}
                onToggleCompare={() => setComparing((c) => !c)}
                processing={currentDoc?.isProcessing ?? false}
              />
            )}
            <div
              className={hasFile
                ? 'relative h-[min(68dvh,760px)] lg:h-auto lg:flex-1 lg:min-h-0'
                : 'flex-1 flex items-center justify-center p-4 md:p-8 min-h-[55dvh]'}
            >
              {hasFile
                ? (comparing && hasResult ? <SplitView layout="estudio" /> : <PreviewCanvas layout="estudio" />)
                : emptyStage}
            </div>
          </div>

          <ResizablePanel
            initialWidth={340}
            className="relative flex flex-col border-t border-zinc-800 lg:border-t-0 w-full lg:shrink-0 lg:min-h-0"
          >
            <div className="flex flex-col gap-6 p-4 md:p-6 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
              {panelBody}
            </div>
            {/* The primary action never scrolls away: pinned under the panel,
                and a fixed bar on small screens once there is something to export */}
            <div
              className={`border-t border-zinc-800 bg-zinc-950 px-4 md:px-6 py-3 lg:py-4
                ${hasFile ? 'max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:pb-[calc(0.75rem+env(safe-area-inset-bottom))]' : ''}`}
            >
              <DownloadButton labelled />
            </div>
          </ResizablePanel>
        </main>
      ) : (
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
                  <LegacyPageNav current={currentPage} total={totalPages} onChange={setCurrentPage} />
                )}
              </>
            ) : (
              emptyStage
            )}
          </div>

          <ResizablePanel className="relative flex flex-col gap-6 p-4 md:p-6 border-t border-zinc-800 lg:border-t-0 w-full lg:shrink-0">
            {panelBody}
            <div className="mt-auto">
              <ExportButton />
            </div>
          </ResizablePanel>
        </main>
      )}

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

      {cleared && (
        <UndoToast
          count={cleared.documents.length}
          onUndo={undoClear}
          onDismiss={dismissToast}
          raised={estudio}
        />
      )}
    </div>
  )
}

function NewScoreLabel() {
  const { t } = useTranslation()
  const icons = useDesignOption('icons')
  if (icons !== 'svg') return <>{t('header.newScore')}</>
  return (
    <>
      <Icon name="arrow-left" size={13} />
      {t('header.newScoreLabel')}
    </>
  )
}

function ConfirmClear({ count, onConfirm, onCancel }: Readonly<{ count: number; onConfirm: () => void; onCancel: () => void }>) {
  const { t } = useTranslation()
  return (
    <span role="group" aria-label={t('header.confirmClear', { count })} className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-zinc-300">{t('header.confirmClear', { count })}</span>
      <button
        type="button"
        onClick={onConfirm}
        className="px-2.5 py-1 rounded-md bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:text-red-200 transition-colors cursor-pointer"
      >
        {t('header.confirmYes')}
      </button>
      <button
        type="button"
        autoFocus
        onClick={onCancel}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
        className="px-2.5 py-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        {t('header.confirmNo')}
      </button>
    </span>
  )
}

const TOAST_MS = 8000

function UndoToast({ count, onUndo, onDismiss, raised }: Readonly<{ count: number; onUndo: () => void; onDismiss: () => void; raised: boolean }>) {
  const { t } = useTranslation()

  useEffect(() => {
    const id = setTimeout(onDismiss, TOAST_MS)
    return () => clearTimeout(id)
  }, [onDismiss])

  return (
    <div className={`fixed inset-x-0 z-50 flex justify-center px-4 pointer-events-none bottom-6 ${raised ? 'max-lg:bottom-24' : ''}`}>
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 pl-4 pr-1.5 py-1.5 text-sm text-zinc-200 shadow-[0_14px_36px_-10px_rgba(0,0,0,0.9)] motion-safe:animate-[toast-in_220ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        <span className="pr-1">{t('toast.cleared', { count })}</span>
        <button
          type="button"
          onClick={onUndo}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 transition-colors cursor-pointer"
        >
          <Icon name="undo" size={14} />
          {t('toast.undo')}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('toast.dismiss')}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  )
}

const MIN_PANEL_WIDTH = 300
const MAX_PANEL_RATIO = 0.4

function ResizablePanel({ children, className, initialWidth = MIN_PANEL_WIDTH }: Readonly<{ children: ReactNode; className: string; initialWidth?: number }>) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(initialWidth)

  // Pointer events cover mouse, finger and pen in one path; capturing the
  // pointer keeps the drag alive even when it leaves the handle.
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startWidth = width

    const onPointerMove = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return
      const delta = startX - ev.clientX
      const maxWidth = window.innerWidth * MAX_PANEL_RATIO
      setWidth(Math.max(MIN_PANEL_WIDTH, Math.min(startWidth + delta, maxWidth)))
    }

    const onPointerUp = () => {
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', onPointerUp)
      handle.removeEventListener('pointercancel', onPointerUp)
    }

    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', onPointerUp)
    handle.addEventListener('pointercancel', onPointerUp)
  }, [width])

  return (
    <div
      ref={panelRef}
      className={className}
      style={{ width: globalThis.window !== undefined && globalThis.innerWidth >= 1024 ? width : undefined }}
    >
      <button
        type="button"
        aria-label="Resize panel"
        onPointerDown={onPointerDown}
        // touch-none: the browser must not read the drag as a scroll gesture
        className="hidden lg:flex absolute left-0 top-0 bottom-0 z-10 w-3 -ml-1.5 cursor-col-resize touch-none items-center justify-center border-0 bg-transparent p-0 group/handle"
      >
        <span className="w-0.5 h-8 rounded-full bg-zinc-700 group-hover/handle:bg-purple-400 group-active/handle:bg-purple-500 transition-colors" />
      </button>
      {children}
    </div>
  )
}

function LegacyPageNav({ current, total, onChange }: Readonly<{ current: number; total: number; onChange: (n: number) => void }>) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 0}
        aria-label={t('viewer.prevPage')}
        className="px-3 py-1 rounded border border-zinc-700 disabled:opacity-30 hover:border-zinc-500 transition-colors cursor-pointer disabled:cursor-default"
      >
        <Glyph icon="chevron-left" text="‹" size={14} />
      </button>
      <span className="text-zinc-500 tabular-nums">{current + 1} / {total}</span>
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total - 1}
        aria-label={t('viewer.nextPage')}
        className="px-3 py-1 rounded border border-zinc-700 disabled:opacity-30 hover:border-zinc-500 transition-colors cursor-pointer disabled:cursor-default"
      >
        <Glyph icon="chevron-right" text="›" size={14} />
      </button>
    </div>
  )
}
