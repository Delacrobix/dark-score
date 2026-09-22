import { defineConfig, devices } from '@playwright/test'

// End-to-end tests against the production build (analytics and the service
// worker only exist there), driven with the locally installed Chrome so no
// browser download is needed. Each test is named after a behavior ID from
// docs/comportamientos-esperados.md; `npm run test:e2e:coverage` cross-checks them.
const PORT = 4173

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
    headless: true,
    locale: 'en-US',
    acceptDownloads: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },

  projects: [
    // Generates the synthetic fixture files (PDF, PNG, JPG) once per run.
    { name: 'setup', testMatch: /fixtures\.setup\.ts/ },

    {
      name: 'desktop',
      dependencies: ['setup'],
      testIgnore: /responsive\.spec\.ts/,
      use: { viewport: { width: 1280, height: 800 } },
    },

    // Responsive checks. Device descriptors default to WebKit; here they run
    // on Chrome, so they emulate size, touch and user agent but not Safari.
    {
      name: 'ipad',
      dependencies: ['setup'],
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices['iPad (gen 7)'], defaultBrowserType: 'chromium', channel: 'chrome' },
    },
    {
      name: 'iphone',
      dependencies: ['setup'],
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', channel: 'chrome' },
    },
  ],
})
