import { useTranslation } from 'react-i18next'

const KOFI_URL = 'https://ko-fi.com/R6R01X43VF'
const KOFI_COLOR = '#FF5E5B'

// Inline coffee-cup icon: avoids a third-party image request to ko-fi's CDN.
function CupIcon({ size }: Readonly<{ size: number }>) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  )
}

export function DonateButton({ variant = 'subtle' }: Readonly<{ variant?: 'subtle' | 'prominent' }>) {
  const { t } = useTranslation()

  if (variant === 'prominent') {
    return (
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-white font-semibold transition-opacity hover:opacity-80"
        style={{ backgroundColor: KOFI_COLOR }}
      >
        <CupIcon size={16} />
        {t('donate.label')}
      </a>
    )
  }

  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs transition-colors flex items-center gap-1 hover:opacity-80"
      style={{ color: KOFI_COLOR }}
    >
      <CupIcon size={12} />
      {t('donate.label')}
    </a>
  )
}
