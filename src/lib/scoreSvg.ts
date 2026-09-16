/**
 * Deterministic illustration of a short piano score, as an SVG string.
 *
 * Used twice: as the before/after demo on the landing page and, serialized to
 * a File, as the "try with a sample score" input. It is an illustration, not a
 * real piece, so the app never ships copyrighted sheet music.
 */

export interface ScoreSvgOptions {
  bg: string
  fg: string
  /** Only the first system(s): used by the landing hero. */
  crop?: boolean
}

// Page in a 1000 x 1414 space (A4 ratio). All coordinates below live here.
const PAGE_W = 1000
const PAGE_H = 1414
const CROP_H = 620

const LEFT = 70
const RIGHT = 930
const STAFF_GAP = 9 // distance between staff lines
const STAFF_H = STAFF_GAP * 4
const GRAND_GAP = 70 // treble bottom line → bass top line
const SYSTEM_STEP = 230
const FIRST_SYSTEM_Y = 210
const MEASURES = 4

/** Small deterministic PRNG so the drawing is identical on server and client. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

function staffLines(y: number, fg: string): string {
  let out = ''
  for (let i = 0; i < 5; i++) {
    const ly = y + i * STAFF_GAP
    out += `<line x1="${LEFT}" y1="${ly}" x2="${RIGHT}" y2="${ly}" stroke="${fg}" stroke-width="1.1"/>`
  }
  return out
}

function noteHead(x: number, y: number, fg: string, hollow = false): string {
  const fill = hollow ? 'none' : fg
  return `<ellipse cx="${x}" cy="${y}" rx="5.6" ry="3.9" transform="rotate(-22 ${x} ${y})" fill="${fill}" stroke="${fg}" stroke-width="${hollow ? 1.6 : 0.8}"/>`
}

function stem(x: number, y: number, up: boolean, fg: string, length = 32): string {
  const sx = up ? x + 5 : x - 5
  const y2 = up ? y - length : y + length
  return `<line x1="${sx}" y1="${y}" x2="${sx}" y2="${y2}" stroke="${fg}" stroke-width="1.4"/>`
}

function beam(x1: number, y1: number, x2: number, y2: number, fg: string): string {
  return `<polygon points="${x1},${y1} ${x2},${y2} ${x2},${y2 + 4.5} ${x1},${y1 + 4.5}" fill="${fg}"/>`
}

function slur(x1: number, x2: number, y: number, fg: string, above: boolean): string {
  const cy = above ? y - 22 : y + 22
  const cy2 = above ? y - 18 : y + 18
  return `<path d="M${x1} ${y} Q${(x1 + x2) / 2} ${cy} ${x2} ${y} Q${(x1 + x2) / 2} ${cy2} ${x1} ${y}" fill="${fg}"/>`
}

/** Pitch index → y on a staff (0 = bottom line, each step is half a gap). */
const pitchY = (staffTop: number, step: number) => staffTop + STAFF_H - step * (STAFF_GAP / 2)

function trebleMeasure(x0: number, w: number, staffTop: number, fg: string, rnd: () => number): string {
  let out = ''
  const beats = 4
  const slot = w / beats
  let step = 4 + Math.floor(rnd() * 5) // start somewhere mid-staff
  for (let b = 0; b < beats; b++) {
    const x = x0 + slot * b + 14
    const pattern = rnd()
    if (pattern < 0.55) {
      // two beamed eighth notes
      const s1 = step
      const s2 = Math.max(1, Math.min(10, step + (rnd() < 0.5 ? 1 : -1) * (1 + Math.floor(rnd() * 2))))
      const y1 = pitchY(staffTop, s1)
      const y2 = pitchY(staffTop, s2)
      const up = (s1 + s2) / 2 < 6
      const x2 = x + slot / 2 - 4
      out += noteHead(x, y1, fg) + noteHead(x2, y2, fg)
      out += stem(x, y1, up, fg) + stem(x2, y2, up, fg)
      const sx1 = up ? x + 5 : x - 5
      const sx2 = up ? x2 + 5 : x2 - 5
      const by1 = up ? y1 - 32 : y1 + 32 - 4.5
      const by2 = up ? y2 - 32 : y2 + 32 - 4.5
      out += beam(sx1, by1, sx2, by2, fg)
      step = s2
    } else if (pattern < 0.85) {
      // quarter note
      const y = pitchY(staffTop, step)
      out += noteHead(x + 8, y, fg) + stem(x + 8, y, step < 6, fg)
      step = Math.max(1, Math.min(10, step + Math.floor(rnd() * 5) - 2))
    } else {
      // half note (takes two beats)
      const y = pitchY(staffTop, step)
      out += noteHead(x + 8, y, fg, true) + stem(x + 8, y, step < 6, fg)
      b += 1
      step = Math.max(1, Math.min(10, step + Math.floor(rnd() * 3) - 1))
    }
  }
  if (rnd() < 0.5) out += slur(x0 + 12, x0 + w - 18, staffTop - 6, fg, true)
  return out
}

