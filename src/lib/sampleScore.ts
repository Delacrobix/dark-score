import { scoreSvg } from './scoreSvg'
import type { SourceEntry } from '../types'

/** The illustrated sample score as an image file the normal pipeline can process. */
export function createSampleScore(): SourceEntry {
  const svg = scoreSvg({ bg: '#ffffff', fg: '#111111' })
  const file = new File([svg], 'sample-score.svg', { type: 'image/svg+xml' })
  return { file, type: 'image' }
}
