import { useTranslation } from 'react-i18next'
import { LanguageSelector } from './LanguageSelector'
import { DonateButton } from './DonateButton'

interface LandingHeroProps {
  onGetStarted: () => void
  onAbout: () => void
}

export function LandingHero({ onGetStarted, onAbout }: Readonly<LandingHeroProps>) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-black relative">
      <div className="absolute top-4 right-6">
        <LanguageSelector />
      </div>
      <div className="mb-6 select-none text-7xl" role="img" aria-label="Treble clef">
        𝄞
      </div>

      <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-3">
        Dark Score
      </h1>

      <p className="text-lg text-zinc-400 mb-6 max-w-xs">
        {t('landing.tagline')}
      </p>

      <p className="text-sm text-zinc-600 max-w-lg leading-relaxed mb-10">
        {t('landing.description')}
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={onGetStarted}
          className="bg-purple-500 hover:bg-purple-400 text-white font-semibold px-10 py-3 rounded-lg transition-colors cursor-pointer text-base"
        >
          {t('landing.cta')}
        </button>
        <DonateButton variant="prominent" />
      </div>

      {/* Privacy section */}
      <div className="mt-10 max-w-md border border-zinc-900 rounded-xl px-6 py-5 text-left">
        <div className="flex items-center gap-2 mb-3">
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            {t('landing.privacy.badge')}
          </span>
        </div>
        <p className="text-xs text-zinc-600 leading-relaxed">
          {t('landing.privacy.body')}
        </p>
        <div className="mt-3 flex items-center gap-4">
          <a
            href="https://github.com/Delacrobix/dark-score"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            {t('landing.privacy.github')}
          </a>
          <button
            onClick={onAbout}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
          >
            {t('landing.privacy.learnMore')}
          </button>
        </div>
      </div>
    </div>
  )
}
