import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import i18n from './i18n'
import { initAnalytics } from './lib/analytics'
import { langFromPath, localizePath, DEFAULT_LANG, type Lang } from './lib/routes'
import App from './App.tsx'

initAnalytics()

// First visit on an unprefixed (English) URL by a Spanish-speaking browser:
// send them to the Spanish version of the same page before rendering.
const path = window.location.pathname
const detected = (i18n.resolvedLanguage?.slice(0, 2) ?? DEFAULT_LANG) as Lang
if (langFromPath(path) === DEFAULT_LANG && detected !== DEFAULT_LANG) {
  window.history.replaceState(null, '', localizePath(path, detected) + window.location.search + window.location.hash)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Sentry is loaded after first paint: it is a third of the initial bundle
// and only needs to be ready before the user starts interacting.
if (import.meta.env.PROD) {
  import('./lib/sentry').then((m) => m.initSentry())
}

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js')
}
