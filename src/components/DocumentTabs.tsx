import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import type { SourceType, SourceEntry } from '../types'

const ACCEPTED_EXT = ['.pdf', '.png', '.jpg', '.jpeg']

function getSourceType(file: File): SourceType | null {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) return 'image'
  return null
}

export function DocumentTabs() {
  const { t } = useTranslation()
  const { documents, currentDocIndex, setCurrentDocIndex, removeDocument, addDocuments } = useAppStore()
  const inputRef = useRef<HTMLInputElement>(null)

  if (documents.length === 0) return null

  const handleAddFiles = (fileList: FileList) => {
    const entries: SourceEntry[] = []
    for (const file of Array.from(fileList)) {
      const type = getSourceType(file)
      if (!type) continue
      entries.push({ file, type })
    }
    if (entries.length > 0) addDocuments(entries, true)
  }

  return (
    <div className="flex items-center gap-1 px-2 md:px-6 py-1.5 border-b border-zinc-800 overflow-x-auto">
      {documents.map((doc, i) => (
        <div
          key={doc.id}
          role="tab"
          tabIndex={0}
          onClick={() => setCurrentDocIndex(i)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCurrentDocIndex(i) }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer shrink-0
            ${i === currentDocIndex
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-zinc-700'
            }`}
        >
          <span className="max-w-32 truncate">{doc.label}</span>
          {doc.isLoading && (
            <span className="text-[10px] text-zinc-600">
              {Math.round(doc.loadingProgress * 100)}%
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); removeDocument(i) }}
            className="ml-0.5 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
            aria-label={`Remove ${doc.label}`}
          >
            x
          </button>
        </div>
      ))}

      <button
        onClick={() => inputRef.current?.click()}
        className="px-2 py-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer shrink-0"
      >
        {t('documents.addMore')}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT.join(',')}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleAddFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
