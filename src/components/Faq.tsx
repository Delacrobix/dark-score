import { useTranslation } from 'react-i18next'

interface FaqItem {
  q: string
  a: string
}

/** FAQ list with FAQPage structured data so search engines can show rich results. */
export function Faq() {
  const { t } = useTranslation()
  const items = t('landing.faq.items', { returnObjects: true }) as FaqItem[]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      <dl className="grid md:grid-cols-2 gap-x-10 gap-y-8">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="font-medium text-sm text-white mb-1.5">{item.q}</dt>
            <dd className="text-sm text-zinc-500 leading-relaxed">{item.a}</dd>
          </div>
        ))}
      </dl>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
