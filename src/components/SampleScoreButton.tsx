import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { trackEvent } from '../lib/analytics'
import { createSampleScore } from '../lib/sampleScore'
import { Icon } from './Icon'

/** Loads the illustrated sample score: the quickest way to see the product without a file. */
export function SampleScoreButton({ onLoaded, className = '' }: Readonly<{ onLoaded?: () => void; className?: string }>) {
  const { t } = useTranslation()
  const addDocuments = useAppStore((s) => s.addDocuments)

  const load = () => {
    addDocuments([createSampleScore()])
    trackEvent('upload', 'sample_score')
    onLoaded?.()
  }

  return (
    <button
      type="button"
      onClick={load}
      className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer ${className}`}
    >
      <Icon name="music" size={16} className="text-purple-300" />
      {t('landing.sample')}
    </button>
  )
}
