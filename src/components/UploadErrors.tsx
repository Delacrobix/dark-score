import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { MAX_SIZE_MB } from '../lib/fileIntake'

/**
 * Files from the last selection that could not be opened. Shown next to the
 * drop zone when there is nothing loaded yet, and under the document tabs
 * once the valid files of the same batch are open.
 */
export function UploadErrors() {
  const { t } = useTranslation()
  const rejected = useAppStore((s) => s.rejectedFiles)

  if (rejected.length === 0) return null

  return (
    <div role="alert" className="flex flex-col gap-0.5">
      {rejected.map((file) => (
        <p key={`${file.name}-${file.reason}`} className="text-xs text-red-400">
          {file.reason === 'size'
            ? t('upload.rejectedSize', { name: file.name, size: MAX_SIZE_MB })
            : t('upload.rejectedFormat', { name: file.name })}
        </p>
      ))}
    </div>
  )
}
