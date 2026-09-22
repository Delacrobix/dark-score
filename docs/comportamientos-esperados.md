# Comportamientos esperados

Lo que Dark Score debe hacer, visto desde el usuario. Cada fila tiene un ID estable; los tests E2E de `e2e/` llevan ese ID en su título y `npm run test:e2e:coverage` lista los que no tienen test.

- **Verificación**: `auto` = test E2E en Playwright (`npm run test:e2e`), `unit` = vitest, `visual` = revisión humana de las capturas en `e2e/.review/`, `manual` = a mano en dispositivo real.
- **Estado**: ✅ se cumple · ❌ no se cumple (el test lo documenta con `test.fail()`) · ⚠️ decisión pendiente de confirmar · — sin verificar.

Los tests corren contra el build de producción (`vite preview`) en el Chrome instalado. Las partituras reales de `test_scores/` no van en git; los tests que las usan se saltan si la carpeta no existe.

## Landing (LAND)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| LAND-01 | `/` muestra el titular "Convert your sheet music to dark mode", la zona para soltar archivos y el enlace "Try with a sample score". | auto | ✅ |
| LAND-02 | Elegir o soltar un archivo válido en la landing abre el editor (`/app`) con ese archivo ya cargado y procesado. | auto | ✅ |
| LAND-03 | "Try with a sample score" abre el editor con la partitura de ejemplo procesada, sin pedir archivo. | auto | ✅ |
| LAND-04 | El comparador antes/después del hero muestra "Original" y "Dark stage" y su divisor se puede arrastrar. | auto | ✅ |
| LAND-05 | La landing tiene las secciones "How it works" (3 pasos), "Who is it for?", privacidad, FAQ (6 preguntas) y un CTA final "Get started" que lleva a `/app`. | auto | ✅ |
| LAND-06 | Header: "About" → `/about`, "Open the app" → `/app`, selector EN · ES. | auto | ✅ |
| LAND-07 | Un archivo con formato no soportado en la landing muestra "`nombre`: unsupported format. Use PDF, PNG or JPG." y no abre el editor. | auto | ✅ |

## Rutas e idioma (NAV)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| NAV-01 | `/`, `/about`, `/app` se muestran en inglés y `/es`, `/es/about`, `/es/app` en español, con `<html lang>` acorde. | auto | ✅ |
| NAV-02 | Cada ruta tiene su `<title>` y meta description según idioma (`seo.*` de los locales). | auto | ✅ |
| NAV-03 | Las URLs con barra final (`/es/`, `/about/`) muestran la misma página. | auto | ✅ |
| NAV-04 | Una ruta desconocida redirige a la home de su idioma (`/es/nope` → `/es`). | auto | ✅ |
| NAV-05 | El idioma sale del navegador en cada visita: un navegador en español que entra a una URL sin prefijo es llevado a `/es`; uno en inglés se queda en inglés, aunque su lista de idiomas incluya español después (`en-CO, es, en`) o use una variante regional (`en-CO`, `en-GB`). | auto | ✅ |
| NAV-06 | El selector EN · ES lleva a la misma página en el otro idioma. El idioma no se guarda en ningún sitio: lo lleva el prefijo de la URL, y las URLs sin prefijo siempre siguen al navegador. Visitar un enlace `/es/...` no cambia lo que verá después en `/`. | auto | ✅ |
| NAV-07 | Cambiar de idioma dentro del editor conserva los documentos cargados. | auto | ✅ |
| NAV-08 | En el editor, el logo vuelve a la landing y vacía los documentos; "← New score" vacía los documentos y muestra la zona de carga. | auto | ✅ |
| NAV-09 | `/about` muestra "About Dark Score", "Who is it for?", los puntos de privacidad, el enlace a GitHub y "Back to home". | auto | ✅ |

