import { useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { trackEvent } from '../lib/analytics'
import type { SourceType, SourceEntry } from '../types'

const ACCEPTED_EXT = ['.pdf', '.png', '.jpg', '.jpeg']
const MAX_SIZE_MB = 50

function getSourceType(file: File): SourceType | null {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) return 'image'
  return null
}

export function UploadZone() {
  const { t } = useTranslation()
  const addDocuments = useAppStore((s) => s.addDocuments)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (fileList: FileList) => {
      setError(null)
      const entries: SourceEntry[] = []

      for (const file of Array.from(fileList)) {
        const type = getSourceType(file)
        if (!type) {
          setError(t('upload.errorFormat'))
          return
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setError(t('upload.errorSize', { size: MAX_SIZE_MB }))
          return
        }
        entries.push({ file, type })
      }

      if (entries.length > 0) {
        addDocuments(entries)
        const pdfCount = entries.filter((e) => e.type === 'pdf').length
        const imageCount = entries.filter((e) => e.type === 'image').length
        trackEvent('upload', 'upload_files', `pdf:${pdfCount},image:${imageCount}`)
      }
    },
    [addDocuments, t]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <div className="w-full max-w-lg flex flex-col gap-3">
      <button
        type="button"
        aria-label={t('upload.prompt')}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          w-full h-72 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3
          cursor-pointer transition-colors duration-150 outline-none
          focus-visible:ring-2 focus-visible:ring-purple-400
          ${isDragging ? 'border-purple-400 bg-purple-400/5' : 'border-zinc-700 hover:border-zinc-500'}
        `}
      >
        <svg
          width="40" height="40" viewBox="0 0 24 24" fill="none"
          stroke={isDragging ? '#c084fc' : '#52525b'}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-300">
            {isDragging ? t('upload.dragging') : t('upload.prompt')}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {t('upload.hint', { size: MAX_SIZE_MB })}
          </p>
        </div>
      </button>

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT.join(',')}
        multiple
        className="hidden"
        onChange={onInputChange}
      />

      <p className="text-xs text-zinc-700 text-center flex items-center justify-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        {t('upload.privacy')}
      </p>
    </div>
  )
}
