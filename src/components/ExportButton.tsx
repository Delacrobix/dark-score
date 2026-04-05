import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { exportAsPdf, exportAsPng } from '../lib/exporter'
import type { ExportFormat } from '../lib/exporter'
import type { ExportMode } from '../types'
import { trackEvent } from '../lib/analytics'

const DPI_OPTIONS = [200, 300] as const

export function ExportButton() {
  const { t } = useTranslation()
  const { documents, currentDocIndex, exportDpi, exportMode, setExportDpi, setExportMode } = useAppStore()
  const currentDoc = documents[currentDocIndex] ?? null
  const hasPdf = documents.some((d) => d.source.type === 'pdf')
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [exporting, setExporting] = useState(false)

  const hasResult = documents.some((d) => d.pages.some((p) => p?.processedCanvas))
  const multiDoc = documents.length > 1
  const allPages = documents.flatMap((d) => d.pages)
  const multiPage = allPages.filter((p) => p?.processedCanvas).length > 1

  const handleExport = async () => {
    if (!hasResult || exporting) return
    setExporting(true)
    const mode = multiDoc ? exportMode : 'single'
    trackEvent('export', 'export_file', `format:${format},mode:${mode},docs:${documents.length}`)
    try {
      if (multiDoc && format === 'pdf' && exportMode === 'merged') {
        await exportAsPdf(allPages, 'dark-score-batch.pdf')
      } else if (currentDoc) {
        const readyPages = currentDoc.pages.filter((p) => p?.processedCanvas)
        if (readyPages.length === 0) return
        if (format === 'pdf') {
          await exportAsPdf(readyPages, `${currentDoc.label}.pdf`)
        } else {
          await exportAsPng(readyPages, currentDoc.label)
        }
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Format selector */}
      <div className="flex rounded-lg overflow-hidden border border-zinc-800 text-xs">
        {(['pdf', 'png'] as ExportFormat[]).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            disabled={!hasResult}
            className={`flex-1 py-1.5 font-medium uppercase tracking-wide transition-colors cursor-pointer disabled:cursor-not-allowed
              ${format === f ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {f}{f === 'png' && multiPage ? t('export.zipSuffix') : ''}
          </button>
        ))}
      </div>

      {/* Export mode (merged vs separate) - only for PDF */}
      {multiDoc && format === 'pdf' && (
        <div className="flex rounded-lg overflow-hidden border border-zinc-800 text-xs">
          {(['separate', 'merged'] as ExportMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setExportMode(mode)}
              className={`flex-1 py-1.5 font-medium transition-colors cursor-pointer
                ${exportMode === mode ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {t(`export.${mode}`)}
            </button>
          ))}
        </div>
      )}

      {/* DPI selector (only for PDFs) */}
      {hasPdf && (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>DPI</span>
          <div className="flex gap-1">
            {DPI_OPTIONS.map((dpi) => (
              <button
                key={dpi}
                onClick={() => setExportDpi(dpi)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer
                  ${exportDpi === dpi
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-600 hover:text-zinc-300'
                  }`}
              >
                {dpi}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => { void handleExport() }}
        disabled={!hasResult || exporting}
        className={`w-full font-semibold py-3 rounded-lg text-sm transition-colors
          ${hasResult && !exporting
            ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
      >
        {exporting ? t('export.exporting') : t('export.button')}
      </button>
    </div>
  )
}