## SEO y HTML estático (SEO)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| SEO-01 | El HTML servido ya contiene el contenido sin ejecutar JS: `GET /` incluye el titular y `GET /es/about` incluye "Acerca de Dark Score". | auto | ✅ |
| SEO-02 | Cada página lleva `canonical` y `hreflang` en, es y x-default apuntando a `https://darkscore.app/...`. El editor (`/app`) lleva `noindex`. | auto | ✅ |
| SEO-03 | `/robots.txt` permite todo y apunta al sitemap; `/sitemap.xml` lista `/`, `/es`, `/about`, `/es/about` con sus alternates. | auto | ✅ |
| SEO-04 | La landing incluye la FAQ como JSON-LD (`FAQPage`). | auto | ✅ |
| SEO-05 | `/404.html` (fallback de GitHub Pages) redirige a `/` y lleva `noindex`. | auto | ✅ |

## Carga de archivos (UP)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| UP-01 | La zona de carga del editor acepta PDF, PNG y JPG por clic (selector de archivos) y muestra el resultado procesado. | auto | ✅ |
| UP-02 | Arrastrar y soltar archivos sobre la zona los carga igual que el selector. | auto | ✅ |
| UP-03 | Varios archivos a la vez crean una pestaña por archivo; la primera de las nuevas queda activa. | auto | ✅ |
| UP-04 | Un archivo de formato no soportado se rechaza con un mensaje que lo nombra ("`notes.txt`: unsupported format. Use PDF, PNG or JPG.") y no añade nada. | auto | ✅ |
| UP-05 | Un archivo de más de 50 MB se rechaza con un mensaje que lo nombra ("`huge.pdf`: over 50 MB.") y no añade nada. | auto | ✅ |
| UP-06 | Un lote con archivos inválidos carga los válidos y lista los rechazados, cada uno con su motivo. El aviso sobrevive al salto de la landing al editor (se muestra bajo las pestañas) y desaparece en la siguiente selección correcta. Las mismas reglas valen para la zona de carga, el arrastre y "+ Add files". | auto | ✅ |
| UP-07 | "+ Add files" en las pestañas añade documentos con los ajustes del documento activo (no con los de fábrica). | auto | ✅ |
| UP-08 | Mientras un documento carga, el preview muestra una barra "Processing… N%" y la pestaña muestra el porcentaje. | auto (parcial: estado final) | ✅ |
| UP-09 | Añadir o quitar un documento mientras otro está cargando no interrumpe esa carga. | auto + unit | ✅ |

## Procesado (PROC)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| PROC-01 | El preset inicial es "Dark stage": fondo `#000000`, notación `#ffffff`, contraste 110 %, brillo 100 %, limpieza 140, engrosamiento 0, modo "Smooth". | auto | ✅ |
| PROC-02 | Con "Dark stage", una partitura blanca con tinta negra se convierte en fondo negro (mayoría de píxeles) con notación blanca (algunos %). | auto (píxeles) | ✅ |
| PROC-03 | Cada uno de los 7 presets fijos queda marcado al pulsarlo, aplica sus colores al resultado y pone los sliders en sus valores por defecto. | auto (píxeles) | ✅ |
| PROC-04 | "Custom" conserva los colores y valores que hubiera (no resetea nada) y muestra selectores de color de fondo y notación; cambiar el fondo se refleja en el resultado. | auto (píxeles) | ✅ |
| PROC-05 | Los sliders tienen rango contraste 0–200, brillo 0–200, limpieza 0–255, engrosamiento 0–3; el valor mostrado sigue al slider y el resultado se reprocesa. | auto | ✅ |
| PROC-06 | El botón ↺ de cada slider restaura el valor por defecto del preset activo. | auto | ✅ |
| PROC-07 | Con engrosamiento ≥ 2 aparece la advertencia de pasajes densos; con < 2 no. | auto | ✅ |
| PROC-08 | Subir el engrosamiento aumenta la cantidad de píxeles de notación (líneas más gruesas). | auto (píxeles) | ✅ |
| PROC-09 | La limpieza tiene modos "Smooth" y "Sharp"; con "Sharp" el resultado es prácticamente binario (solo fondo y notación). | auto (píxeles) | ✅ |
| PROC-10 | Un escaneo con papel amarillento y ruido queda con fondo uniforme del color del preset (sin manchas) y la notación conservada. | auto (píxeles) + visual | ✅ |
| PROC-11 | Al cambiar un ajuste, el resultado anterior sigue visible mientras se reprocesa (no vuelve a la barra de carga). | auto | ✅ |
| PROC-12 | Todas las partituras reales de `test_scores/` cargan con su número de páginas y el resultado es mayoritariamente fondo con notación presente. Se guardan capturas antes/después para revisión. | auto + visual | ✅ |
| PROC-13 | El DPI (200/300) determina la resolución de render de los PDF: carta a 300 DPI ≈ 2550×3300 px, a 200 DPI ≈ 1700×2200 px; cambiarlo re-renderiza. | auto | ✅ |
| PROC-14 | Los ajustes son por documento: cambiar el preset de uno no cambia los otros. "Apply to all documents" copia los ajustes del activo a todos. | auto | ✅ |

