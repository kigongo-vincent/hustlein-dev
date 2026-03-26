import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Button, Input } from '../../components/ui'
import Text, { baseFontSize } from '../../components/base/Text'
import { Themestore } from '../../data/Themestore'
import { projectFileService } from '../../services/projectFileService'
import type { ProjectFile, ProjectFileStorageSummary } from '../../types'
import { ChevronRight, Copy, Download, File, Folder, FolderPlus, Home, Link2, MoreHorizontal, Pencil, RefreshCw, Search, Trash2, Upload } from 'lucide-react'
import FileNodeIcon from './FileNodeIcon'

export type ProjectFilesModalProps = {
  open: boolean
  onClose: () => void
  projectId: string
}

export default function ProjectFilesModal({ open, onClose, projectId }: ProjectFilesModalProps) {
  const { current } = Themestore()
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [storageSummary, setStorageSummary] = useState<ProjectFileStorageSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [folderName, setFolderName] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ProjectFile | null>(null)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({})
  const [contextOpen, setContextOpen] = useState(false)
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 })
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalBodyRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const theme = useMemo(() => ({
    panelBg: current?.system?.foreground,
    subtleBg: current?.system?.background,
    border: current?.system?.border,
    text: current?.system?.dark,
    mutedText: current?.system?.dark ? `${current.system.dark}B3` : undefined,
  }), [current?.system?.background, current?.system?.border, current?.system?.dark, current?.system?.foreground])

  const load = async () => {
    setLoading(true)
    try {
      const [list, summary] = await Promise.all([
        projectFileService.treeByProject(projectId),
        projectFileService.storageSummary(projectId),
      ])
      setFiles(list)
      setStorageSummary(summary)
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const source = q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files
    return [...source].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1
      if (a.type !== 'folder' && b.type === 'folder') return 1
      return a.name.localeCompare(b.name)
    })
  }, [files, search])

  const childrenByParent = useMemo(() => {
    const map: Record<string, ProjectFile[]> = {}
    filtered.forEach((item) => {
      const key = item.parentId ?? 'root'
      if (!map[key]) map[key] = []
      map[key].push(item)
    })
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => a.name.localeCompare(b.name))
    })
    return map
  }, [filtered])

  const currentItems = useMemo(() => childrenByParent[activeFolderId ?? 'root'] ?? [], [childrenByParent, activeFolderId])
  const currentFolders = useMemo(() => currentItems.filter((item) => item.type === 'folder'), [currentItems])
  const currentFiles = useMemo(() => currentItems.filter((item) => item.type !== 'folder'), [currentItems])

  const folderPath = useMemo(() => {
    const path: ProjectFile[] = []
    let cur = activeFolderId
    const byId: Record<string, ProjectFile> = {}
    files.forEach((item) => { byId[item.id] = item })
    while (cur && byId[cur]) {
      path.unshift(byId[cur])
      cur = byId[cur].parentId ?? null
    }
    return path
  }, [activeFolderId, files])

  const handleCreateLink = async () => {
    if (!linkName.trim() || !linkUrl.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      const created = await projectFileService.add({
        projectId,
        parentId: activeFolderId ?? undefined,
        name: linkName.trim(),
        type: 'link',
        url: linkUrl.trim(),
        uploadedById: '',
      })
      setFiles((prev) => [created, ...prev])
      setLinkName('')
      setLinkUrl('')
      setLinkModalOpen(false)
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
      const created = await projectFileService.upload(projectId, file, activeFolderId ?? undefined)
      setFiles((prev) => [created, ...prev])
      load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.'
      setMessage(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      const created = await projectFileService.add({
        projectId,
        parentId: activeFolderId ?? undefined,
        name: folderName.trim(),
        type: 'folder',
        url: '',
        uploadedById: '',
      })
      setFiles((prev) => [created, ...prev])
      setFolderName('')
      setFolderModalOpen(false)
    } catch {
      setMessage('Failed to create folder.')
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

  const handlePaste = async () => {
    if (!copiedItemId) return
    setSaving(true)
    try {
      await projectFileService.move(copiedItemId, activeFolderId ?? undefined)
      setCopiedItemId(null)
      load()
    } catch {
      setMessage('Failed to paste item here.')
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

  const openContextAt = useCallback((clientX: number, clientY: number) => {
    const modalRect = modalBodyRef.current?.getBoundingClientRect()
    const menuWidth = 220
    const menuHeight = 280
    if (!modalRect) {
      setContextPos({ x: clientX, y: clientY })
      setContextOpen(true)
      return
    }
    const maxX = modalRect.right - menuWidth - 12
    const maxY = modalRect.bottom - menuHeight - 12
    const x = Math.max(modalRect.left + 8, Math.min(clientX, maxX))
    const y = Math.max(modalRect.top + 8, Math.min(clientY, maxY))
    setContextPos({ x, y })
    setContextOpen(true)
  }, [])

  useEffect(() => {
    if (!contextOpen) return
    const onMouseDown = (event: MouseEvent) => {
      if (!contextMenuRef.current) return
      if (!contextMenuRef.current.contains(event.target as Node)) setContextOpen(false)
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContextOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [contextOpen])

  const renderTree = (parentId: string | null, depth = 0) => {
    const items = childrenByParent[parentId ?? 'root'] ?? []
    return items
      .filter((item) => item.type === 'folder')
      .map((item) => {
        const expanded = expandedFolderIds[item.id] ?? true
        const hasChildren = (childrenByParent[item.id] ?? []).length > 0
        return (
          <div key={item.id}>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-base text-left"
              style={{ background: activeFolderId === item.id ? theme.subtleBg : 'transparent', paddingLeft: 8 + depth * 14, color: theme.text }}
              onClick={() => setActiveFolderId(item.id)}
            >
              <span
                style={{ color: theme.mutedText }}
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedFolderIds((prev) => ({ ...prev, [item.id]: !expanded }))
                }}
              >
                {hasChildren ? <ChevronRight className={`w-3.5 h-3.5 ${expanded ? 'rotate-90' : ''}`} /> : <span className="inline-block w-3.5" />}
              </span>
              <FileNodeIcon node={item} size="sm" className="shrink-0" />
              <Text variant="sm" className="truncate">{item.name}</Text>
            </button>
            {expanded && hasChildren && (
              <div>{renderTree(item.id, depth + 1)}</div>
            )}
          </div>
        )
      })
  }

  const storageLabel = useMemo(() => {
    if (!storageSummary) return '0 MB used'
    const usedMb = storageSummary.usedBytes / (1024 * 1024)
    const limitMb = storageSummary.limitBytes / (1024 * 1024)
    return `${usedMb.toFixed(1)} MB / ${limitMb.toFixed(1)} MB used`
  }, [storageSummary])
  const storagePercent = useMemo(() => {
    if (!storageSummary) return 0
    return Math.max(0, Math.min(100, storageSummary.usagePercent))
  }, [storageSummary])

  return (
    <Modal open={open} onClose={onClose} variant="wide">
      <div ref={modalBodyRef} className="p-0 overflow-hidden rounded-base relative" style={{ background: theme.panelBg }}>
        <div className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: theme.border }}>
          <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.1 }}>Project files</Text>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 w-9 rounded-base border flex items-center justify-center"
              style={{ borderColor: theme.border, color: theme.text }}
              onClick={(e) => {
                if (contextOpen) {
                  setContextOpen(false)
                  return
                }
                const rect = e.currentTarget.getBoundingClientRect()
                openContextAt(rect.right - 16, rect.bottom + 8)
              }}
              aria-label="Open actions menu"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
            <Button label="Upload" size="sm" startIcon={<Upload className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()} disabled={saving} />
            <Button label="Refresh" size="sm" variant="background" startIcon={<RefreshCw className="w-4 h-4" />} onClick={load} disabled={loading || saving} />
          </div>
        </div>
        {contextOpen && (
          <div
            ref={contextMenuRef}
            className="fixed z-[60] w-52 rounded-base border shadow-lg p-1"
            style={{ left: contextPos.x, top: contextPos.y, borderColor: theme.border, background: theme.panelBg, color: theme.text }}
          >
            <button type="button" className="w-full px-3 py-2 text-left text-sm rounded-base hover:opacity-80 flex items-center gap-2" onClick={() => setContextOpen(false)}>
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button type="button" className="w-full px-3 py-2 text-left text-sm rounded-base hover:opacity-80 flex items-center gap-2" onClick={() => { setContextOpen(false); load() }}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button type="button" className="w-full px-3 py-2 text-left text-sm rounded-base hover:opacity-80 flex items-center gap-2" onClick={() => { setContextOpen(false); handlePaste() }}>
              <Copy className="w-4 h-4" /> Paste
            </button>
            <button type="button" className="w-full px-3 py-2 text-left text-sm rounded-base hover:opacity-80 flex items-center gap-2" onClick={() => { setContextOpen(false); fileInputRef.current?.click() }}>
              <Upload className="w-4 h-4" /> Upload file
            </button>
            <button type="button" className="w-full px-3 py-2 text-left text-sm rounded-base hover:opacity-80 flex items-center gap-2" onClick={() => { setContextOpen(false); setFolderModalOpen(true) }}>
              <FolderPlus className="w-4 h-4" /> New folder
            </button>
            <button type="button" className="w-full px-3 py-2 text-left text-sm rounded-base hover:opacity-80 flex items-center gap-2" onClick={() => { setContextOpen(false); setMessage('New note will be available next pass.') }}>
              <File className="w-4 h-4" /> New note
            </button>
            <button type="button" className="w-full px-3 py-2 text-left text-sm rounded-base hover:opacity-80 flex items-center gap-2" onClick={() => { setContextOpen(false); setLinkModalOpen(true) }}>
              <Link2 className="w-4 h-4" /> Add URL
            </button>
          </div>
        )}

        <div className="px-5 py-3 border-b space-y-3" style={{ borderColor: theme.border }}>
          {message && (
            <div className="px-3 py-2 rounded-base text-sm" style={{ background: theme.subtleBg, color: theme.text }}>
              {message}
            </div>
          )}
          <div className="relative w-full md:w-[320px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.mutedText }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search virtual paths..."
              className="w-full h-10 pl-9 pr-3 rounded-base border bg-transparent text-sm outline-none"
              style={{ borderColor: theme.border, color: theme.text }}
            />
          </div>
        </div>

        <div className="grid grid-cols-12 min-h-[420px] max-h-[60vh]">
          <aside className="col-span-12 md:col-span-4 lg:col-span-3 border-r overflow-y-auto scroll-slim flex flex-col" style={{ borderColor: theme.border }}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: theme.border }}>
              <Folder className="w-4 h-4" style={{ color: theme.mutedText }} />
              <Text className="font-medium">Project files</Text>
            </div>
            <button
              type="button"
              className="mx-3 mt-2 flex items-center gap-2 px-2 py-1.5 rounded-base text-left"
              style={{ background: activeFolderId == null ? theme.subtleBg : 'transparent', color: theme.text }}
              onClick={() => setActiveFolderId(null)}
            >
              <Home className="w-4 h-4" style={{ color: theme.mutedText }} />
              <Text variant="sm">Project files</Text>
            </button>
            <div className="px-3 py-2 space-y-1 flex-1">
              {loading ? (
                <Text variant="sm" className="opacity-70 px-2 py-1">Loading…</Text>
              ) : filtered.length === 0 ? (
                <Text variant="sm" className="opacity-70 px-2 py-1">No files yet.</Text>
              ) : (
                renderTree(null)
              )}
            </div>
            <div className="px-3 py-3 border-t text-xs opacity-70 space-y-2" style={{ borderColor: theme.border, color: theme.text }}>
              <div>{storageLabel}</div>
              <div className="h-1.5 rounded-full" style={{ background: theme.subtleBg }}>
                <div className="h-full rounded-full" style={{ width: `${storagePercent}%`, background: current?.brand?.primary ?? '#d59c44' }} />
              </div>
            </div>
          </aside>
          <main className="col-span-12 md:col-span-8 lg:col-span-9">
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2 text-sm" style={{ color: theme.mutedText }}>
                <Home className="w-4 h-4" />
                {folderPath.map((f) => (
                  <span key={f.id} className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5" />
                    <button type="button" onClick={() => setActiveFolderId(f.id)}>{f.name}</button>
                  </span>
                ))}
              </div>
              <div className="opacity-70 text-sm">View settings</div>
            </div>
            <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: theme.border }}>
              <button type="button" className="h-8 w-8 rounded-base border flex items-center justify-center" style={{ borderColor: theme.border, color: theme.text }} onClick={() => setActiveFolderId(null)}>
                <Home className="w-4 h-4" />
              </button>
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.mutedText }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search visited paths..."
                  className="w-full h-9 pl-9 pr-3 rounded-base border bg-transparent text-sm outline-none"
                  style={{ borderColor: theme.border, color: theme.text }}
                />
              </div>
              <button type="button" className="h-8 w-8 rounded-base border flex items-center justify-center" style={{ borderColor: theme.border, color: theme.text }} onClick={load}>
                <RefreshCw className="w-4 h-4" />
              </button>
              <button type="button" className="h-8 w-8 rounded-base border flex items-center justify-center" style={{ borderColor: theme.border, color: theme.text }} onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" />
              </button>
              <button type="button" className="h-8 w-8 rounded-base border flex items-center justify-center" style={{ borderColor: theme.border, color: theme.text }} onClick={() => setFolderModalOpen(true)}>
                <FolderPlus className="w-4 h-4" />
              </button>
              <button type="button" className="h-8 w-8 rounded-base border flex items-center justify-center" style={{ borderColor: theme.border, color: theme.text }} onClick={() => setLinkModalOpen(true)}>
                <Link2 className="w-4 h-4" />
              </button>
            </div>
            <div
              className="p-4 overflow-y-auto scroll-slim h-full"
              onContextMenu={(e) => {
                e.preventDefault()
                openContextAt(e.clientX, e.clientY)
              }}
            >
              {currentFolders.length > 0 && (
                <div className="mb-5">
                  <Text variant="sm" className="opacity-70 mb-2">Folders</Text>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {currentFolders.map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        className="p-3 rounded-base text-left"
                        style={{ background: 'transparent' }}
                        onClick={() => setActiveFolderId(f.id)}
                      >
                        <FileNodeIcon node={f} size="lg" className="mb-2" />
                        <Text className="truncate">{f.name}</Text>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Text variant="sm" className="opacity-70 mb-2">Files</Text>
                <div className="space-y-2">
                  {currentFiles.length === 0 ? (
                    <Text variant="sm" className="opacity-70">No files yet.</Text>
                  ) : currentFiles.map((f) => (
                    <div key={f.id} className="p-3 rounded-base border flex items-center gap-3" style={{ borderColor: theme.border, background: theme.subtleBg }}>
                      {f.type === 'link' ? <Link2 className="w-4 h-4" style={{ color: theme.mutedText }} /> : <File className="w-4 h-4" style={{ color: theme.mutedText }} />}
                      <div className="min-w-0 flex-1">
                        <Text className="truncate">{f.name}</Text>
                        <Text variant="sm" className="truncate opacity-60">{f.url}</Text>
                      </div>
                      <button type="button" className="p-2 opacity-75 hover:opacity-100" onClick={() => setCopiedItemId(f.id)}>
                        <Copy className="w-4 h-4" />
                      </button>
                      <button type="button" className="p-2 opacity-75 hover:opacity-100" onClick={() => setEditing(f)}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <a href={f.url} target="_blank" rel="noreferrer" className="p-2 opacity-75 hover:opacity-100">
                        <Download className="w-4 h-4" />
                      </a>
                      <button type="button" className="p-2 opacity-75 hover:opacity-100" onClick={() => handleDelete(f.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Modal open={folderModalOpen} onClose={() => setFolderModalOpen(false)}>
        <div className="p-5 space-y-4">
          <Text className="font-semibold">New folder</Text>
          <Input label="Folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="background" onClick={() => setFolderModalOpen(false)} />
            <Button label="Create folder" onClick={handleCreateFolder} disabled={saving || !folderName.trim()} />
          </div>
        </div>
      </Modal>

      <Modal open={linkModalOpen} onClose={() => setLinkModalOpen(false)}>
        <div className="p-5 space-y-4">
          <Text className="font-semibold">Add URL</Text>
          <Input label="Link name" value={linkName} onChange={(e) => setLinkName(e.target.value)} />
          <Input label="Link URL" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="background" onClick={() => setLinkModalOpen(false)} />
            <Button label="Add link" onClick={handleCreateLink} disabled={saving || !linkName.trim() || !linkUrl.trim()} />
          </div>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <div className="p-5 space-y-4">
            <Text className="font-semibold">Edit file</Text>
            <Input label="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            {editing.type !== 'folder' && (
              <Input label="URL" value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} />
            )}
            <div className="flex justify-end gap-2">
              <Button label="Cancel" variant="background" onClick={() => setEditing(null)} />
              <Button
                label="Save"
                onClick={handleSaveEdit}
                disabled={saving || !editing.name.trim() || (editing.type !== 'folder' && !editing.url.trim())}
              />
            </div>
          </div>
        )}
      </Modal>
    </Modal>
  )
}
