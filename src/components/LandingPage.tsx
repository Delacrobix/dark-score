import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'wouter'
import { useAppStore } from '../store/useAppStore'
import { trackEvent } from '../lib/analytics'
import { createSampleScore } from '../lib/sampleScore'
import { ROUTES } from '../lib/routes'
import { useDesignOption } from '../design/useDesignOption'
import { useDisplayHeadings } from '../design/useDisplayHeadings'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import { UploadZone } from './UploadZone'
import { BeforeAfter } from './BeforeAfter'
import { UseCases } from './UseCases'
import { Faq } from './Faq'
import { SampleScoreButton } from './SampleScoreButton'
import { Icon } from './Icon'

const STEPS = ['upload', 'adjust', 'download'] as const

export function LandingPage() {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const addDocuments = useAppStore((s) => s.addDocuments)
  const eyebrow = useDesignOption('eyebrow')
  const sample = useDesignOption('sample')
  const mobileHero = useDesignOption('mobileHero')
  const headings = useDisplayHeadings()

  const openEditor = () => navigate(ROUTES.app)

  const loadSample = () => {
    addDocuments([createSampleScore()])
    trackEvent('upload', 'sample_score')
    openEditor()
  }

  const facts = t('landing.facts', { returnObjects: true }) as string[]

  const eyebrowEl = eyebrow === 'actual' && (
    <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4">
      {t('landing.eyebrow')}
    </p>
  )
  const titleEl = (
    <h1 className={`${headings.h1} mb-4`}>
      {t('landing.tagline')}
    </h1>
  )
  const descriptionEl = (
    <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
      {t('landing.description')}
    </p>
  )
  const actionsEl = (
    <div>
      <UploadZone compact onFilesAdded={openEditor} showPrivacy={eyebrow === 'actual'} />

      {sample === 'boton' ? (
        <SampleScoreButton onLoaded={openEditor} className="mt-3" />
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>{t('landing.sampleHint')}</span>
          <button
            type="button"
            onClick={loadSample}
            className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-4 cursor-pointer"
          >
            {t('landing.sample')}
          </button>
        </div>
      )}

      {eyebrow === 'hechos' && (
        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400">
          {facts.map((fact) => (
            <li key={fact} className="flex items-center gap-1.5">
              <Icon name="check" size={13} strokeWidth={2.25} className="text-purple-300" />
              {fact}
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {mobileHero === 'demo-primero' ? (
          // Same desktop composition; on small screens the before/after (the
          // proof) comes right after the headline, then the action, then the copy.
          <section className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-16 pb-14 grid lg:grid-cols-2 lg:gap-x-14 lg:items-center">
            <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
              {eyebrowEl}
              {titleEl}
            </div>
            <div className="mt-3 lg:mt-0 lg:col-start-2 lg:row-start-1 lg:row-span-3">
              <BeforeAfter />
            </div>
            <div className="mt-8 lg:mt-0 lg:col-start-1 lg:row-start-3 lg:self-start">
              {actionsEl}
            </div>
            <div className="mt-8 lg:mt-0 lg:mb-8 lg:col-start-1 lg:row-start-2">
              {descriptionEl}
            </div>
          </section>
        ) : (
          /* Hero: headline + drop zone on the left, live before/after on the right */
          <section className="max-w-6xl mx-auto px-4 md:px-6 pt-8 md:pt-16 pb-14 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              {eyebrowEl}
              {titleEl}
              <div className="mb-8">{descriptionEl}</div>
              {actionsEl}
            </div>

            <BeforeAfter />
          </section>
        )}

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-14 border-t border-zinc-900">
          <h2 className={`${headings.h2} mb-8`}>{t('landing.how.title')}</h2>
          <ol className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-purple-500/15 text-purple-400 font-semibold text-sm flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-medium text-sm mb-1">{t(`steps.${step}`)}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{t(`landing.how.${step}`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Use cases */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-14 border-t border-zinc-900">
          <h2 className={`${headings.h2} mb-8`}>{t('about.useCases.title')}</h2>
          <UseCases />
        </section>

        {/* Privacy */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-14 border-t border-zinc-900">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h2 className={headings.h2}>{t('landing.privacy.badge')}</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">{t('landing.privacy.body')}</p>
            <div className="flex items-center gap-4 text-xs">
              <a
                href="https://github.com/Delacrobix/dark-score"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {t('landing.privacy.github')}
              </a>
              <Link href={ROUTES.about} className="text-purple-400 hover:text-purple-300 transition-colors">
                {t('landing.privacy.learnMore')}
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-14 border-t border-zinc-900">
          <h2 className={`${headings.h2} mb-8`}>{t('landing.faq.title')}</h2>
          <Faq />
        </section>

        {/* Final CTA */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-14 border-t border-zinc-900 text-center">
          <h2 className={`${headings.h2} mb-6`}>{t('landing.tagline')}</h2>
          <Link
            href={ROUTES.app}
            className="inline-flex bg-purple-500 hover:bg-purple-400 text-white font-semibold px-10 py-3 rounded-lg transition-colors"
          >
            {t('landing.cta')}
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
