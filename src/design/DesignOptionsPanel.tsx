import { useEffect, useState } from 'react'
import { DESIGN_OPTIONS, OPTION_IDS, type DesignValues, type OptionId } from './options'
import { OPTION_DOCS, AREAS } from './optionDocs'
import { useDesignOptions } from './useDesignOption'

// Development-only tool to switch the design variants live, to compare the
// production choice with the previous design or try another one. Never
// shipped: App.tsx imports it behind import.meta.env.DEV.

const OPEN_KEY = 'dark-score-design-panel-open'

function readOpen(): boolean {
  try {
    return window.sessionStorage.getItem(OPEN_KEY) !== '0'
  } catch {
    return true
  }
}

export default function DesignOptionsPanel() {
  const values = useDesignOptions((s) => s.values)
  const setOption = useDesignOptions((s) => s.setOption)
  const setAll = useDesignOptions((s) => s.setAll)
  const [open, setOpen] = useState(readOpen)
  const [copied, setCopied] = useState(false)

  const asProduction = OPTION_IDS.filter((id) => values[id] === DESIGN_OPTIONS[id].chosen).length

  // CSS-level options read a data attribute on <html>
  useEffect(() => {
    document.documentElement.dataset.contrast = values.contrast
  }, [values.contrast])

  useEffect(() => {
    try {
      window.sessionStorage.setItem(OPEN_KEY, open ? '1' : '0')
    } catch {
      // ignore
    }
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const copyChoice = async () => {
    const lines = OPTION_IDS.map((id) => {
      const doc = OPTION_DOCS[id]
      const label = (doc.labels as Record<string, string>)[values[id]]
      return `- ${doc.title}: ${label} (${id}=${values[id]})`
    })
    const text = `Elección de diseño para Dark Score:\n${lines.join('\n')}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('Copia tu elección:', text)
    }
  }

  return (
    <div lang="es" className="fixed left-4 bottom-4 max-lg:bottom-24 z-[60] text-zinc-200 font-sans">
      {open && (
        <div
          role="dialog"
          aria-label="Opciones de diseño"
          className="mb-2 w-[min(400px,calc(100vw-2rem))] max-h-[min(74vh,760px)] flex flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.9)]"
        >
          <div className="px-4 pt-4 pb-3 border-b border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Opciones de diseño</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {asProduction} de {OPTION_IDS.length} como en producción · solo en desarrollo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-md hover:bg-zinc-800 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAll('previous')}
                className="text-xs py-1.5 rounded-md border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white cursor-pointer"
              >
                Todo como antes
              </button>
              <button
                type="button"
                onClick={() => setAll('chosen')}
                className="text-xs py-1.5 rounded-md border border-purple-500/60 text-purple-200 hover:border-purple-400 hover:text-white cursor-pointer"
              >
                Todo como en producción
              </button>
            </div>
          </div>

          <div className="overflow-y-auto px-4">
            {AREAS.map((area) => (
              <section key={area} className="pt-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{area}</h3>
                {OPTION_IDS.filter((id) => OPTION_DOCS[id].area === area).map((id) => {
                  const doc = OPTION_DOCS[id]
                  const labels = doc.labels as Record<string, string>
                  return (
                    <div key={id} className="py-3 border-b border-zinc-800 last:border-b-0">
                      <h4 className="text-[13px] font-medium text-white">{doc.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{doc.why}</p>
                      <div role="radiogroup" aria-label={doc.title} className="mt-2 flex flex-wrap gap-1.5">
                        {DESIGN_OPTIONS[id].variants.map((variant) => {
                          const active = values[id] === variant
                          const live = DESIGN_OPTIONS[id].chosen === variant
                          return (
                            <button
                              key={variant}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setOption(id as OptionId, variant as DesignValues[OptionId])}
                              className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer
                                ${active
                                  ? 'border-purple-400 bg-purple-500/20 text-white'
                                  : 'border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'}`}
                            >
                              {labels[variant]}
                              {live && <span className="ml-1.5 text-[10px] text-purple-300">en producción</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </section>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-400">Se guarda en este navegador.</p>
            <button
              type="button"
              onClick={() => { void copyChoice() }}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
            >
              {copied ? 'Copiado' : 'Copiar mi elección'}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/95 pl-3 pr-3.5 py-2 text-xs font-medium text-zinc-200 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.9)] hover:border-purple-400 hover:text-white cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-purple-400" aria-hidden="true" />
        Opciones de diseño
        <span className="text-zinc-400 tabular-nums">{asProduction}/{OPTION_IDS.length}</span>
      </button>
    </div>
  )
}
