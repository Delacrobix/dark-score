import { test, expect } from '@playwright/test'
import {
  FIXTURES,
  HAS_UMAMI_ID,
  exportAndDownload,
  mockUmami,
  openEditorWith,
  pickFiles,
  presetButton,
  uploadPrompt,
  waitForResult,
} from './helpers'

test.describe('Analytics', () => {
  test.skip(!HAS_UMAMI_ID, 'VITE_UMAMI_WEBSITE_ID is empty in .env, analytics is not built in')
  // The service worker proxies every fetch, including Umami's, and requests
  // made by a service worker are invisible to page.route(). Blocking it here
  // lets the mock see exactly what the page sends.
  test.use({ serviceWorkers: 'block' })

  test('ANA-01 the Umami script is loaded with the website ID and exposes window.umami', async ({ page }) => {
    await mockUmami(page)
    await page.goto('/')
    const script = page.locator('script[src="https://cloud.umami.is/script.js"]')
    await expect(script).toHaveCount(1)
    await expect(script).toHaveAttribute('data-website-id', /^[0-9a-f-]{36}$/)
    await page.waitForFunction(() => typeof (window as unknown as { umami?: unknown }).umami === 'object')
  })

  test('ANA-02 a pageview is sent on load and on in-app navigation', async ({ page }) => {
    const sent = await mockUmami(page)
    const pageviews = () => sent.filter((s) => !s.name).map((s) => new URL(s.url!).pathname)
    await page.goto('/')
    await expect.poll(pageviews).toEqual(['/'])
    await page.getByRole('button', { name: 'Try with a sample score' }).click()
    await expect(page).toHaveURL(/\/app$/)
    await expect.poll(pageviews).toEqual(['/', '/app'])
  })

  test('ANA-03 custom events carry their name, category and label', async ({ page }) => {
    const sent = await mockUmami(page)
    const events = () => sent.filter((s) => s.name).map((s) => [s.name, s.data?.category, s.data?.label ?? null])

    await page.goto('/')
    await page.getByRole('button', { name: 'Try with a sample score' }).click()
    await waitForResult(page)
    await expect.poll(events).toContainEqual(['sample_score', 'upload', null])

    await pickFiles(page, [FIXTURES.pdf1, FIXTURES.png]) // "+ Add files" in the tabs
    await waitForResult(page)
    await expect.poll(events).toContainEqual(['upload_files', 'upload', 'pdf:1,image:1'])

    await presetButton(page, 'Jazz').click()
    await expect.poll(events).toContainEqual(['apply_preset', 'preset', 'jazz'])

    await page.getByRole('button', { name: 'Sharp' }).click()
    await expect.poll(events).toContainEqual(['threshold_mode', 'settings', 'hard'])

    await waitForResult(page)
    await exportAndDownload(page)
    await expect.poll(events).toContainEqual(['export_file', 'export', 'format:pdf,mode:separate,docs:3'])

    // the drop zone path also reports uploads
    await page.goto('/app')
    await pickFiles(page, FIXTURES.jpg)
    await expect.poll(events).toContainEqual(['upload_files', 'upload', 'pdf:0,image:1'])

    for (const s of sent) expect(s.website).toMatch(/^[0-9a-f-]{36}$/)
  })

  test('ANA-04 no cookies are set', async ({ page, context }) => {
    await mockUmami(page)
    await openEditorWith(page, FIXTURES.png)
    await exportAndDownload(page)
    expect(await context.cookies()).toEqual([])
    expect(await page.evaluate(() => document.cookie)).toBe('')
  })

  test('ANA-05 files never leave the browser: no request bodies except analytics, no other hosts', async ({ page }) => {
    await mockUmami(page)
    const requests: { url: string; method: string; hasBody: boolean }[] = []
    page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), hasBody: (r.postData() ?? '').length > 0 }))

    await openEditorWith(page, [FIXTURES.pdf2, FIXTURES.scan])
    await presetButton(page, 'Night study').click()
    await waitForResult(page)
    await exportAndDownload(page)

    const external = requests.filter((r) => !r.url.startsWith('http://localhost'))
    const hosts = new Set(external.map((r) => new URL(r.url).hostname))
    for (const host of hosts) expect(host, `unexpected host ${host}`).toMatch(/(^|\.)(umami\.is|sentry\.io|ingest\.sentry\.io)$/)

    const uploads = requests.filter((r) => r.hasBody && !/umami\.is/.test(r.url))
    expect(uploads, 'requests carrying a body').toEqual([])
    expect(requests.filter((r) => r.method !== 'GET' && !/umami\.is/.test(r.url))).toEqual([])
  })
})

test.describe('PWA', () => {
  test('PWA-01 the manifest is linked and complete', async ({ page, request }) => {
    await page.goto('/')
    const href = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(href).toBe('/manifest.json')
    const manifest = await (await request.get(href!)).json()
    expect(manifest.name).toBe('Dark Score')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.some((i: { sizes: string; purpose?: string }) => i.sizes === '512x512' && /maskable/.test(i.purpose ?? ''))).toBe(true)
  })

  test('PWA-02 a service worker is registered and controls the page after reload', async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true), null, { timeout: 15_000 })
    await page.reload()
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15_000 })
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)
    expect(scope).toMatch(/localhost:\d+\/$/)
  })

  test('PWA-03 once visited, the landing and the editor load offline', async ({ page, context }) => {
    await page.goto('/')
    await page.evaluate(() => navigator.serviceWorker.ready)
    // Assets are cached as they are used: warm up the editor, pdf.js and the worker
    await openEditorWith(page, [FIXTURES.pdf1, FIXTURES.png])
    await page.waitForTimeout(500) // let the service worker finish caching the last responses

    await context.setOffline(true)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Convert your sheet music to dark mode')
    await page.goto('/app')
    await expect(page.getByRole('button', { name: uploadPrompt() })).toBeVisible()
    await pickFiles(page, [FIXTURES.pdf1, FIXTURES.png])
    await waitForResult(page)
    await page.getByRole('tab').nth(1).click()
    await waitForResult(page)
    await context.setOffline(false)
  })
})
