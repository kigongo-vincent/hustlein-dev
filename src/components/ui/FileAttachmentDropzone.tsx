import { useCallback, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { FileText, Upload } from 'lucide-react'
import Text from '../base/Text'
import { baseFontSize } from '../base/Text'
import { Themestore } from '../../data/Themestore'
const DEFAULT_ACCEPT =
  'application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,text/plain,.txt'

export type FileAttachmentDropzoneProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
  accept?: string
  multiple?: boolean
  label?: string
  /** Shown inside the drop zone when empty */
  hint?: ReactNode
}

function mergeFiles(prev: File[], incoming: File[], multiple: boolean): File[] {
  if (!multiple) return incoming.slice(0, 1)
  const map = new Map<string, File>()
  const key = (f: File) => `${f.name}:${f.size}:${f.lastModified}`
  prev.forEach((f) => map.set(key(f), f))
  incoming.forEach((f) => map.set(key(f), f))
  return [...map.values()]
}

const FileAttachmentDropzone = ({
  files,
  onFilesChange,
  disabled = false,
  accept = DEFAULT_ACCEPT,
  multiple = true,
  label = 'Attach documents (CV / Resume)',
  hint = 'Drag files here or browse — PDF, Word, or text',
}: FileAttachmentDropzoneProps) => {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const border = current?.system?.border ?? 'rgba(0,0,0,0.15)'
  const bg = current?.system?.background ?? 'rgba(0,0,0,0.04)'
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const pickFiles = useCallback(
    (list: FileList | File[]) => {
      const arr = Array.from(list).filter(Boolean)
      if (arr.length === 0) return
      onFilesChange(mergeFiles(files, arr, multiple))
    },
    [files, multiple, onFilesChange],
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files
      if (list?.length) pickFiles(list)
      e.target.value = ''
    },
    [pickFiles],
  )

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setDragOver(true)
  }, [disabled])

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      if (disabled) return
      const dt = e.dataTransfer.files
      if (dt?.length) pickFiles(dt)
    },
    [disabled, pickFiles],
  )

  return (
    <div className="space-y-2">
      {label ? (
        <Text variant="sm" style={{ opacity: 0.55 }}>
          {label}
        </Text>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={accept}
        onChange={onInputChange}
        disabled={disabled}
        aria-hidden
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`w-full rounded-base border border-dashed px-4 py-8 text-center transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ${disabled ? 'pointer-events-none cursor-not-allowed opacity-45' : 'cursor-pointer'}`}
        style={{
          borderColor: dragOver ? (current?.brand?.primary ?? '#682308') : border,
          backgroundColor: dragOver ? `${current?.brand?.primary ?? '#682308'}0c` : bg,
          color: dark,
          outlineColor: current?.brand?.primary ?? '#682308',
        }}
        aria-disabled={disabled}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 shrink-0 opacity-50" aria-hidden />
          <Text style={{ fontSize: baseFontSize, fontWeight: 600 }}>{hint}</Text>
          <span
            className="inline-flex items-center gap-2 text-[13px] font-medium opacity-80"
            style={{ color: current?.brand?.primary ?? '#682308' }}
          >
            <FileText className="w-4 h-4 shrink-0" aria-hidden />
            {files.length ? 'Add more files' : 'Browse files'}
          </span>
          {files.length > 0 && (
            <Text variant="sm" style={{ opacity: 0.45 }}>
              {files.length} file{files.length === 1 ? '' : 's'} selected
            </Text>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileAttachmentDropzone
