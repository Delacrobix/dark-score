import { useTranslation } from 'react-i18next'
import { useDesignOption } from '../design/useDesignOption'
import { PRESETS, type PresetId } from '../types'
import { PresetSwatch } from './PresetSwatch'
import { Glyph, type IconName } from './Icon'

const USE_CASES = ['nightOwls', 'stagePerformers', 'orchestraPit', 'teachers', 'custom'] as const

const USE_CASE_ICONS: Record<(typeof USE_CASES)[number], string> = {
  nightOwls: '🌙',
  stagePerformers: '🎭',
  orchestraPit: '🎻',
  teachers: '📚',
  custom: '🎨',
}

const USE_CASE_DRAWN: Record<(typeof USE_CASES)[number], IconName> = {
  nightOwls: 'moon',
  stagePerformers: 'spotlight',
  orchestraPit: 'music',
  teachers: 'graduation',
  custom: 'sliders',
}

/** The preset each audience is pointed to (the copy names most of them). */
const USE_CASE_PRESET: Record<(typeof USE_CASES)[number], PresetId> = {
  nightOwls: 'bluelight',
  stagePerformers: 'stage',
  orchestraPit: 'pit',
  teachers: 'study',
  custom: 'custom',
}

/** Custom has no fixed colours: show one example of a palette someone might pick. */
const CUSTOM_EXAMPLE = { bg: '#0f1d24', fg: '#a8e6d6' }

/** "Who is it for?", shared by the landing and the About page. */
export function UseCases() {
  const { t } = useTranslation()
  const style = useDesignOption('audience')

  if (style === 'paletas') {
    return (
      <ul className="grid md:grid-cols-2 gap-x-14">
        {USE_CASES.map((key) => {
          const presetId = USE_CASE_PRESET[key]
          const preset = PRESETS.find((p) => p.id === presetId)!
          const colors = presetId === 'custom' ? CUSTOM_EXAMPLE : { bg: preset.bgColor, fg: preset.fgColor }
          return (
            <li key={key} className="flex gap-5 py-6 border-t border-zinc-900">
              <PresetSwatch bg={colors.bg} fg={colors.fg} className="w-[72px] h-12 shrink-0" />
              <div className="min-w-0">
                <h3 className="font-medium text-[15px] text-zinc-100">{t(`about.useCases.${key}.title`)}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mt-1.5 max-w-[60ch]">{t(`about.useCases.${key}.body`)}</p>
                <p className="text-xs text-purple-300 mt-2.5">
                  {t('about.useCases.preset', { name: t(`presets.${presetId}.name`) })}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {USE_CASES.map((key) => (
        <div key={key} className="border border-zinc-800 rounded-lg px-5 py-4 bg-zinc-950">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg text-purple-300" aria-hidden="true">
              <Glyph icon={USE_CASE_DRAWN[key]} text={USE_CASE_ICONS[key]} size={17} />
            </span>
            <h3 className="font-medium text-sm">{t(`about.useCases.${key}.title`)}</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">{t(`about.useCases.${key}.body`)}</p>
        </div>
      ))}
    </div>
  )
}
