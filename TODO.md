# TODO

## Estado (2026-09-16)

- Rama de trabajo: `growth/seo-perf` (4 commits sobre `main`, sin mergear ni desplegar).
- Carpeta de trabajo: esta (`~/software/personal-projects/2026-03-31_dark-score`). **No trabajar desde el NAS** (`/Volumes/software/...`): `npm install` no termina por SMB y una caída del mount ya perdió ediciones sin commit.
- Plan y auditoría original: `~/.claude/plans/tengo-deseos-de-mejorar-silly-owl.md`.

## Pendientes

### Antes de desplegar
- [ ] Probar la app en un navegador real (`npm run dev`): soltar un PDF desde la landing → editor, botón "Try with a sample score", exportar PDF/PNG, cambio de idioma EN/ES, `/about` y `/es/about`. Los tests jsdom cubren rutas y títulos, pero el editor no se ha probado end-to-end tras el code-splitting.
- [ ] Probar en tablet/móvil (layout responsive de la landing y del editor).
- [ ] Crear el sitio en https://cloud.umami.is y poner el website ID en `.env` (`VITE_UMAMI_WEBSITE_ID=...`). Sin él no se carga analytics.
- [ ] Mergear `growth/seo-perf` en `main` y desplegar: `npm run deploy` (build + prerender + gh-pages).
- [ ] Tras desplegar, comprobar: `curl -s https://darkscore.app | grep -c "sheet music"` > 0; `/es`, `/about`, `/es/about` responden 200 con su título; `/robots.txt` y `/sitemap.xml` responden 200.

### Después de desplegar
- [ ] Registrar darkscore.app en Google Search Console y Bing Webmaster Tools; enviar `sitemap.xml`.
- [ ] Comprobar en Umami que llegan pageviews y los eventos `upload_files`, `export_file`, `apply_preset`, `threshold_mode`, `sample_score`.
- [ ] Lighthouse en móvil (objetivo: Performance y SEO > 90).
- [ ] Distribución: Reddit (r/piano, r/musicians, r/sheetmusic, r/classicalmusic), foros de forScore / MuseScore, Show HN, Product Hunt, AlternativeTo.

### Mejoras menores
- [ ] Tildes en las traducciones antiguas de `es.json` ("musicos", "Por que", "codigo"): se ven en la página About.
- [ ] Sustituir la partitura de ejemplo ilustrada (`src/lib/scoreSvg.ts`) por un fragmento real de dominio público (opcional).
- [ ] Errores de lint preexistentes: `PreviewCanvas.tsx` (react-hooks/refs, acceso a ref en render) y variables sin usar en `imageProcessing.test.ts`; directiva eslint-disable sobrante en `useProcessor.ts`.
- [ ] El `ResizablePanel` del editor solo funciona con ratón (sin touch); el requisito principal es iPad.
- [ ] Artículo largo tipo "how to read sheet music at night without eye strain" (blog o sección) para long-tail.

## Hecho

### Auditoría de crecimiento (2026-09-15/16, rama `growth/seo-perf`)
- [x] `2c69910` Rendimiento: quitar HeroUI (407 KB CSS sin uso), code-splitting de editor / pdf.js / jspdf / jszip, Sentry sin tracing y diferido, icono Ko-fi inline, `robots.txt`, `sitemap.xml`. JS inicial 394 KB → 92 KB gzip.
- [x] `ccbbab3` Rutas reales por página e idioma (`/`, `/about`, `/app`, `/es`, `/es/about`, `/es/app`) con wouter; prerender a HTML estático en el build (`scripts/prerender.mjs`) con title, description, canonical, hreflang; tests de rutas (unit + jsdom).
- [x] `8c123eb` Landing tool-first: drop zone en el hero, comparador antes/después, "cómo funciona", casos de uso, privacidad, FAQ con JSON-LD, partitura de ejemplo, header/footer compartidos con About.
- [x] `6489ce3` Google Analytics → Umami (sin cookies) manteniendo `trackEvent()`; copy de privacidad exacto; docs actualizadas.

### Anteriores
- [x] Replace undo/redo with settings history panel
- [x] i18n (EN/ES) with auto language detection and selector
- [x] Donate button
- [x] Sentry for error tracking
- [x] Add more presets (Classical, Jazz, Pop/Rock, Blue light filter)
- [x] Zoom controls in preview (Ctrl+scroll, +/- buttons)
- [x] Export DPI selector (200 / 300 DPI)
- [x] Draggable split view for original vs. result comparison
- [x] Installable PWA (manifest + service worker)
- [x] Batch processing (upload multiple scores at once)
- [x] Add real donation link (Ko-fi)
- [x] Fix: canvas not visible on initial document load
- [x] Improve SEO (meta tags, Open Graph, structured data, darkscore.app domain)
- [x] Create og-image.png for social media previews
- [x] Add testing (unit + jsdom routing smoke tests)
