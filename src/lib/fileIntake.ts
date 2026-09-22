import type { SourceEntry, SourceType } from '../types'

export const MAX_SIZE_MB = 50
export const ACCEPTED_EXT = ['.pdf', '.png', '.jpg', '.jpeg']

export type RejectionReason = 'format' | 'size'

export interface Rejection {
  name: string
  reason: RejectionReason
}

export interface Intake {
  entries: SourceEntry[]
  rejected: Rejection[]
}

function getSourceType(file: File): SourceType | null {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) return 'image'
  return null
}

/**
 * Sorts a selection into files the app can open and files it cannot. One bad
 * file never discards the rest: the caller loads `entries` and reports
 * `rejected`, so dropping ten scores does not fail because of one.
 */
export function intakeFiles(files: readonly File[]): Intake {
  const entries: SourceEntry[] = []
  const rejected: Rejection[] = []

  for (const file of files) {
    const type = getSourceType(file)
    if (!type) {
      rejected.push({ name: file.name, reason: 'format' })
    } else if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      rejected.push({ name: file.name, reason: 'size' })
    } else {
      entries.push({ file, type })
    }
  }

  return { entries, rejected }
}

/** `pdf:N,image:M` label for the upload_files analytics event. */
export function intakeLabel(entries: readonly SourceEntry[]): string {
  const pdf = entries.filter((e) => e.type === 'pdf').length
  return `pdf:${pdf},image:${entries.length - pdf}`
}
