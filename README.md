# Dark Score

Convert your sheet music to dark mode. 100% private, 100% in your browser.

Reading sheet music on screen at night or on a dark stage with a white background is exhausting for your eyes. Dark Score intelligently inverts the colors of your PDFs and images: it removes scan noise, thickens staff lines, and applies the color scheme you prefer.

**Your files never leave your device.** All processing happens directly in your browser using Web Workers -- no uploads, no servers, no external connections.

## Features

- **8 presets** tuned for different scenarios: dark stage, night study, orchestra pit, classical, jazz, pop/rock, blue light filter, and custom colors
- **Adjustable settings**: contrast, brightness, scan cleaning, line thickening
- **Batch processing**: upload multiple scores at once
- **Export**: download as PDF or PNG (ZIP for multiple pages)
- **Split view**: compare original vs. result side by side
- **Zoom**: custom zoom level, Ctrl+scroll support
- **DPI selector**: choose 200 or 300 DPI for PDF rendering
- **i18n**: English and Spanish with auto language detection
- **PWA**: installable as a standalone app
- **Settings history**: restore any previous adjustment

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Zustand (state management)
- pdf.js (PDF rendering)
- Web Workers (image processing)
- jsPDF + JSZip (export)

## Getting started

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

```bash
npm run deploy
```

## License

MIT
