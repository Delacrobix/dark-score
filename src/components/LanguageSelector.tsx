import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
]

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage?.slice(0, 2) ?? 'en'

  return (
    <div className="flex items-center gap-1 text-xs">
      {LANGS.map((lang, idx) => (
        <span key={lang.code} className="flex items-center gap-1">
          <button
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`transition-colors cursor-pointer ${
              current === lang.code
                ? 'text-white font-semibold'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {lang.label}
          </button>
          {idx < LANGS.length - 1 && <span className="text-zinc-800">·</span>}
        </span>
      ))}
    </div>
  )
}