## Páginas y documentos (PAGE)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| PAGE-01 | Un PDF multipágina muestra "‹ 1 / N ›"; ‹ se deshabilita en la primera página y › en la última; cada página muestra su propio contenido. | auto | ✅ |
| PAGE-02 | Pulsar una pestaña cambia el documento activo (resaltado), su preview y sus ajustes. | auto | ✅ |
| PAGE-03 | La × de una pestaña quita el documento; si era el activo, se activa uno adyacente; al quitar el último vuelve la zona de carga. | auto | ✅ |
| PAGE-04 | La pestaña muestra el nombre del archivo sin extensión. | auto | ✅ |

## Zoom y comparación (VIEW)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| VIEW-01 | El zoom empieza en 100 %; + y − cambian de 25 en 25 entre 1 % y 500 %; − se deshabilita en el mínimo y + en el máximo; el tamaño del preview cambia. | auto | ✅ |
| VIEW-02 | Pulsar el porcentaje permite escribir un valor; Enter lo aplica (recortado a 1–500) y Escape cancela. | auto | ✅ |
| VIEW-03 | Ctrl/⌘ + rueda sobre el preview hace zoom sin hacer zoom del navegador. | auto | ✅ |
| VIEW-04 | El zoom se mantiene al cambiar de página o de documento. | auto | ✅ |
| VIEW-05 | "Compare" muestra original y resultado con un divisor arrastrable (ratón); pulsarlo de nuevo vuelve al preview. | auto | ✅ |
| VIEW-06 | En escritorio el panel de ajustes se redimensiona arrastrando su borde con el ratón, y deja de seguir al puntero al soltar. | auto | ✅ |

## Historial de ajustes (HIST)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| HIST-01 | El historial empieza con 1 entrada y cada cambio confirmado (preset, modo de limpieza, soltar un slider) añade una; la actual va resaltada y primero. | auto | ✅ |
| HIST-02 | Pulsar una entrada anterior restaura esos ajustes (preset y valores) y reprocesa. | auto | ✅ |
| HIST-03 | Mover un slider sin soltarlo no crea entradas; solo al soltar. | auto | ✅ |
| HIST-04 | El historial es independiente por documento y guarda como máximo 30 entradas. | auto + unit | ✅ |

