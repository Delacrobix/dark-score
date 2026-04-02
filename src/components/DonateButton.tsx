import { useTranslation } from 'react-i18next'

// TODO: replace with real donation link (PayPal, Ko-fi, etc.)
const DONATE_URL = 'https://ko-fi.com/placeholder'

export function DonateButton({ variant = 'subtle' }: Readonly<{ variant?: 'subtle' | 'prominent' }>) {
  const { t } = useTranslation()

  if (variant === 'prominent') {
    return (
      <a
        href={DONATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 hover:border-zinc-600 text-xs text-zinc-400 hover:text-white transition-colors"
      >
        <span aria-hidden="true">♥</span>
        {t('donate.label')}
      </a>
    )
  }

  return (
    <a
      href={DONATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors flex items-center gap-1"
    >
      <span aria-hidden="true">♥</span>
      {t('donate.label')}
    </a>
  )
}
