import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'
import { getRouteMeta } from '../lib/seo'
import { langFromPath } from '../lib/routes'

function setMeta(selector: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(selector)
  if (el) el.setAttribute('content', content)
}

/**
 * Keeps i18n language, <html lang>, <title> and description in sync with the URL.
 * Rendered once at the root, outside any language-nested router.
 */
export function RouteEffects() {
  const [absPath] = useLocation()
  const { i18n, t } = useTranslation()
  const lang = langFromPath(absPath)

  // Language is derived from the URL; the URL is the source of truth.
  if (i18n.resolvedLanguage !== lang) {
    i18n.changeLanguage(lang)
  }

  useEffect(() => {
    const meta = getRouteMeta(absPath, t)
    document.documentElement.lang = meta.lang
    document.title = meta.title
    setMeta('meta[name="description"]', meta.description)
    setMeta('meta[property="og:title"]', meta.title)
    setMeta('meta[property="og:description"]', meta.description)
    setMeta('meta[property="og:url"]', meta.canonical)
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', meta.canonical)
  }, [absPath, lang, t])

  return null
}

