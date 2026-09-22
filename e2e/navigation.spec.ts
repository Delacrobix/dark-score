import { test, expect } from '@playwright/test'
import { FIXTURES, openEditorWith, previewCanvas, uploadPrompt, waitForResult } from './helpers'

const TITLES = {
  en: {
    home: 'Dark Score | Convert Sheet Music to Dark Mode - Free Online Tool',
    about: 'About Dark Score | Dark Mode Sheet Music for Musicians',
    app: 'Dark Score | Editor',
  },
  es: {
    home: 'Dark Score | Convierte partituras a modo oscuro - Gratis y online',
    about: 'Acerca de Dark Score | Partituras en modo oscuro para músicos',
    app: 'Dark Score | Editor',
  },
}

test.describe('Routes and language', () => {
  test('NAV-01 every page exists in English and Spanish with matching <html lang>', async ({ page }) => {
    const cases = [
      ['/', 'en', 'Convert your sheet music to dark mode'],
      ['/about', 'en', 'About Dark Score'],
      ['/app', 'en', uploadPrompt('en')],
      ['/es', 'es', 'Convierte tus partituras a modo oscuro'],
      ['/es/about', 'es', 'Acerca de Dark Score'],
      ['/es/app', 'es', uploadPrompt('es')],
    ] as const
    for (const [path, lang, text] of cases) {
      await page.goto(path)
      await expect(page.getByText(text).first()).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
    }
  })

  test('NAV-02 each route has its own title and description per language', async ({ page }) => {
    for (const [path, lang, key] of [
      ['/', 'en', 'home'],
      ['/about', 'en', 'about'],
      ['/app', 'en', 'app'],
      ['/es', 'es', 'home'],
      ['/es/about', 'es', 'about'],
      ['/es/app', 'es', 'app'],
    ] as const) {
      await page.goto(path)
      await expect(page).toHaveTitle(TITLES[lang][key])
      const description = await page.locator('meta[name="description"]').getAttribute('content')
      expect(description, path).toBeTruthy()
    }
    // descriptions differ per language
    await page.goto('/es')
    const es = await page.locator('meta[name="description"]').getAttribute('content')
    await page.goto('/')
    const en = await page.locator('meta[name="description"]').getAttribute('content')
    expect(en).not.toBe(es)
  })

  test('NAV-03 trailing slashes are accepted', async ({ page }) => {
    await page.goto('/es/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Convierte tus partituras a modo oscuro')
    await page.goto('/about/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Dark Score')
  })

  test('NAV-04 unknown paths go to the home of the same language', async ({ page }) => {
    await page.goto('/es/nope')
    await expect(page).toHaveURL(/\/es$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Convierte tus partituras a modo oscuro')
    await page.goto('/nothing/here')
    await expect(page).toHaveURL(/\/$/)
  })

  test.describe('Spanish browser', () => {
    test.use({ locale: 'es-CO' })

    test('NAV-05 an unprefixed URL is redirected to its Spanish version', async ({ page }) => {
      await page.goto('/about')
      await expect(page).toHaveURL(/\/es\/about$/)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Acerca de Dark Score')
    })
  })

  // Regression: a regional English that is not literally in supportedLngs used
  // to be dropped, and an English browser that also lists Spanish got Spanish.
  for (const languages of [
    ['en-CO', 'es', 'en'],
    ['en-US', 'es', 'en'],
    ['en-GB', 'es-419', 'es'],
    ['en-CO'],
  ]) {
    test(`NAV-05 an English browser listing ${JSON.stringify(languages)} stays in English`, async ({ page }) => {
      await page.addInitScript((l) => {
        Object.defineProperty(navigator, 'languages', { get: () => l })
      }, languages)
      await page.goto('/about')
      await expect(page).toHaveURL(/\/about$/)
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Dark Score')
    })
  }

  test('NAV-05 a Spanish browser listing regional variants gets Spanish', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'languages', { get: () => ['es-CO', 'es', 'en'] })
    })
    await page.goto('/about')
    await expect(page).toHaveURL(/\/es\/about$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  })

  test('NAV-06 the language switch keeps the page and nothing is remembered', async ({ page }) => {
    await page.goto('/es/about')
    await page.locator('header').getByRole('link', { name: 'EN' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Dark Score')

    await page.locator('header').getByRole('link', { name: 'ES' }).click()
    await expect(page).toHaveURL(/\/es\/about$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')

    // Visiting a Spanish link does not pin Spanish: this browser is English,
    // so unprefixed URLs keep opening in English.
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await page.goto('/about')
    await expect(page).toHaveURL(/\/about$/)

    // and no language is stored anywhere
    expect(await page.evaluate(() => Object.keys(localStorage))).not.toContain('dark-score-lang')
  })

  test('NAV-07 switching language inside the editor keeps the loaded documents', async ({ page }) => {
    await openEditorWith(page, FIXTURES.pdf2)
    await page.locator('header').getByRole('link', { name: 'ES' }).click()
    await expect(page).toHaveURL(/\/es\/app$/)
    await waitForResult(page)
    await expect(page.getByRole('tab', { name: /two-pages/ })).toBeVisible()
    await expect(page.getByText('Escenario oscuro')).toBeVisible()
    await expect(previewCanvas(page)).toBeVisible()
  })

  test('NAV-08 logo goes home and clears; "New score" clears and shows the drop zone', async ({ page }) => {
    await openEditorWith(page, FIXTURES.png)
    await page.getByRole('button', { name: '← New score' }).click()
    await expect(page.getByRole('button', { name: uploadPrompt() })).toBeVisible()
    await expect(page.getByRole('tab')).toHaveCount(0)

    await openEditorWith(page, FIXTURES.png)
    await page.getByRole('button', { name: 'Go to home' }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/app')
    await expect(page.getByRole('tab')).toHaveCount(0)
  })

  test('NAV-09 the About page has its sections and links', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Dark Score')
    await expect(page.getByRole('heading', { name: 'Who is it for?' })).toBeVisible()
    await expect(page.getByText('Your files are never uploaded to any server')).toBeVisible()
    await expect(page.getByRole('link', { name: 'View source code on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/Delacrobix/dark-score'
    )
    await page.getByRole('link', { name: /Back to home/ }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('SEO', () => {
  test('SEO-01 pages are served with their content already in the HTML', async ({ request }) => {
    const home = await (await request.get('/')).text()
    expect(home).toContain('Convert your sheet music to dark mode')
    expect(home).toContain('Frequently asked questions')
    const about = await (await request.get('/es/about')).text()
    expect(about).toContain('Acerca de Dark Score')
  })

  test('SEO-02 canonical and hreflang links on every page; the editor is noindex', async ({ request }) => {
    for (const [path, canonical, en, es] of [
      ['/', 'https://darkscore.app/', 'https://darkscore.app/', 'https://darkscore.app/es'],
      ['/es', 'https://darkscore.app/es', 'https://darkscore.app/', 'https://darkscore.app/es'],
      ['/about', 'https://darkscore.app/about', 'https://darkscore.app/about', 'https://darkscore.app/es/about'],
      ['/es/about', 'https://darkscore.app/es/about', 'https://darkscore.app/about', 'https://darkscore.app/es/about'],
    ]) {
      const html = await (await request.get(path)).text()
      expect(html, path).toContain(`<link rel="canonical" href="${canonical}" />`)
      expect(html, path).toContain(`<link rel="alternate" hreflang="en" href="${en}" />`)
      expect(html, path).toContain(`<link rel="alternate" hreflang="es" href="${es}" />`)
      expect(html, path).toContain(`<link rel="alternate" hreflang="x-default" href="${en}" />`)
      expect(html, path).not.toMatch(/name="robots" content="noindex/)
    }
    const app = await (await request.get('/app')).text()
    expect(app).toMatch(/name="robots" content="noindex/)
  })

  test('SEO-03 robots.txt and sitemap.xml', async ({ request }) => {
    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    expect(await robots.text()).toContain('Sitemap: https://darkscore.app/sitemap.xml')

    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)
    const xml = await sitemap.text()
    for (const loc of ['https://darkscore.app/', 'https://darkscore.app/es', 'https://darkscore.app/about', 'https://darkscore.app/es/about']) {
      expect(xml).toContain(`<loc>${loc}</loc>`)
    }
    expect(xml).not.toContain('/app</loc>')
  })

  test('SEO-04 the FAQ is exposed as FAQPage JSON-LD', async ({ page }) => {
    await page.goto('/')
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const faq = scripts.map((s) => JSON.parse(s)).find((j) => j['@type'] === 'FAQPage')
    expect(faq).toBeTruthy()
    expect(faq.mainEntity).toHaveLength(6)
    expect(faq.mainEntity[0]['@type']).toBe('Question')
  })

  test('SEO-05 404.html redirects to the home and is noindex', async ({ request }) => {
    const html = await (await request.get('/404.html')).text()
    expect(html).toContain("window.location.replace('/')")
    expect(html).toContain('name="robots" content="noindex"')
  })
})
