import { renderToString } from 'react-dom/server'
import { Router } from 'wouter'
import i18n from './i18n'
import App from './App'
import { getRouteMeta, type RouteMeta } from './lib/seo'
import { langFromPath } from './lib/routes'

/** SEO metadata for a route in its language. Used by scripts/prerender.mjs at build time. */
export async function getMeta(absPath: string): Promise<RouteMeta> {
  await i18n.changeLanguage(langFromPath(absPath))
  return getRouteMeta(absPath, (key) => i18n.t(key))
}

/** Server-side render of one route. Used by scripts/prerender.mjs at build time. */
export async function render(absPath: string): Promise<{ html: string; meta: RouteMeta }> {
  const meta = await getMeta(absPath)
  const html = renderToString(
    <Router ssrPath={absPath}>
      <App />
    </Router>
  )
  return { html, meta }
}
