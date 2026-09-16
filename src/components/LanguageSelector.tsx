import { useTranslation } from 'react-i18next'
import { Link, useLocation, useRouter } from 'wouter'
import { pathInLang } from '../lib/seo'
import type { Lang } from '../lib/routes'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
]

/** Switches language by navigating to the same page under the other language prefix. */
export function LanguageSelector() {
  const { i18n } = useTranslation()
  const router = useRouter()
  const [relative] = useLocation()
  const current = i18n.resolvedLanguage?.slice(0, 2) ?? 'en'
  const absPath = `${router.base}${relative === '/' ? '' : relative}` || '/'

  return (
    <div className="flex items-center gap-1 text-xs">
      {LANGS.map((lang, idx) => (
        <span key={lang.code} className="flex items-center gap-1">
          <Link
            href={`~${pathInLang(absPath, lang.code)}`}
            hrefLang={lang.code}
            className={`transition-colors cursor-pointer ${
              current === lang.code
                ? 'text-white font-semibold'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {lang.label}
          </Link>
          {idx < LANGS.length - 1 && <span className="text-zinc-800">·</span>}
        </span>
      ))}
    </div>
  )
}
