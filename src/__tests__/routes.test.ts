import { describe, it, expect } from 'vitest'
import { langFromPath, stripLang, localizePath, routeKeyFromPath } from '../lib/routes'
import { getRouteMeta } from '../lib/seo'

describe('routes helpers', () => {
  it('detects the language from the URL prefix', () => {
    expect(langFromPath('/')).toBe('en')
    expect(langFromPath('/about')).toBe('en')
    expect(langFromPath('/es')).toBe('es')
    expect(langFromPath('/es/about')).toBe('es')
    expect(langFromPath('/estonia')).toBe('en')
  })

  it('strips the language prefix', () => {
    expect(stripLang('/es')).toBe('/')
    expect(stripLang('/es/about')).toBe('/about')
    expect(stripLang('/about')).toBe('/about')
    expect(stripLang('/')).toBe('/')
  })

  it('localizes relative paths', () => {
    expect(localizePath('/', 'en')).toBe('/')
    expect(localizePath('/', 'es')).toBe('/es')
    expect(localizePath('/about', 'es')).toBe('/es/about')
    expect(localizePath('/app', 'en')).toBe('/app')
  })

  it('maps paths to route keys', () => {
    expect(routeKeyFromPath('/')).toBe('home')
    expect(routeKeyFromPath('/about')).toBe('about')
    expect(routeKeyFromPath('/app/')).toBe('app')
    expect(routeKeyFromPath('/unknown')).toBe('home')
  })
})

describe('getRouteMeta', () => {
  const t = (k: string) => `T(${k})`

  it('builds canonical and hreflang alternates for a Spanish page', () => {
    const meta = getRouteMeta('/es/about', t)
    expect(meta.lang).toBe('es')
    expect(meta.key).toBe('about')
    expect(meta.title).toBe('T(seo.about.title)')
    expect(meta.canonical).toBe('https://darkscore.app/es/about')
    expect(meta.alternates).toEqual([
      { lang: 'en', href: 'https://darkscore.app/about' },
      { lang: 'es', href: 'https://darkscore.app/es/about' },
    ])
    expect(meta.noindex).toBe(false)
  })

  it('marks the editor as noindex', () => {
    expect(getRouteMeta('/app', t).noindex).toBe(true)
    expect(getRouteMeta('/es/app', t).canonical).toBe('https://darkscore.app/es/app')
  })
})
