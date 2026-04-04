# Dark Score

Convert your sheet music to dark mode. 100% private, 100% in your browser.

Reading sheet music on screen at night or on a dark stage with a white background is exhausting for your eyes. Dark Score intelligently inverts the colors of your PDFs and images: it removes scan noise, thickens staff lines, and applies the color scheme you prefer.

**Your files never leave your device.** All processing happens directly in your browser using Web Workers -- no uploads, no servers, no external connections.

## Who is it for?

- **Night owls** -- Practice late without eye strain. The blue light filter preset is designed for long sessions in low light.
- **Stage performers** -- A bright white screen in a dark theater distracts the audience and ruins your night vision. The dark stage preset gives you AMOLED black with high contrast notation.
- **Orchestra pit musicians** -- Read music under dim stand lights. The warm amber preset reduces glare while keeping notation readable.
- **Teachers and students** -- Convert handouts to dark mode so students can read comfortably on any device.
- **Custom needs** -- Choose your own colors, adjust contrast and brightness, and thicken thin lines from old scans.

## Privacy

Dark Score processes everything directly in your browser using Web Workers. This means:

- Your files are never uploaded to any server
- No internet connection is needed after the page loads
- No one else can see or access your scores
- The source code is open and auditable

I built it this way because I understand that sheet music can be copyrighted material, personal arrangements, or unpublished compositions. Your work deserves to stay yours.

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
