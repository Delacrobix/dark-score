import * as Sentry from '@sentry/react'

const SENTRY_DSN = 'https://0c93fff500c5afcea3c016b33c9a846a@o4511146528735232.ingest.us.sentry.io/4511146530373632'

export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.2,
    environment: import.meta.env.MODE,
  })
}
