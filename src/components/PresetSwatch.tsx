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

/** Wide version: one staff running across, for the top of a preset card. */
function PresetStrip({ bg, fg, className }: Readonly<{ bg: string; fg: string; className?: string }>) {
  const notes = [
    { x: 26, y: 21.5 },
    { x: 44, y: 18 },
    { x: 62, y: 14.5 },
    { x: 80, y: 18 },
    { x: 98, y: 11 },
  ]
  return (
    <svg viewBox="0 0 120 30" preserveAspectRatio="none" className={className} aria-hidden="true" focusable="false">
      <rect x="0.5" y="0.5" width="119" height="29" rx="4" fill={bg} stroke="rgb(255 255 255 / 0.16)" vectorEffect="non-scaling-stroke" />
      <g stroke={fg} strokeWidth="0.7" opacity="0.8">
        {[8, 11.5, 15, 18.5, 22].map((y) => (
          <line key={y} x1="8" x2="112" y1={y} y2={y} />
        ))}
      </g>
      <g fill={fg}>
        {notes.map((n) => (
          <ellipse key={n.x} cx={n.x} cy={n.y} rx="2.6" ry="1.85" transform={`rotate(-22 ${n.x} ${n.y})`} />
        ))}
      </g>
      <g stroke={fg} strokeWidth="0.8" strokeLinecap="round">
        {notes.map((n) => (
          n.y > 15
            ? <line key={n.x} x1={n.x + 2.3} y1={n.y - 0.6} x2={n.x + 2.3} y2={n.y - 10} />
            : <line key={n.x} x1={n.x - 2.3} y1={n.y + 0.6} x2={n.x - 2.3} y2={n.y + 10} />
        ))}
      </g>
    </svg>
  )
}
