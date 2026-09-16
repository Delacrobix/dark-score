export type Lang = 'en' | 'es'

export const DEFAULT_LANG: Lang = 'en'
export const LANGS: readonly Lang[] = ['en', 'es'] as const

/** Route paths relative to the language prefix. */
export const ROUTES = {
  home: '/',
  app: '/app',
  about: '/about',
} as const

export type RouteKey = keyof typeof ROUTES

/** URL prefix for a language: '' for English (default), '/es' for Spanish. */
export function langPrefix(lang: Lang): string {
  return lang === DEFAULT_LANG ? '' : `/${lang}`
}

/** Language encoded in an absolute path ('/es/about' → 'es', '/about' → 'en'). */
export function langFromPath(path: string): Lang {
  const first = path.split('/')[1]
  return LANGS.includes(first as Lang) && first !== DEFAULT_LANG ? (first as Lang) : DEFAULT_LANG
}

/** Absolute path without its language prefix ('/es/about' → '/about'). */
export function stripLang(path: string): string {
  const lang = langFromPath(path)
  if (lang === DEFAULT_LANG) return path
  const rest = path.slice(langPrefix(lang).length)
  return rest === '' ? '/' : rest
}

/** Absolute path for a relative route in a language (('/about', 'es') → '/es/about'). */
export function localizePath(relative: string, lang: Lang): string {
  const prefix = langPrefix(lang)
  if (relative === '/') return prefix || '/'
  return `${prefix}${relative}`
}

/** Which page a relative path corresponds to. */
export function routeKeyFromPath(relative: string): RouteKey {
  const clean = relative.replace(/\/+$/, '') || '/'
  const entry = (Object.entries(ROUTES) as [RouteKey, string][]).find(([, p]) => p === clean)
  return entry?.[0] ?? 'home'
}
