import { useTranslation } from 'react-i18next'
import { Glyph, Icon } from './Icon'
import { ZoomControls } from './ZoomControls'

const navButton =
  'w-7 h-7 flex items-center justify-center rounded border border-zinc-700 text-zinc-300 disabled:opacity-30 hover:border-zinc-500 transition-colors cursor-pointer disabled:cursor-default'

export function PageNav({ current, total, onChange }: Readonly<{ current: number; total: number; onChange: (n: number) => void }>) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 0}
        aria-label={t('viewer.prevPage')}
        className={navButton}
      >
        <Glyph icon="chevron-left" text="‹" size={15} />
      </button>
      <span className="text-zinc-400 text-xs tabular-nums min-w-[3.25rem] text-center">{current + 1} / {total}</span>
      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === total - 1}
        aria-label={t('viewer.nextPage')}
        className={navButton}
      >
        <Glyph icon="chevron-right" text="›" size={15} />
      </button>
    </div>
  )
}

interface ViewerToolbarProps {
  currentPage: number
  totalPages: number
  onPageChange: (n: number) => void
  hasResult: boolean
  comparing: boolean
  onToggleCompare: () => void
  processing: boolean
}

/** 'estudio' layout: one bar over the viewer with pages, zoom and compare. */
export function ViewerToolbar({
  currentPage,
  totalPages,
  onPageChange,
  hasResult,
  comparing,
  onToggleCompare,
  processing,
}: Readonly<ViewerToolbarProps>) {
  const { t } = useTranslation()

  return (
    <div className="shrink-0 h-12 flex items-center gap-2 sm:gap-3 px-2 sm:px-4 border-b border-zinc-800 bg-zinc-950">
      <div className="flex-1 min-w-0 flex items-center">
        {totalPages > 1 && <PageNav current={currentPage} total={totalPages} onChange={onPageChange} />}
      </div>

      <ZoomControls disabled={!hasResult} />

      <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
        {processing && (
          <span role="status" className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400">
            <Icon name="loader" size={13} className="animate-spin" />
            {t('viewer.updating')}
          </span>
        )}
        <button
          type="button"
          onClick={onToggleCompare}
          disabled={!hasResult}
          aria-pressed={comparing}
          aria-label={t('splitView.toggle')}
          className={`h-7 px-2 sm:px-2.5 flex items-center gap-1.5 rounded border text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed
            ${comparing
              ? 'border-purple-500/60 bg-purple-500/10 text-purple-200'
              : 'border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500'}`}
        >
          <Icon name="compare" size={13} />
          <span className="hidden sm:inline">{t('splitView.toggle')}</span>
        </button>
      </div>
    </div>
  )
}
