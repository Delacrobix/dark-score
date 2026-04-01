# Dark Score — CLAUDE.md

## Stack

- **React 19 + TypeScript + Vite** — framework y build tool
- **Tailwind CSS v4** — estilos (con plugin `@tailwindcss/vite`, sin `tailwind.config.js`)
- **HeroUI v3** (`@heroui/react` + `@heroui/styles`) — librería de componentes UI
- **Zustand** — estado global (presets, ajustes de imagen, página actual, modo)
- **pdf.js** (`pdfjs-dist`) — renderizado de PDFs a Canvas
- **jspdf** — generación de PDFs de salida
- **jszip** — empaquetado de PNGs en ZIP

## Arquitectura

- Todo el procesamiento ocurre **en el navegador** (client-side). Sin backend, sin APIs externas.
- El pipeline de procesamiento de imagen corre en un **Web Worker** (`src/workers/imageProcessor.worker.ts`) para no bloquear la UI.
- El store de Zustand vive en `src/store/useAppStore.ts`.
- Las librerías de PDF/export están en `src/lib/`.

## Estructura de carpetas

```
src/
├── components/   # Componentes React
├── workers/      # Web Workers (imageProcessor.worker.ts)
├── store/        # Zustand store
├── lib/          # pdfRenderer.ts, exporter.ts
└── types/        # TypeScript types compartidos
```

## Configuración CSS

El orden de imports en `index.css` importa:
```css
@import "tailwindcss";
@import "@heroui/styles";
```

## Licencia

MIT — proyecto open source.