## Exportación (EXP)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| EXP-01 | "Download" está deshabilitado hasta que hay un resultado. | auto | ✅ |
| EXP-02 | Exportar como PDF descarga `<nombre>.pdf` con tantas páginas como el documento. | auto | ✅ |
| EXP-03 | Exportar como PNG descarga `<nombre>.png` con las dimensiones del resultado; con varias páginas descarga `<nombre>.zip` con `<nombre>-p1.png`, `-p2.png`… | auto | ✅ |
| EXP-04 | Con varios documentos y formato PDF aparece "Separate / Merged": Separate descarga solo el documento activo; Merged descarga `dark-score-batch.pdf` con todas las páginas de todos. | auto | ✅ |
| EXP-05 | El selector DPI solo aparece cuando hay algún PDF cargado. | auto | ✅ |
| EXP-06 | El botón vuelve a "Download" al terminar la exportación y se puede exportar de nuevo. | auto | ✅ |

## Persistencia (PERS)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| PERS-01 | El DPI y el modo de exportación se recuerdan tras recargar (`localStorage` `dark-score-settings`). | auto | ✅ |
| PERS-02 | Los documentos no se guardan: al recargar `/app` aparece la zona de carga vacía (nada queda en disco). | auto | ✅ |

## Analytics y privacidad (ANA)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| ANA-01 | Con `VITE_UMAMI_WEBSITE_ID` definido se carga `cloud.umami.is/script.js` con ese `data-website-id` y existe `window.umami`. Sin ID no se carga nada. | auto (con ID) / manual (sin ID) | ✅ |
| ANA-02 | Se envía un pageview al cargar y en cada navegación interna (`/` → `/app`). | auto | ✅ |
| ANA-03 | Eventos: `sample_score`; `upload_files` (`pdf:N,image:M`, tanto desde la zona de carga como desde "+ Add files"); `apply_preset` (id del preset); `threshold_mode` (`soft`/`hard`); `export_file` (`format:…,mode:…,docs:N`). | auto | ✅ |
| ANA-04 | No se crean cookies al usar la app. | auto | ✅ |
| ANA-05 | Los archivos nunca salen del navegador: cargar, procesar y exportar no genera ninguna petición con cuerpo salvo las de Umami, ni peticiones a otros dominios que no sean Umami o Sentry. | auto | ✅ |

## PWA (PWA)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| PWA-01 | `manifest.json` está enlazado y define nombre, `start_url`, `display: standalone` e iconos (incluido 512 px maskable). | auto | ✅ |
| PWA-02 | En producción se registra un service worker que controla la página tras recargar. | auto | ✅ |
| PWA-03 | Tras haber abierto la app una vez, sin conexión siguen cargando la landing y el editor. | auto | ✅ |

## Responsive (RESP)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| RESP-01 | En iPad y iPhone la landing y el About no tienen scroll horizontal y el hero, la zona de carga y el CTA son visibles. | auto | ✅ |
| RESP-02 | En iPhone el editor muestra un menú ☰ con New score, About, Support, EN · ES y Local processing; el panel de ajustes va debajo del preview. | auto | ✅ |
| RESP-03 | En iPad el editor carga y procesa un PDF igual que en escritorio y no hay scroll horizontal. | auto | ✅ |
| RESP-04 | El divisor de "Compare" se arrastra con el dedo. | auto (touch emulado) | ✅ |
| RESP-05 | En iPad apaisado el panel de ajustes se puede redimensionar con el dedo. | auto (touch emulado) | ✅ |
| RESP-06 | Los sliders confirman el cambio al levantar el dedo (entra en el historial). | auto (touch emulado) | ✅ |
| RESP-07 | Todo lo anterior en un iPad real con Safari. | manual | — |

## Errores (ERR)

| ID | Comportamiento esperado | Verificación | Estado |
|---|---|---|---|
| ERR-01 | Un archivo que no se puede leer muestra un mensaje en el preview ("This file could not be read…", o uno específico si el PDF está protegido con contraseña) y una marca `!` en su pestaña, traducido según el idioma. El error es por documento: los demás siguen funcionando, se puede exportar el resto y quitar la pestaña fallida lo limpia. | auto | ✅ |
| ERR-02 | Si un componente falla, se muestra un mensaje en lugar de una pantalla en blanco (ErrorBoundary). | manual | — |
