import { useTranslation } from 'react-i18next'

const USE_CASES = ['nightOwls', 'stagePerformers', 'orchestraPit', 'teachers', 'custom'] as const

const USE_CASE_ICONS: Record<(typeof USE_CASES)[number], string> = {
  nightOwls: '🌙',
  stagePerformers: '🎭',
  orchestraPit: '🎻',
  teachers: '📚',
  custom: '🎨',
}

/** "Who is it for?" cards, shared by the landing and the About page. */
export function UseCases() {
  const { t } = useTranslation()

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {USE_CASES.map((key) => (
        <div key={key} className="border border-zinc-800 rounded-lg px-5 py-4 bg-zinc-950">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg" aria-hidden="true">{USE_CASE_ICONS[key]}</span>
            <h3 className="font-medium text-sm">{t(`about.useCases.${key}.title`)}</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">{t(`about.useCases.${key}.body`)}</p>
        </div>
      ))}
    </div>
  )
}
