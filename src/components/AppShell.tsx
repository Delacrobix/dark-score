import { useAppStore } from '../store/useAppStore'
import { useProcessor } from '../lib/useProcessor'
import { UploadZone } from './UploadZone'
import { PreviewCanvas } from './PreviewCanvas'
import { ControlsPanel } from './ControlsPanel'
import { ExportButton } from './ExportButton'

export function AppShell({ onGoHome }: Readonly<{ onGoHome: () => void }>) {
  useProcessor()

  const { sourceFile, totalPages, currentPage, setCurrentPage, reset, pages } = useAppStore()
  const hasFile = sourceFile !== null
  const hasResult = pages[currentPage]?.processedCanvas != null

  let step = 1
  if (hasFile) step = 2
  if (hasResult) step = 3

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
          aria-label="Volver al inicio"
        >
          <span className="text-2xl select-none" role="img" aria-label="Clave de sol">𝄞</span>
          <span className="font-semibold text-white tracking-tight">Dark Score</span>
        </button>

        {hasFile && (
          <button
            onClick={reset}
            className="ml-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
          >
            ← Nueva partitura
          </button>
        )}

        <span className="ml-auto text-xs text-zinc-700 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Procesamiento local
        </span>
      </header>

      {/* Steps */}
      <div className="flex items-center justify-center gap-6 px-6 py-3 border-b border-zinc-800 text-xs">
        <Step number={1} label="Subir" active={step >= 1} />
        <StepDivider />
        <Step number={2} label="Ajustar" active={step >= 2} />
        <StepDivider />
        <Step number={3} label="Descargar" active={step >= 3} />
      </div>

      {/* Main */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] overflow-hidden">
        {/* Preview / Upload area */}
        <div className="flex flex-col items-center justify-center p-8 border-r border-zinc-800 gap-4 overflow-auto">
          {hasFile ? (
            <>
              <PreviewCanvas />
              {totalPages > 1 && (
                <PageNav current={currentPage} total={totalPages} onChange={setCurrentPage} />
              )}
            </>
          ) : (
            <UploadZone />
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-zinc-800 lg:border-t-0 flex flex-col gap-6">
          <ControlsPanel />

          <div className="mt-auto">
            <ExportButton />
          </div>
        </div>
      </main>
    </div>
  )
}

function Step({ number, label, active }: Readonly<{ number: number; label: string; active: boolean }>) {
  return (
    <div className={`flex items-center gap-2 transition-colors ${active ? 'text-purple-400' : 'text-zinc-700'}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border transition-colors
        ${active ? 'border-purple-400' : 'border-zinc-700'}`}>
        {number}
      </span>
      <span>{label}</span>
    </div>
  )
}

function StepDivider() {
  return <span className="text-zinc-800 select-none mx-1">·</span>
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
