import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'
import { ROUTES } from '../lib/routes'
import { DonateButton } from './DonateButton'
import { LanguageSelector } from './LanguageSelector'

/** Header for the content pages (landing, about). The editor has its own. */
export function SiteHeader() {
  const { t } = useTranslation()

  return (
    <header className="px-4 md:px-6 py-4 flex items-center gap-4 max-w-6xl mx-auto w-full">
      <Link href={ROUTES.home} className="flex items-center gap-2 hover:opacity-75 transition-opacity">
        <span className="text-2xl select-none" role="img" aria-label="Treble clef">𝄞</span>
        <span className="font-semibold tracking-tight">Dark Score</span>
      </Link>
      <nav className="ml-auto flex items-center gap-4 md:gap-5 text-xs">
        <Link href={ROUTES.about} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          {t('header.about')}
        </Link>
        <span className="hidden sm:inline"><DonateButton /></span>
        <LanguageSelector />
        <Link
          href={ROUTES.app}
          className="hidden sm:inline-flex bg-purple-500 hover:bg-purple-400 text-white font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
        >
          {t('header.openApp')}
        </Link>
      </nav>
    </header>
  )
}
