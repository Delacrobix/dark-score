/**
 * Privacy-friendly analytics with Umami (https://umami.is): cookieless,
 * no personal data, no consent banner needed. Pageviews (including SPA
 * navigations) are tracked automatically by the script; custom events go
 * through trackEvent().
 *
 * The website ID comes from VITE_UMAMI_WEBSITE_ID (see .env). When it is
 * empty nothing is loaded, so local development sends no data.
 */

const UMAMI_WEBSITE_ID: string = import.meta.env.VITE_UMAMI_WEBSITE_ID ?? ''
const UMAMI_SCRIPT_URL = 'https://cloud.umami.is/script.js'

interface Umami {
  track: (event: string, data?: Record<string, string | number>) => void
}

declare global {
  interface Window {
    umami?: Umami
  }
}

export function initAnalytics() {
  if (!UMAMI_WEBSITE_ID || !import.meta.env.PROD) return
  if (document.querySelector(`script[src="${UMAMI_SCRIPT_URL}"]`)) return

  const script = document.createElement('script')
  script.defer = true
  script.src = UMAMI_SCRIPT_URL
  script.dataset.websiteId = UMAMI_WEBSITE_ID
  document.head.appendChild(script)
}

/**
 * Records a custom event. `action` is the event name shown in Umami;
 * `category` and `label` are attached as event data.
 */
export function trackEvent(category: string, action: string, label?: string) {
  if (!window.umami) return
  const data: Record<string, string> = { category }
  if (label) data.label = label
  window.umami.track(action, data)
}
