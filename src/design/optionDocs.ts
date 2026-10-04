import type { OptionId, VariantOf } from './options'

// Titles, rationale and variant labels for the dev panel. Imported only by
// DesignOptionsPanel, so none of this text reaches the production bundle.

export const AREAS = ['Editor', 'Global', 'Landing'] as const

type OptionDocs = {
  [K in OptionId]: {
    area: (typeof AREAS)[number]
    title: string
    why: string
    labels: Record<VariantOf<K>, string>
  }
}

export const OPTION_DOCS: OptionDocs = {
  editorLayout: {
    area: 'Editor',
    title: 'Distribución del editor',
    why: 'El visor ocupa la ventana con una barra fija (páginas, zoom, comparar). El panel hace scroll por dentro y "Descargar" queda siempre a la vista; en móvil pasa a una barra fija abajo. Antes, el botón de descarga quedaba bajo el pliegue y la navegación de páginas, debajo de una página de 3000 px.',
    labels: { actual: 'Anterior', estudio: 'Estudio' },
  },
  zoom: {
    area: 'Editor',
    title: 'Zoom inicial',
    why: 'Un PDF a 300 DPI mide ~2550 px: al 100 % solo se ve una esquina de la partitura (en móvil, casi todo negro). Ajustar muestra la página entera al abrirla; + y − siguen funcionando, y el botón "Ajustar" vuelve al encuadre.',
    labels: { actual: '100 %', ancho: 'Ajustar al ancho', pagina: 'Página completa' },
  },
  presets: {
    area: 'Editor',
    title: 'Selector de modos',
    why: 'Antes eran tarjetas de solo texto en 3 columnas que partían palabras ("Orchestr a pit"). Mostrar la paleta de cada modo deja elegir por lo que se ve, no por el nombre.',
    labels: { actual: 'Solo texto', muestras: 'Tarjetas con muestra', lista: 'Lista compacta' },
  },
  clear: {
    area: 'Editor',
    title: '"Nueva partitura" y el logo',
    why: 'Antes ambos borraban todos los documentos y ajustes al instante y sin vuelta atrás. Con las alternativas, el logo ya no borra nada (vuelves al editor y siguen ahí) y "Nueva partitura" se puede deshacer o pide confirmación.',
    labels: { actual: 'Borra al instante', deshacer: 'Con "Deshacer"', confirmar: 'Con confirmación' },
  },
  empty: {
    area: 'Editor',
    title: 'Editor vacío',
    why: 'Sin partitura, el panel mostraba todos los controles activos aunque no hacían nada. Guiado los atenúa con una indicación y ofrece la partitura de ejemplo también aquí.',
    labels: { actual: 'Anterior', guiado: 'Guiado' },
  },
  contrast: {
    area: 'Global',
    title: 'Contraste del texto secundario',
    why: 'Pistas, contadores, el aviso de privacidad o la "x" de las pestañas estaban en grises de 1.9:1 a 4.3:1 sobre el fondo; el mínimo legible (WCAG AA) es 4.5:1. Legible los sube a 5.4–6.9:1 sin cambiar la jerarquía.',
    labels: { actual: 'Anterior', legible: 'Legible (AA)' },
  },
  icons: {
    area: 'Global',
    title: 'Iconos',
    why: 'Antes se mezclaban caracteres de texto (x, ↺, ‹ ›, ▾, ←, ♪, ⇔) y emoji como iconos, cada uno con su tamaño y peso. Dibujados usa un solo juego, mismo trazo y tamaño.',
    labels: { actual: 'Caracteres y emoji', svg: 'Iconos dibujados' },
  },
  eyebrow: {
    area: 'Landing',
    title: 'Etiqueta sobre el titular',
    why: 'La línea morada en mayúsculas ("FREE · NO SIGN-UP…") competía con el titular. Los mismos datos rinden más como garantías junto al botón de subir, que es donde se toma la decisión.',
    labels: { actual: 'Sobre el titular', hechos: 'Junto a la acción' },
  },
  sample: {
    area: 'Landing',
    title: 'Probar sin archivo',
    why: 'Es la forma más rápida de ver el producto, pero era un enlace pequeño tras "No file at hand?". Como botón secundario se ve como la segunda acción que es.',
    labels: { actual: 'Enlace', boton: 'Botón secundario' },
  },
  mobileHero: {
    area: 'Landing',
    title: 'Primera pantalla en móvil',
    why: 'En el móvil el comparador antes/después (la prueba de que funciona) quedaba tras seis líneas de texto y la zona de carga, fuera de la primera pantalla. Comparador primero ordena titular → comparador → acción → explicación. Escritorio no cambia.',
    labels: { actual: 'Anterior', 'demo-primero': 'Comparador primero' },
  },
  audience: {
    area: 'Landing',
    title: '"¿Para quién es?"',
    why: 'Eran cinco tarjetas iguales con emoji, con un hueco en la segunda fila. Con su paleta enseña los colores que recibe cada perfil, así la sección también demuestra el producto. Aplica también a About.',
    labels: { actual: 'Tarjetas con emoji', paletas: 'Con su paleta' },
  },
  support: {
    area: 'Landing',
    title: 'Enlace de apoyo (Ko-fi)',
    why: 'El coral de Ko-fi era el color más llamativo de la cabecera y competía con "Open the app". Discreto: neutro con un corazón, se aviva al pasar el ratón.',
    labels: { actual: 'Coral', discreto: 'Discreto' },
  },
  headings: {
    area: 'Landing',
    title: 'Tipografía de los titulares',
    why: 'Los titulares usaban la fuente del sistema. Una serif de libro (Newsreader) enlaza con la partitura grabada del comparador y da voz propia a landing y About. El editor no cambia. Pesa 58 KB y solo se descarga en esas páginas.',
    labels: { actual: 'Sistema', grabado: 'Serif de partitura' },
  },
}
