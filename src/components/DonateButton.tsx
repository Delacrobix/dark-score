import { useTranslation } from 'react-i18next'

const KOFI_URL = 'https://ko-fi.com/R6R01X43VF'
const KOFI_COLOR = '#FF5E5B'

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
        <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="" height="16" width="16" className="h-4 w-4" />
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
      <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="" height="12" width="12" className="h-3 w-3" />
      {t('donate.label')}
    </a>
  )
}
