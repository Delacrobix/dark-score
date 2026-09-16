// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement } from 'react'
import i18n from '../i18n'
import App from '../App'

// Client-side smoke test: routing, language from URL, <title> sync and
// the language switcher. Exercises what the prerender step cannot.
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

async function mountAt(path: string) {
  window.history.replaceState(null, '', path)
  await act(async () => {
    root.render(createElement(App))
  })
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  window.localStorage.clear()
})

describe('App routing', () => {
  it('renders the English landing at /', async () => {
    await mountAt('/')
    expect(container.textContent).toContain('Convert your sheet music to dark mode')
    expect(document.title).toBe(i18n.getFixedT('en')('seo.home.title'))
    expect(document.documentElement.lang).toBe('en')
  })

  it('renders the Spanish landing at /es and links to Spanish pages', async () => {
    await mountAt('/es')
    expect(container.textContent).toContain('Convierte tus partituras a modo oscuro')
    expect(document.title).toBe(i18n.getFixedT('es')('seo.home.title'))
    expect(document.documentElement.lang).toBe('es')
    const appLinks = Array.from(container.querySelectorAll('a[href="/es/app"]')).map((a) => a.textContent)
    expect(appLinks).toContain('Abrir la app')
    expect(appLinks).toContain('Empezar')
    expect(container.querySelector('a[href="/es/about"]')).not.toBeNull()
  })

  it('renders the Spanish About page at /es/about', async () => {
    await mountAt('/es/about')
    expect(container.textContent).toContain('Acerca de Dark Score')
    expect(document.title).toBe(i18n.getFixedT('es')('seo.about.title'))
  })

  it('switches language by navigating to the same page in the other language', async () => {
    await mountAt('/es/about')
    const enLink = container.querySelector<HTMLAnchorElement>('a[hreflang="en"]')
    expect(enLink?.getAttribute('href')).toBe('/about')
    await act(async () => {
      enLink!.click()
    })
    expect(window.location.pathname).toBe('/about')
    expect(container.textContent).toContain('About Dark Score')
    expect(document.documentElement.lang).toBe('en')
  })

  it('accepts trailing-slash URLs (how GitHub Pages serves directories)', async () => {
    await mountAt('/es/')
    expect(container.textContent).toContain('Convierte tus partituras')
    expect(document.documentElement.lang).toBe('es')
    await mountAt('/about/')
    expect(container.textContent).toContain('About Dark Score')
  })

  it('redirects unknown paths to the home page of the same language', async () => {
    await mountAt('/es/nope')
    expect(window.location.pathname).toBe('/es')
    expect(container.textContent).toContain('Convierte tus partituras')
  })
})
