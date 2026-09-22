# TODO

## Estado (2026-09-21)

- Rama de trabajo: `growth/seo-perf` (5 commits sobre `main`, **sin subir a origin**, sin mergear ni desplegar). Hay cambios sin commitear: fix del processor + su test, evento `upload_files` desde las pestañas, `.env` con el ID de Umami, y la suite E2E completa (`e2e/`, `docs/`, `playwright.config.ts`).
- Comportamientos esperados y su verificación: `docs/comportamientos-esperados.md` (82 filas con ID). Tests E2E: `npm run test:e2e` (Playwright sobre el build de producción con el Chrome instalado; 92 pasan, 2 fallos conocidos marcados con `test.fail`). `npm run test:e2e:coverage` cruza documento y tests. Capturas para revisión visual en `e2e/.review/`.
- Carpeta de trabajo: esta (`~/software/personal-projects/2026-03-31_dark-score`). **No trabajar desde el NAS** (`/Volumes/software/...`): `npm install` no termina por SMB y una caída del mount ya perdió ediciones sin commit.
- Plan y auditoría original: `~/.claude/plans/tengo-deseos-de-mejorar-silly-owl.md`.

## Pendientes

### Antes de desplegar
- [ ] Commitear lo pendiente y `git push -u origin growth/seo-perf`.
- [ ] Revisar a ojo las capturas de `e2e/.review/` (partituras reales antes/después): ¿la limpieza se ve bien? Ojo: el resaltador amarillo y las anotaciones a lápiz claras desaparecen con limpieza 140 (`Brisas del Pamplonita`).
- [ ] Probar en un iPad real con Safari (RESP-07): el layout y el touch están cubiertos solo con emulación en Chrome.
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
- [ ] Errores de lint preexistentes: `PreviewCanvas.tsx` (react-hooks/refs, acceso a ref en render) y variables sin usar en `imageProcessing.test.ts`.
- [ ] Artículo largo tipo "how to read sheet music at night without eye strain" (blog o sección) para long-tail.

## Hecho

### Calidad (2026-09-16/22)
- [x] Fix: un navegador en inglés regional con español en la lista (`en-CO, es, en`, la configuración de macOS por defecto aquí) abría la app en español. `supportedLngs` no incluía `en-CO`, i18next lo descartaba y caía en `es`. Añadido `load: 'languageOnly'`.
- [x] Fix: visitar cualquier URL `/es/...` fijaba el español en `localStorage` para siempre. El idioma ya no se guarda: lo lleva el prefijo de la URL y las URLs sin prefijo siguen siempre al navegador.
- [x] RESP-05: el panel de ajustes se redimensiona con el dedo (Pointer Events + `touch-action: none`).
- [x] ERR-01: un archivo ilegible (PDF dañado o protegido con contraseña) muestra un mensaje en el preview y una marca en su pestaña, en vez de un preview vacío. El error es por documento y ya no sube a Sentry como excepción no capturada.
- [x] UP-06: un lote con archivos inválidos carga los válidos y lista los rechazados con su motivo, en vez de rechazar el lote entero. Reglas unificadas en `src/lib/fileIntake.ts` (antes "+ Agregar archivos" los descartaba en silencio).
- [x] Fix: cargar desde la landing dejaba el editor en "Procesando… 0%" (StrictMode + cancelación global en `useProcessor`); también afectaba a añadir/quitar documentos mientras otro cargaba. Test unitario en `useProcessor.test.tsx`.
- [x] Evento `upload_files` también desde "+ Agregar archivos" en las pestañas.
- [x] Analytics verificado de punta a punta contra Umami (pageviews SPA y los 5 eventos).
- [x] Documento de comportamientos esperados + suite E2E Playwright (landing, rutas, SEO, carga, procesado con comprobación de píxeles, páginas, zoom, historial, exportación con verificación de los archivos, persistencia, analytics, privacidad, PWA/offline, responsive iPad/iPhone, errores) y script de cobertura documento↔tests.

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
