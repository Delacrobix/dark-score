// Build-time prerender: writes static HTML for every public route so crawlers
// (and users on slow networks) get real content instead of an empty <div id="root">.
// Runs after `vite build` and `vite build --ssr`; see package.json "build".
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const serverDir = join(dist, 'server')

const { render, getMeta } = await import(join(serverDir, 'entry-server.js'))

// Public pages get full SSR markup. The editor (/app) only needs the shell:
// it is a client-only tool and is marked noindex.
const ROUTES = [
  { path: '/', ssr: true },
  { path: '/about', ssr: true },
  { path: '/app', ssr: false },
  { path: '/es', ssr: true },
  { path: '/es/about', ssr: true },
  { path: '/es/app', ssr: false },
]

const template = readFileSync(join(dist, 'index.html'), 'utf8')

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function setMetaContent(html, attr, value) {
  const re = new RegExp(`(<meta\\s+${attr}\\s+content=")[^"]*(")`)
  if (!re.test(html)) throw new Error(`prerender: tag <meta ${attr}> not found in index.html`)
  return html.replace(re, `$1${escapeHtml(value)}$2`)
}

function buildPage(meta, bodyHtml) {
  let html = template
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${meta.lang}"`)
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
  html = setMetaContent(html, 'name="description"', meta.description)
  html = setMetaContent(html, 'property="og:title"', meta.title)
  html = setMetaContent(html, 'property="og:description"', meta.description)
  html = setMetaContent(html, 'property="og:url"', meta.canonical)
  html = setMetaContent(html, 'property="og:locale"', meta.lang === 'es' ? 'es_ES' : 'en_US')
  html = setMetaContent(html, 'property="og:locale:alternate"', meta.lang === 'es' ? 'en_US' : 'es_ES')
  html = setMetaContent(html, 'name="twitter:title"', meta.title)
  html = setMetaContent(html, 'name="twitter:description"', meta.description)

  const links = [
    `<link rel="canonical" href="${meta.canonical}" />`,
    ...meta.alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${a.href}" />`),
    `<link rel="alternate" hreflang="x-default" href="${meta.alternates.find((a) => a.lang === 'en').href}" />`,
  ]
  if (meta.noindex) links.push(`<meta name="robots" content="noindex" />`)
  if (!/<link rel="canonical"[^>]*>/.test(html)) throw new Error('prerender: canonical link not found')
  html = html.replace(/<link rel="canonical"[^>]*>/, links.join('\n    '))

  if (!html.includes('<div id="root"></div>')) throw new Error('prerender: <div id="root"></div> not found')
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
  return html
}

// GitHub Pages serves `/about` from `about.html` (clean URL, no redirect) and
// `/about/` from `about/index.html`. Both are written so either form works;
// the canonical tag always points at the clean URL.
function outputFiles(path) {
  if (path === '/') return [join(dist, 'index.html')]
  return [join(dist, `${path}.html`), join(dist, path, 'index.html')]
}

for (const route of ROUTES) {
  const { html: body, meta } = route.ssr ? await render(route.path) : { html: '', meta: await getMeta(route.path) }
  const page = buildPage(meta, body)
  for (const file of outputFiles(route.path)) {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, page)
  }
  console.log(`prerendered ${route.path.padEnd(10)} ${route.ssr ? `${(body.length / 1024).toFixed(1)} KB body` : 'shell only'}`)
}

rmSync(serverDir, { recursive: true, force: true })