function bassMeasure(x0: number, w: number, staffTop: number, fg: string, rnd: () => number): string {
  let out = ''
  const kind = rnd()
  if (kind < 0.4) {
    // whole-ish: two half notes
    for (let i = 0; i < 2; i++) {
      const step = 2 + Math.floor(rnd() * 5)
      const y = pitchY(staffTop, step)
      const x = x0 + 22 + i * (w / 2)
      out += noteHead(x, y, fg, true) + stem(x, y, step < 5, fg)
    }
  } else {
    // four quarter notes, sometimes as an octave/fifth chord
    for (let i = 0; i < 4; i++) {
      const step = 1 + Math.floor(rnd() * 6)
      const y = pitchY(staffTop, step)
      const x = x0 + 22 + i * (w / 4)
      out += noteHead(x, y, fg) + stem(x, y, step < 5, fg)
      if (rnd() < 0.35) out += noteHead(x, pitchY(staffTop, step + 4), fg)
    }
  }
  return out
}

export function scoreSvg({ bg, fg, crop = false }: ScoreSvgOptions): string {
  const rnd = mulberry32(20260331)
  const height = crop ? CROP_H : PAGE_H
  const systems = crop ? 2 : 5
  const font = `'Bravura', 'Noto Music', 'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols2', serif`
  const serif = `Georgia, 'Times New Roman', serif`

  let body = `<rect width="${PAGE_W}" height="${height}" fill="${bg}"/>`
  body += `<text x="${PAGE_W / 2}" y="92" text-anchor="middle" font-family="${serif}" font-size="34" fill="${fg}">${esc('Étude')}</text>`
  body += `<text x="${RIGHT}" y="128" text-anchor="end" font-family="${serif}" font-style="italic" font-size="15" fill="${fg}">${esc('Dark Score · sample')}</text>`
  body += `<text x="${LEFT}" y="176" font-family="${serif}" font-style="italic" font-size="15" fill="${fg}">Andante</text>`

  for (let s = 0; s < systems; s++) {
    const trebleTop = FIRST_SYSTEM_Y + s * SYSTEM_STEP
    const bassTop = trebleTop + STAFF_H + GRAND_GAP
    body += staffLines(trebleTop, fg) + staffLines(bassTop, fg)

    // brace and system bar line
    body += `<path d="M${LEFT - 14} ${trebleTop} C${LEFT - 30} ${trebleTop + 40} ${LEFT - 8} ${trebleTop + 60} ${LEFT - 22} ${(trebleTop + bassTop + STAFF_H) / 2} C${LEFT - 8} ${bassTop + STAFF_H - 60} ${LEFT - 30} ${bassTop + STAFF_H - 40} ${LEFT - 14} ${bassTop + STAFF_H}" fill="none" stroke="${fg}" stroke-width="2.2"/>`
    body += `<line x1="${LEFT}" y1="${trebleTop}" x2="${LEFT}" y2="${bassTop + STAFF_H}" stroke="${fg}" stroke-width="1.4"/>`

    // clefs and time signature
    body += `<text x="${LEFT + 6}" y="${trebleTop + STAFF_H - 1}" font-family="${font}" font-size="${STAFF_H * 1.55}" fill="${fg}">𝄞</text>`
    body += `<text x="${LEFT + 6}" y="${bassTop + STAFF_H - 8}" font-family="${font}" font-size="${STAFF_H * 1.1}" fill="${fg}">𝄢</text>`
    if (s === 0) {
      for (const top of [trebleTop, bassTop]) {
        body += `<text x="${LEFT + 48}" y="${top + STAFF_GAP * 2 - 1}" text-anchor="middle" font-family="${serif}" font-weight="bold" font-size="${STAFF_GAP * 2.3}" fill="${fg}">4</text>`
        body += `<text x="${LEFT + 48}" y="${top + STAFF_GAP * 4 - 1}" text-anchor="middle" font-family="${serif}" font-weight="bold" font-size="${STAFF_GAP * 2.3}" fill="${fg}">4</text>`
      }
    }

    // measures
    const startX = LEFT + (s === 0 ? 70 : 48)
    const mw = (RIGHT - startX) / MEASURES
    for (let m = 0; m < MEASURES; m++) {
      const x0 = startX + m * mw
      body += trebleMeasure(x0, mw, trebleTop, fg, rnd)
      body += bassMeasure(x0, mw, bassTop, fg, rnd)
      const bx = x0 + mw
      body += `<line x1="${bx}" y1="${trebleTop}" x2="${bx}" y2="${trebleTop + STAFF_H}" stroke="${fg}" stroke-width="1.2"/>`
      body += `<line x1="${bx}" y1="${bassTop}" x2="${bx}" y2="${bassTop + STAFF_H}" stroke="${fg}" stroke-width="1.2"/>`
    }

    // a dynamic marking under the first measure of each system
    const dyn = ['p', 'mf', 'cresc.', 'f', 'dim.'][s % 5]
    body += `<text x="${startX + 8}" y="${trebleTop + STAFF_H + 40}" font-family="${serif}" font-style="italic" font-weight="bold" font-size="17" fill="${fg}">${dyn}</text>`
  }

  if (!crop) {
    body += `<text x="${PAGE_W / 2}" y="${PAGE_H - 40}" text-anchor="middle" font-family="${serif}" font-size="13" fill="${fg}">1</text>`
  }

  // Trim float noise (e.g. 213.33333333) to keep the markup small.
  const compact = body.replace(/(\d+\.\d)\d+/g, '$1')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_W} ${height}" width="${PAGE_W * 1.6}" height="${height * 1.6}" role="img" aria-label="Sheet music excerpt">${compact}</svg>`
}
