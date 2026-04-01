import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { exportAsPdf, exportAsPng } from '../lib/exporter'
import type { ExportFormat } from '../lib/exporter'

export function ExportButton() {
  const { pages, sourceType, sourceFile } = useAppStore()
  const [format, setFormat] = useState<ExportFormat>(sourceType === 'image' ? 'png' : 'pdf')
  const [exporting, setExporting] = useState(false)

  const hasResult = pages.some((p) => p?.processedCanvas)

  const baseName = sourceFile?.name.replace(/\.[^.]+$/, '') ?? 'dark-score'

  const handleExport = async () => {
    if (!hasResult || exporting) return
    setExporting(true)
    try {
      if (format === 'pdf') {
        await exportAsPdf(pages, `${baseName}.pdf`)
      } else {
        await exportAsPng(pages, baseName)
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
              ${format === f
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            {f}
            {f === 'png' && pages.filter((p) => p?.processedCanvas).length > 1 && ' (ZIP)'}
          </button>
        ))}
      </div>

      <button
        onClick={() => { void handleExport() }}
        disabled={!hasResult || exporting}
        className={`w-full font-semibold py-3 rounded-lg text-sm transition-colors
          ${hasResult && !exporting
            ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
      >
        {exporting ? 'Exportando…' : 'Descargar'}
      </button>
    </div>
  )
}
