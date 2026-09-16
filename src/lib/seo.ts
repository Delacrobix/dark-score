import { langFromPath, localizePath, routeKeyFromPath, stripLang, LANGS, type Lang, type RouteKey } from './routes'

export const SITE_URL = 'https://darkscore.app'

export interface RouteMeta {
  lang: Lang
  key: RouteKey
  title: string
  description: string
  canonical: string
  /** Same page in every language, for hreflang links. */
  alternates: { lang: Lang; href: string }[]
  noindex: boolean
}

/** Builds the SEO metadata for an absolute path, using the given translator. */
export function getRouteMeta(absPath: string, t: (key: string) => string): RouteMeta {
  const lang = langFromPath(absPath)
  const relative = stripLang(absPath)
  const key = routeKeyFromPath(relative)
  return {
    lang,
    key,
    title: t(`seo.${key}.title`),
    description: t(`seo.${key}.description`),
    canonical: SITE_URL + localizePath(relative, lang),
    alternates: LANGS.map((l) => ({ lang: l, href: SITE_URL + localizePath(relative, l) })),
    noindex: key === 'app',
  }
}

/** Returns the absolute path of the current page in another language. */
export function pathInLang(absPath: string, lang: Lang): string {
  return localizePath(stripLang(absPath), lang)
}
