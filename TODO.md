# TODO

## Pending

- [ ] Create the Umami Cloud site and put its website ID in `.env` (`VITE_UMAMI_WEBSITE_ID`)
- [ ] Register darkscore.app in Google Search Console and Bing Webmaster Tools; submit `sitemap.xml`
- [ ] Reddit publication (r/piano, r/musicians, r/sheetmusic, r/classicalmusic), forScore / MuseScore forums, Show HN, Product Hunt, AlternativeTo
- [ ] Replace the illustrated sample score with a real public-domain excerpt (optional)
- [ ] Fix pre-existing lint errors in `PreviewCanvas.tsx` (react-hooks/refs) and unused vars in `imageProcessing.test.ts`
- [ ] Accent pass on the older Spanish strings in `es.json` (e.g. "musicos", "Por que")

## Completed

- [x] Replace undo/redo with settings history panel
- [x] i18n (EN/ES) with auto language detection and selector
- [x] Donate button
- [x] Sentry for error tracking
- [x] Google Analytics (placeholder) → replaced by Umami (cookieless)
- [x] Add more presets (Classical, Jazz, Pop/Rock, Blue light filter)
- [x] Zoom controls in preview (Ctrl+scroll, +/- buttons)
- [x] Export DPI selector (200 / 300 DPI)
- [x] Draggable split view for original vs. result comparison
- [x] Installable PWA (manifest + service worker)
- [x] Batch processing (upload multiple scores at once)
- [x] Add real donation link (Ko-fi)
- [x] Add real GA Measurement ID
- [x] Fix: canvas not visible on initial document load
- [x] Improve SEO (meta tags, Open Graph, structured data, darkscore.app domain)
- [x] Create og-image.png for social media previews
- [x] Add testing (unit + jsdom routing smoke tests)
- [x] Remove unused HeroUI, code-split pdf.js / jspdf / jszip / editor, defer Sentry
- [x] Real URLs per page and language (/, /about, /es, /es/about) with build-time prerender, sitemap, robots.txt, hreflang
- [x] Tool-first landing: drop zone in the hero, before/after demo, how it works, FAQ (FAQPage JSON-LD), sample score
