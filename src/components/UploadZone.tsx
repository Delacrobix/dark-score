import { useRef, useState, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { SourceType } from '../types'

const ACCEPTED_MIME = ['application/pdf', 'image/png', 'image/jpeg']
const ACCEPTED_EXT = ['.pdf', '.png', '.jpg', '.jpeg']
const MAX_SIZE_MB = 50

function getSourceType(file: File): SourceType | null {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) return 'image'
  return null
}

export function UploadZone() {
  const setSourceFile = useAppStore((s) => s.setSourceFile)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)
      const type = getSourceType(file)
      if (!type) {
        setError('Formato no soportado. Usa PDF, PNG o JPG.')
        return
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`El archivo supera los ${MAX_SIZE_MB} MB.`)
        return
      }
      setSourceFile(file, type)
    },
    [setSourceFile]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="w-full max-w-lg flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Zona de carga de partituras"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          h-72 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3
          cursor-pointer transition-colors duration-150 outline-none
          focus-visible:ring-2 focus-visible:ring-purple-400
          ${isDragging
            ? 'border-purple-400 bg-purple-400/5'
            : 'border-zinc-700 hover:border-zinc-500'
          }
        `}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isDragging ? '#c084fc' : '#52525b'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <div className="text-center">
          <p className="text-sm font-medium text-zinc-300">
            {isDragging ? 'Suelta aquí' : 'Arrastra tu partitura aquí'}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            o haz clic para seleccionar · PDF, PNG, JPG · máx. {MAX_SIZE_MB} MB
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT.join(',')}
        className="hidden"
        onChange={onInputChange}
        aria-hidden="true"
      />

      <p className="text-xs text-zinc-700 text-center flex items-center justify-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Tus partituras nunca salen de tu dispositivo
      </p>
    </div>
  )
}

// Suppress unused import warning — used for type narrowing above
void ACCEPTED_MIME
