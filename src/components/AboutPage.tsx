import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'
import { ROUTES } from '../lib/routes'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import { UseCases } from './UseCases'

export function AboutPage() {
  const { t } = useTranslation()

  const privacyPoints = t('about.privacy.points', { returnObjects: true }) as string[]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-10 md:py-14">
        <h1 className="text-3xl font-bold mb-10">{t('about.title')}</h1>

        {/* Why */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-3 text-purple-400">{t('about.why.title')}</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{t('about.why.body')}</p>
        </section>

        {/* Use cases */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-purple-400">{t('about.useCases.title')}</h2>
          <UseCases />
        </section>

        {/* Privacy */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-3 text-purple-400">
            <span className="inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            {t('about.viewSource')}
          </a>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={ROUTES.app}
            className="inline-flex bg-purple-500 hover:bg-purple-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            {t('landing.cta')}
          </Link>
          <Link href={ROUTES.home} className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
            ← {t('about.backToHome')}
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
