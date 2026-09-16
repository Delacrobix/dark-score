# Dark Score — CLAUDE.md

## Stack

- **React 19 + TypeScript + Vite** — framework y build tool
- **Tailwind CSS v4** — estilos (con plugin `@tailwindcss/vite`, sin `tailwind.config.js`). Sin librería de componentes: todo es Tailwind + HTML.
- **Zustand** — estado global (presets, ajustes de imagen, página actual, modo)
- **pdf.js** (`pdfjs-dist`) — renderizado de PDFs a Canvas
- **jspdf** — generación de PDFs de salida
- **jszip** — empaquetado de PNGs en ZIP
- **wouter** — router (2 KB). Rutas: `/`, `/app`, `/about` y sus gemelas en español bajo `/es`. Helpers en `src/lib/routes.ts`.
- **Umami** — analytics sin cookies. `src/lib/analytics.ts` expone `trackEvent(category, action, label?)`; el website ID va en `.env` (`VITE_UMAMI_WEBSITE_ID`).
- **Sentry** — solo captura de errores (sin tracing), cargado tras el primer paint.

## Arquitectura

- Todo el procesamiento ocurre **en el navegador** (client-side). Sin backend, sin APIs externas.
- **SEO / prerender**: `npm run build` hace `vite build`, luego `vite build --ssr src/entry-server.tsx` y `scripts/prerender.mjs`, que escribe HTML estático por ruta e idioma (`about.html` + `about/index.html`, etc.) con title/description/canonical/hreflang. Landing y About deben poder renderizarse con `renderToString` (nada de `window` en render, nada de `React.lazy` en su árbol). El idioma sale del prefijo de la URL (`src/components/RouteEffects.tsx`).
- El texto SEO por ruta vive en `seo.*` de `src/i18n/locales/*.json`.
- El pipeline de procesamiento de imagen corre en un **Web Worker** (`src/workers/imageProcessor.worker.ts`) para no bloquear la UI.
- El store de Zustand vive en `src/store/useAppStore.ts`.
- Las librerías de PDF/export están en `src/lib/`.

## Estructura de carpetas

```
src/
├── components/   # Componentes React
├── workers/      # Web Workers (imageProcessor.worker.ts)
├── store/        # Zustand store
├── lib/          # pdfRenderer.ts, exporter.ts, routes.ts, seo.ts, scoreSvg.ts (partitura de ejemplo)
├── entry-server.tsx  # entrada SSR para el prerender
└── types/        # TypeScript types compartidos
scripts/prerender.mjs # genera el HTML estático tras el build
```

## Rendimiento

- `AppShell` y `AboutPage` se cargan con `React.lazy`; `pdfjs-dist`, `jspdf` y `jszip` se importan dinámicamente solo cuando se usan. No añadir imports estáticos de estas librerías fuera de `src/lib/`.

## Licencia

MIT — proyecto open source.
