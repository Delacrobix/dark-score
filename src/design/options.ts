/**
 * Switchable design variants.
 *
 * Each option keeps the previous design ('actual') next to the ones proposed
 * on 2026-10-03. Production renders `chosen`, the owner's pick of
 * 2026-10-04; in development a floating panel (DesignOptionsPanel) switches
 * them live, to compare or to try a different choice. Components read the
 * active variant with useDesignOption(id).
 *
 * Only ids live here, so the production bundle stays small; the panel's
 * titles and rationale are in optionDocs.ts, which only the panel imports.
 */
export const DESIGN_OPTIONS = {
  // Editor
  editorLayout: { variants: ['actual', 'estudio'], chosen: 'estudio' },
  zoom: { variants: ['actual', 'ancho', 'pagina'], chosen: 'ancho' },
  presets: { variants: ['actual', 'muestras', 'lista'], chosen: 'muestras' },
  clear: { variants: ['actual', 'deshacer', 'confirmar'], chosen: 'deshacer' },
  empty: { variants: ['actual', 'guiado'], chosen: 'guiado' },
  // Global
  contrast: { variants: ['actual', 'legible'], chosen: 'legible' },
  icons: { variants: ['actual', 'svg'], chosen: 'svg' },
  // Landing
  eyebrow: { variants: ['actual', 'hechos'], chosen: 'hechos' },
  sample: { variants: ['actual', 'boton'], chosen: 'boton' },
  mobileHero: { variants: ['actual', 'demo-primero'], chosen: 'demo-primero' },
  audience: { variants: ['actual', 'paletas'], chosen: 'paletas' },
  support: { variants: ['actual', 'discreto'], chosen: 'discreto' },
  headings: { variants: ['actual', 'grabado'], chosen: 'grabado' },
} as const satisfies Record<string, { variants: readonly string[]; chosen: string }>

export type OptionId = keyof typeof DESIGN_OPTIONS

export type VariantOf<K extends OptionId> = (typeof DESIGN_OPTIONS)[K]['variants'][number]

export type DesignValues = { [K in OptionId]: VariantOf<K> }

export const OPTION_IDS = Object.keys(DESIGN_OPTIONS) as OptionId[]
