import { useTranslation } from 'react-i18next'
import { DonateButton } from './DonateButton'

const linkClass = 'hover:text-zinc-300 transition-colors'

/** Footer for the content pages (landing, about). */
export function SiteFooter() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-zinc-900 mt-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row md:items-center gap-4 text-xs text-zinc-600">
        <p className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          {t('landing.privacy.badge')}
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 md:ml-auto">
          <a href="https://github.com/Delacrobix/dark-score" target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t('footer.source')}
          </a>
          <a href="https://github.com/Delacrobix/dark-score/issues" target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t('footer.bugReport')} GitHub Issues
          </a>
          <a href="mailto:rerindev@gmail.com" className={linkClass}>rerindev@gmail.com</a>
          <DonateButton />
        </nav>
      </div>
    </footer>
  )
}
