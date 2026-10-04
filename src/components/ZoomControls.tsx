import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useViewerZoom, MIN_ZOOM, MAX_ZOOM } from '../lib/useViewerZoom'
import { Glyph, Icon } from './Icon'

const stepButton =
  'w-7 h-7 flex items-center justify-center rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm'

/** − 100% + (and "Fit" when the editor offers a fitted zoom). The percentage can be typed. */
export function ZoomControls({ disabled = false }: Readonly<{ disabled?: boolean }>) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const { zoom, isFit, fitMode, zoomIn, zoomOut, setZoom, fit } = useViewerZoom()
  const [isEditing, setIsEditing] = useState(false)

  const handleEditStart = () => {
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleEditConfirm = () => {
    setIsEditing(false)
    const val = Number.parseInt(inputRef.current?.value ?? '', 10)
    if (!Number.isNaN(val) && val >= MIN_ZOOM) setZoom(val)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditConfirm()
    if (e.key === 'Escape') setIsEditing(false)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={zoomOut}
        disabled={disabled || zoom <= MIN_ZOOM}
        aria-label={t('viewer.zoomOut')}
        className={stepButton}
      >
        <Glyph icon="minus" text="−" size={14} />
      </button>
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          defaultValue={zoom}
          aria-label={t('viewer.zoomLevel')}
          onBlur={handleEditConfirm}
          onKeyDown={handleEditKeyDown}
          className="w-14 text-xs text-center text-white bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 tabular-nums outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      ) : (
        <button
          type="button"
          onClick={handleEditStart}
          disabled={disabled}
          className="text-xs text-zinc-500 hover:text-white disabled:opacity-30 transition-colors cursor-pointer tabular-nums min-w-[3rem] text-center"
        >
          {zoom}%
        </button>
      )}
      <button
        type="button"
        onClick={zoomIn}
        disabled={disabled || zoom >= MAX_ZOOM}
        aria-label={t('viewer.zoomIn')}
        className={stepButton}
      >
        <Glyph icon="plus" text="+" size={14} />
      </button>
      {fitMode !== 'manual' && (
        <button
          type="button"
          onClick={fit}
          disabled={disabled}
          aria-pressed={isFit}
          aria-label={t(fitMode === 'fit-page' ? 'viewer.fitPage' : 'viewer.fitWidth')}
          title={t(fitMode === 'fit-page' ? 'viewer.fitPage' : 'viewer.fitWidth')}
          className={`h-7 px-2 flex items-center gap-1.5 rounded border text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed
            ${isFit
              ? 'border-purple-500/60 bg-purple-500/10 text-purple-200'
              : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'}`}
        >
          <Icon name="fit" size={13} />
          <span className="hidden sm:inline">{t('viewer.fit')}</span>
        </button>
      )}
    </div>
  )
}
