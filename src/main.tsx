import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import { initAnalytics } from './lib/analytics'
import App from './App.tsx'

initAnalytics()

// Sentry is loaded after first paint: it is a third of the initial bundle
// and only needs to be ready before the user starts interacting.
if (import.meta.env.PROD) {
  import('./lib/sentry').then((m) => m.initSentry())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js')
}
