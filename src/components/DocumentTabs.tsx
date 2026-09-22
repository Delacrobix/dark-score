import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { trackEvent } from '../lib/analytics'
import { ACCEPTED_EXT, intakeFiles, intakeLabel } from '../lib/fileIntake'

export function DocumentTabs() {
  const { t } = useTranslation()
  const { documents, currentDocIndex, setCurrentDocIndex, removeDocument, addDocuments } = useAppStore()
  const setRejectedFiles = useAppStore((s) => s.setRejectedFiles)
  const inputRef = useRef<HTMLInputElement>(null)

  if (documents.length === 0) return null

  const handleAddFiles = (fileList: FileList) => {
    const { entries, rejected } = intakeFiles(Array.from(fileList))
    setRejectedFiles(rejected)
    if (entries.length > 0) {
      addDocuments(entries, true)
      trackEvent('upload', 'upload_files', intakeLabel(entries))
    }
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
          {doc.error && (
            <span className="text-[10px] text-red-400" title={t(`errors.${doc.error === 'password-protected' ? 'passwordProtected' : 'loadFailed'}`)}>
              !
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
