import { useTranslation } from 'react-i18next'
import { LanguageSelector } from './LanguageSelector'
import { DonateButton } from './DonateButton'

interface AboutPageProps {
  onBack: () => void
}

const USE_CASES = ['nightOwls', 'stagePerformers', 'orchestraPit', 'teachers', 'custom'] as const

const USE_CASE_ICONS: Record<string, string> = {
  nightOwls: '🌙',
  stagePerformers: '🎭',
  orchestraPit: '🎻',
  teachers: '📚',
  custom: '🎨',
}

export function AboutPage({ onBack }: Readonly<AboutPageProps>) {
  const { t } = useTranslation()

  const privacyPoints = t('about.privacy.points', { returnObjects: true }) as string[]

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 cursor-pointer hover:opacity-75 transition-opacity"
        >
          <span className="text-2xl select-none">𝄞</span>
          <span className="font-semibold tracking-tight">Dark Score</span>
        </button>
        <div className="ml-auto flex items-center gap-4">
          <DonateButton />
          <LanguageSelector />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-10">{t('about.title')}</h1>

        {/* Why */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-3 text-purple-400">{t('about.why.title')}</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{t('about.why.body')}</p>
        </section>

        {/* Use cases */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-purple-400">{t('about.useCases.title')}</h2>
          <div className="flex flex-col gap-5">
            {USE_CASES.map((key) => (
              <div key={key} className="border border-zinc-800 rounded-lg px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{USE_CASE_ICONS[key]}</span>
                  <h3 className="font-medium text-sm">{t(`about.useCases.${key}.title`)}</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{t(`about.useCases.${key}.body`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-3 text-purple-400">
            <span className="inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {t('about.privacy.title')}
            </span>
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-4">{t('about.privacy.howItWorks')}</p>
          <ul className="flex flex-col gap-2 mb-4">
            {privacyPoints.map((point) => (
              <li key={point} className="text-sm text-zinc-400 flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">✓</span>
                {point}
              </li>
            ))}
          </ul>
          <p className="text-sm text-zinc-500 leading-relaxed italic">{t('about.privacy.why')}</p>

          <a
            href="https://github.com/Delacrobix/dark-score"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            View source code on GitHub
          </a>
        </section>

        {/* Back */}
        <button
          onClick={onBack}
          className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
        >
          ← {t('about.backToHome')}
        </button>
      </main>
    </div>
  )
}
