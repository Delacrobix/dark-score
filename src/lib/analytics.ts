import ReactGA from 'react-ga4'

// TODO: replace with real Google Analytics Measurement ID
const GA_MEASUREMENT_ID = ''

export function initAnalytics() {
  if (!GA_MEASUREMENT_ID) return

  ReactGA.initialize(GA_MEASUREMENT_ID)
}

export function trackPageView(page: string) {
  if (!GA_MEASUREMENT_ID) return

  ReactGA.send({ hitType: 'pageview', page })
}

export function trackEvent(category: string, action: string, label?: string) {
  if (!GA_MEASUREMENT_ID) return

  ReactGA.event({ category, action, label })
}
