import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { scoreSvg } from '../lib/scoreSvg'

const LIGHT = { bg: '#ffffff', fg: '#111111' }
const DARK = { bg: '#000000', fg: '#ffffff' } // "Dark stage" preset colours

/** Draggable original-vs-result comparison of the illustrated sample score. */
export function BeforeAfter() {
  const { t } = useTranslation()
  const id = useId()
  const [pos, setPos] = useState(58)
  const light = useMemo(() => scoreSvg({ ...LIGHT, crop: true }), [])
  const dark = useMemo(() => scoreSvg({ ...DARK, crop: true }), [])

  const layer = 'absolute inset-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:block'

  return (
    <figure className="relative w-full aspect-[1000/620] rounded-xl overflow-hidden border border-zinc-800 shadow-2xl shadow-purple-950/40 select-none">
      <div className={layer} aria-hidden="true" dangerouslySetInnerHTML={{ __html: dark }} />
      <div
        className={layer}
        aria-hidden="true"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        dangerouslySetInnerHTML={{ __html: light }}
      />

      {/* divider */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-purple-400 pointer-events-none" style={{ left: `${pos}%` }} aria-hidden="true">
        <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs shadow-lg">
          ⇔
        </span>
      </div>

      <figcaption className="absolute top-2 left-2 text-[10px] uppercase tracking-widest font-semibold text-zinc-700 bg-white/80 px-2 py-0.5 rounded pointer-events-none">
        {t('landing.demo.before')}
      </figcaption>
      <span className="absolute top-2 right-2 text-[10px] uppercase tracking-widest font-semibold text-zinc-300 bg-black/70 px-2 py-0.5 rounded pointer-events-none">
        {t('landing.demo.after')}
      </span>

      <label htmlFor={id} className="sr-only">{t('landing.demo.label')}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0"
      />
    </figure>
  )
}
