/**
 * A staff with three notes drawn in a preset's colours: what a page will
 * look like, at the size of a thumbnail. The faint outline keeps black
 * swatches visible on the black UI.
 */
export function PresetSwatch({ bg, fg, className, wide = false }: Readonly<{ bg: string; fg: string; className?: string; wide?: boolean }>) {
  if (wide) return <PresetStrip bg={bg} fg={fg} className={className} />
  return (
    <svg viewBox="0 0 48 32" className={className} aria-hidden="true" focusable="false">
      <rect x="0.5" y="0.5" width="47" height="31" rx="5" fill={bg} stroke="rgb(255 255 255 / 0.16)" />
      <g stroke={fg} strokeWidth="0.75" opacity="0.85">
        {[10, 13.5, 17, 20.5, 24].map((y) => (
          <line key={y} x1="6" x2="42" y1={y} y2={y} />
        ))}
      </g>
      <g fill={fg}>
        <ellipse cx="15" cy="22.25" rx="2.5" ry="1.8" transform="rotate(-22 15 22.25)" />
        <ellipse cx="24" cy="17" rx="2.5" ry="1.8" transform="rotate(-22 24 17)" />
        <ellipse cx="33" cy="11.75" rx="2.5" ry="1.8" transform="rotate(-22 33 11.75)" />
      </g>
      <g stroke={fg} strokeWidth="0.9" strokeLinecap="round">
        <line x1="17.3" y1="21.6" x2="17.3" y2="11" />
        <line x1="26.3" y1="16.4" x2="26.3" y2="5.8" />
        <line x1="30.7" y1="12.4" x2="30.7" y2="23" />
      </g>
    </svg>
  )
}

/** Note pitches as staff steps (0 = bottom line, 8 = top line), repeated along the strip. */
const STRIP_PITCHES = [2, 4, 6, 3, 7, 5, 1, 4, 8, 6, 3, 5]
const STRIP_WIDTH = 600
const STRIP_NOTES = Array.from({ length: 27 }, (_, i) => {
  const step = STRIP_PITCHES[i % STRIP_PITCHES.length]
  return { x: 14 + i * 22, y: 22 - step * 1.75 }
})

/**
 * Wide version for the top of a preset card. The drawing is far wider than
 * any card and is cropped, never scaled out of shape ('slice' keeps the
 * proportions): a wide card simply shows more of the staff.
 */
function PresetStrip({ bg, fg, className = '' }: Readonly<{ bg: string; fg: string; className?: string }>) {
  return (
    <svg
      viewBox={`0 0 ${STRIP_WIDTH} 30`}
      preserveAspectRatio="xMidYMid slice"
      className={`rounded-[5px] ring-1 ring-white/15 ${className}`}
      style={{ backgroundColor: bg }}
      aria-hidden="true"
      focusable="false"
    >
      <g stroke={fg} strokeWidth="0.7" opacity="0.8">
        {[8, 11.5, 15, 18.5, 22].map((y) => (
          <line key={y} x1="0" x2={STRIP_WIDTH} y1={y} y2={y} />
        ))}
      </g>
      <g fill={fg}>
        {STRIP_NOTES.map((n) => (
          <ellipse key={n.x} cx={n.x} cy={n.y} rx="2.6" ry="1.85" transform={`rotate(-22 ${n.x} ${n.y})`} />
        ))}
      </g>
      <g stroke={fg} strokeWidth="0.8" strokeLinecap="round">
        {STRIP_NOTES.map((n) => (
          n.y > 15
            ? <line key={n.x} x1={n.x + 2.3} y1={n.y - 0.6} x2={n.x + 2.3} y2={n.y - 10} />
            : <line key={n.x} x1={n.x - 2.3} y1={n.y + 0.6} x2={n.x - 2.3} y2={n.y + 10} />
        ))}
      </g>
    </svg>
  )
}
