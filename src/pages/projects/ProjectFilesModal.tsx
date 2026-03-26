import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Button, Input } from '../../components/ui'
import Text, { baseFontSize } from '../../components/base/Text'
import { Themestore } from '../../data/Themestore'
import { projectFileService } from '../../services/projectFileService'
import type { ProjectFile } from '../../types'
import { Download, File, Link2, Pencil, Trash2, Upload } from 'lucide-react'

export type ProjectFilesModalProps = {
  open: boolean
  onClose: () => void
  projectId: string
}

export default function ProjectFilesModal({ open, onClose, projectId }: ProjectFilesModalProps) {
  const { current } = Themestore()
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [editing, setEditing] = useState<ProjectFile | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const list = await projectFileService.listByProject(projectId)
      setFiles(list)
    } catch {
      setMessage('Failed to load project files.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !projectId) return
    load()
  }, [open, projectId])

  const sorted = useMemo(() => {
    return [...files].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [files])

  const handleCreateLink = async () => {
    if (!name.trim() || !url.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      const created = await projectFileService.add({
        projectId,
        name: name.trim(),
        type: 'link',
        url: url.trim(),
        uploadedById: '',
      })
      setFiles((prev) => [created, ...prev])
      setName('')
      setUrl('')
    } catch {
      setMessage('Failed to add link.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSaving(true)
    setMessage(null)
    try {
      const created = await projectFileService.upload(projectId, file)
      setFiles((prev) => [created, ...prev])
    } catch {
      setMessage('Upload failed (check backend S3 config).')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    setSaving(true)
    setMessage(null)
    try {
      const updated = await projectFileService.update(editing.id, { name: editing.name, url: editing.url })
      if (updated) setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      setEditing(null)
    } catch {
      setMessage('Failed to update file.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    setMessage(null)
    try {
      const ok = await projectFileService.remove(id)
      if (ok) setFiles((prev) => prev.filter((f) => f.id !== id))
    } catch {
      setMessage('Failed to delete file.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} variant="wide">
      <div className="p-6 space-y-5" style={{ background: current?.system?.foreground }}>
        <div className="flex items-center justify-between gap-3">
          <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.2 }}>Project files</Text>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
            <Button label="Upload" size="sm" startIcon={<Upload className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()} disabled={saving} />
            <Button label="Refresh" size="sm" variant="background" onClick={load} disabled={loading || saving} />
          </div>
        </div>

        {message && (
          <div className="px-3 py-2 rounded-base text-sm" style={{ background: current?.system?.background }}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Link name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button label="Add link" startIcon={<Link2 className="w-4 h-4" />} onClick={handleCreateLink} disabled={saving || !name.trim() || !url.trim()} />
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto scroll-slim">
          {loading ? (
            <Text variant="sm" className="opacity-70">Loading…</Text>
          ) : sorted.length === 0 ? (
            <Text variant="sm" className="opacity-70">No files yet.</Text>
          ) : (
            sorted.map((f) => (
              <div key={f.id} className="p-3 rounded-base flex items-center gap-3" style={{ background: current?.system?.background }}>
                {f.type === 'link' ? <Link2 className="w-4 h-4 shrink-0" /> : <File className="w-4 h-4 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <Text className="truncate">{f.name}</Text>
                  <Text variant="sm" className="truncate opacity-60">{f.url}</Text>
                </div>
                <a href={f.url} target="_blank" rel="noreferrer" className="p-2 opacity-75 hover:opacity-100">
                  <Download className="w-4 h-4" />
                </a>
                <button type="button" className="p-2 opacity-75 hover:opacity-100" onClick={() => setEditing(f)}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 opacity-75 hover:opacity-100" onClick={() => handleDelete(f.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <div className="p-5 space-y-4">
            <Text className="font-semibold">Edit file</Text>
            <Input label="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input label="URL" value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button label="Cancel" variant="background" onClick={() => setEditing(null)} />
              <Button label="Save" onClick={handleSaveEdit} disabled={saving || !editing.name.trim() || !editing.url.trim()} />
            </div>
          </div>
        )}
      </Modal>
    </Modal>
  )
}
