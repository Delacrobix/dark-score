# Dark Score — Sheet Music to Dark Mode Converter

## Project description

Web app that converts sheet music PDFs or images to dark mode, optimized specifically for musicians. 100% in-browser processing (client-side). No files are ever uploaded to any server.

**Suggested stack:** HTML + CSS + Vanilla JavaScript (or React if preferred). Uses Canvas API for image processing. Uses pdf.js to render PDFs and jspdf to export PDFs.

---

## Functional requirements

### 1. File input

- Accept PDF (standard format for digital sheet music).
- Accept standalone images: PNG, JPG, JPEG.
- Support for multi-page PDFs, preserving the complete document structure.
- Drag & drop + file selection button.
- Show a preview of the original score immediately after loading.

### 2. Conversion modes (presets)

Offer presets with musician-friendly names (no technical jargon):

| Preset | Background | Notation color | Use case |
|--------|------------|----------------|----------|
| **Dark stage** | `#000000` (pure black) | `#FFFFFF` (white) | AMOLED screens, maximum battery saving |
| **Night study** | `#1A1A1A` (very dark gray) | `#E0E0E0` (light gray) | Low-light practice, less aggressive than pure black |
| **Orchestra pit** | `#1C1410` (very dark brown) | `#F5E6C8` (cream/amber) | Long sessions, reduced eye strain |
| **Custom** | Color picker | Color picker | Full user control |

### 3. Image adjustments

All adjustments should have a slider with real-time preview:

- **Contrast** (0–200%): Controls contrast between score elements and background.
- **Brightness** (0–200%): Overall brightness of the result.
- **Cleaning threshold** (0–255): Adaptive thresholding for imperfect scans. Scanned scores have noise, shadows, and yellowed pages that a brute inversion turns into blotches. This control defines the cutoff between "part of the score" and "noise/dirt from the scan".
- **Line thickening** (0, 1, 2, 3): Morphological dilation to thicken staff lines and other thin elements that get lost when inverting to white on black. Implemented as image compositing with 1px offsets in 4/8 directions on Canvas 2D. Level 0 = no change, 1 = subtle (horizontal only), 2 = moderate (4 directions), 3 = maximum (8 directions). Include a visual warning if level is >= 2 that notes in dense passages may bleed together.

### 4. Preview

- Real-time preview of all adjustments before exporting.
- For multi-page PDFs, show page navigation in the preview.
- Zoom option in the preview.
- Side-by-side comparison mode: original vs. result (split view with draggable slider).

### 5. Export

- **PDF**: Maintain multi-page. Use jspdf to generate the PDF with the processed images.
- **PNG**: Download individual pages as PNG images.
- **ZIP**: If the PDF has multiple pages and PNG is chosen, compress all images into a ZIP.
- The exported file is the final result (not a temporary filter that depends on an app to be viewed).

### 6. Settings persistence

- Save the last used settings in `localStorage` so they don't need to be reconfigured each time the app is used.
- Include a "Restore defaults" button.

---

## Non-functional requirements

### 7. Privacy and security

- **All processing happens in the browser.** Zero external API calls with user data.
- No user files are stored anywhere persistently.
- Show a visible badge or indicator saying "Your scores never leave your device" to convey trust.

### 8. Performance

- Processing of a single page should complete in under 2 seconds on average hardware.
- For multi-page PDFs, process pages progressively (do not block the UI waiting for all pages to finish).
- Show a progress bar during processing of long PDFs.
- Render PDFs at 200 DPI as baseline. Option of 300 DPI for high-quality export.

### 9. UX / Design

- Minimalist and dark interface by default (consistent with the app's purpose).
- Responsive: should work well on tablet (landscape and portrait), which is where sheet music is most commonly read digitally.
- Mobile-friendly but prioritizing tablet and desktop.
- Simple 3-step flow visible to users: **Upload -> Adjust -> Download**.
- Presets should be accessible with a single click.
- Use subtle musical iconography in the UI (treble clef in the logo, for example).

### 10. Compatibility

- Modern browsers: Chrome, Safari, Firefox, Edge (last 2 versions).
- Must work on iPad Safari (the most common device for reading sheet music).

---

## Suggested technical architecture

```
[Input: PDF/IMG]
      |
      v
[pdf.js renders each page to Canvas @ 200 DPI]
      |
      v
[Canvas API: getImageData()]
      |
      v
[Per-pixel processing pipeline:]
  1. Thresholding (clean scan noise)
  2. Morphological dilation (thicken lines)
  3. Color inversion
  4. Remapping to selected preset colors
      |
      v
[Result canvas -> real-time preview]
      |
      v
[Export: jspdf (PDF) | canvas.toBlob (PNG) | JSZip (ZIP)]
```

### Suggested dependencies (all client-side)

- `pdf.js` — PDF rendering on Canvas
- `jspdf` — output PDF generation
- `jszip` — compression of multiple PNGs into ZIP (only when exporting images)
- No backend. No heavy framework required.

---

## MVP scope (Phase 1)

Implement requirements 1–8 in full. The side-by-side comparison mode (req. 4) can be simplified to a toggle between original/result instead of the draggable split view.

## Phase 2 (post-MVP)

- Draggable split view for comparison.
- Batch processing (upload multiple scores at once).
- Installable PWA for offline use.
- Option to adjust export DPI (200/300).

---

## Proposed name

**Dark Score** — short, descriptive, easy to remember.
