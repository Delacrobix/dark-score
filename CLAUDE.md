# Dark Score — CLAUDE.md

## Stack

- **React 19 + TypeScript + Vite** — framework y build tool
- **Tailwind CSS v4** — estilos (con plugin `@tailwindcss/vite`, sin `tailwind.config.js`). Sin librería de componentes: todo es Tailwind + HTML.
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

## Rendimiento

- `AppShell` y `AboutPage` se cargan con `React.lazy`; `pdfjs-dist`, `jspdf` y `jszip` se importan dinámicamente solo cuando se usan. No añadir imports estáticos de estas librerías fuera de `src/lib/`.

## Licencia

MIT — proyecto open source.
