import { useState, useMemo, useEffect, useRef } from 'react'
import {
  LayoutGrid,
  List,
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Menu,
  X,
  RefreshCw,
  Upload,
  FolderPlus,
  FilePlus,
  Link2,
  Clipboard,
  Copy,
  StickyNote,
  Search,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Modal, Button, Input, RichTextEditor, NoteCard } from '../../components/ui'
import Text, { baseFontSize } from '../../components/base/Text'
import { Themestore } from '../../data/Themestore'
import { NOTE_COLORS } from '../../types'
import type { NoteColor } from '../../types'
import type { FolderNode } from './projectFilesData'
import { DEMO_FOLDER_TREE } from './projectFilesData'
import FileNodeIcon from './FileNodeIcon'

export type ProjectFilesModalProps = {
  open: boolean
  onClose: () => void
}

function findNode(nodes: FolderNode[], id: string): FolderNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

function getPathToNode(nodes: FolderNode[], id: string, path: string[] = []): string[] | null {
  for (const n of nodes) {
    const p = [...path, n.name]
    if (n.id === id) return p
    if (n.children) {
      const found = getPathToNode(n.children, id, p)
      if (found) return found
    }
  }
  return null
}

const DEFAULT_STORAGE_MB = 512
const TOTAL_STORAGE_BYTES = DEFAULT_STORAGE_MB * 1024 * 1024

/** Parse size strings like "4.2 MB", "128 KB", "0 B" to bytes. "Link" or invalid returns 0. */
function parseSizeToBytes(size: string | undefined): number {
  if (!size || typeof size !== 'string') return 0
  const s = size.trim()
  if (/^[\d.]+\s*MB$/i.test(s)) return parseFloat(s) * 1024 * 1024
  if (/^[\d.]+\s*KB$/i.test(s)) return parseFloat(s) * 1024
  if (/^[\d.]+\s*B$/i.test(s)) return parseFloat(s)
  return 0
}

function sumFileSizesInTree(nodes: FolderNode[]): number {
  let sum = 0
  for (const n of nodes) {
    if (n.type === 'file') sum += parseSizeToBytes(n.size)
    if (n.children) sum += sumFileSizesInTree(n.children)
  }
  return sum
}

type ContextAction = 'copy' | 'refresh' | 'paste' | 'upload' | 'newFolder' | 'newNote' | 'addUrl'

const FOLDER_CONTEXT_MENU_ITEMS: { icon: typeof RefreshCw; label: string; action: ContextAction }[] = [
  { icon: Copy, label: 'Copy', action: 'copy' },
  { icon: RefreshCw, label: 'Refresh', action: 'refresh' },
  { icon: Clipboard, label: 'Paste', action: 'paste' },
  { icon: Upload, label: 'Upload File', action: 'upload' },
  { icon: FolderPlus, label: 'New Folder', action: 'newFolder' },
  { icon: StickyNote, label: 'New Note', action: 'newNote' },
  { icon: Link2, label: 'Add URL', action: 'addUrl' },
]

function cloneTree(nodes: FolderNode[]): FolderNode[] {
  return nodes.map((n) => ({ ...n, children: n.children ? cloneTree(n.children) : undefined }))
}

function addChildToTree(nodes: FolderNode[], parentId: string, child: FolderNode): FolderNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), child] }
    }
    if (node.children) {
      return { ...node, children: addChildToTree(node.children, parentId, child) }
    }
    return node
  })
}

function updateNodeInTree(nodes: FolderNode[], nodeId: string, patch: Partial<FolderNode>): FolderNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) return { ...node, ...patch }
    if (node.children) return { ...node, children: updateNodeInTree(node.children, nodeId, patch) }
    return node
  })
}

/** Deep-clone a node and assign new unique ids to it and all descendants (for copy/paste). */
function cloneNodeWithNewIds(node: FolderNode): FolderNode {
  const id = `paste-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return {
    ...node,
    id,
    children: node.children?.map((c) => cloneNodeWithNewIds(c)) ?? undefined,
  }
}

export default function ProjectFilesModal({ open, onClose }: ProjectFilesModalProps) {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const bg = current?.system?.background
  const borderColor = current?.system?.border
  const secondaryColor = current?.brand?.secondary ?? '#FF9600'

  const [message, setMessage] = useState<string | null>(null)
  const [folderExpanded, setFolderExpanded] = useState<Set<string>>(new Set(['f1', 'f1-1', 'f1-2']))
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>('f1')
  const [folderViewMode, setFolderViewMode] = useState<'grid' | 'list'>('grid')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string | null } | null>(null)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [folderOrder, setFolderOrder] = useState<Record<string, string[]>>({})
  const [visitedFolderIds, setVisitedFolderIds] = useState<string[]>(['f1'])
  const [pathSearchInput, setPathSearchInput] = useState('')
  const [pathDropdownOpen, setPathDropdownOpen] = useState(false)
  const [folderTree, setFolderTree] = useState<FolderNode[]>(() => cloneTree(DEMO_FOLDER_TREE))
  const [copiedNode, setCopiedNode] = useState<FolderNode | null>(null)
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['f1'])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  /** Which toolbar opened the more-options menu: View Settings row vs path bar. */
  const [moreMenuSection, setMoreMenuSection] = useState<'viewSettings' | 'pathBar' | null>(null)
  type InputModalConfig = {
    title: string
    fields: { label: string; key: string; placeholder: string; defaultValue: string }[]
    onSubmit: (values: Record<string, string>) => void
  }
  const [inputModal, setInputModal] = useState<InputModalConfig | null>(null)
  const [inputModalValues, setInputModalValues] = useState<Record<string, string>>({})
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [editingNoteNodeId, setEditingNoteNodeId] = useState<string | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteColor, setNoteColor] = useState<NoteColor>(NOTE_COLORS[0])
  const pathSearchRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pathDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (pathSearchRef.current && !pathSearchRef.current.contains(e.target as Node)) {
        setPathDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [pathDropdownOpen])

  const toggleFolder = (id: string) => {
    setFolderExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedFolder = selectedFolderId ? findNode(folderTree, selectedFolderId) : null
  const folderPath = selectedFolderId ? getPathToNode(folderTree, selectedFolderId) : []

  const navigateTo = (id: string) => {
    setSelectedFolderId(id)
    setNavigationHistory((prev) => {
      const next = [...prev.slice(0, historyIndex + 1), id]
      setHistoryIndex(next.length - 1)
      return next
    })
  }

  const goBack = () => {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    setHistoryIndex(nextIndex)
    setSelectedFolderId(navigationHistory[nextIndex])
  }

  const goForward = () => {
    if (historyIndex >= navigationHistory.length - 1) return
    const nextIndex = historyIndex + 1
    setHistoryIndex(nextIndex)
    setSelectedFolderId(navigationHistory[nextIndex])
  }

  // Track visited folders when navigating (for path search)
  useEffect(() => {
    if (!selectedFolderId) return
    setVisitedFolderIds((prev) => {
      const next = prev.filter((id) => id !== selectedFolderId)
      next.push(selectedFolderId)
      return next
    })
  }, [selectedFolderId])

  const visitedPaths = useMemo(() => {
    return visitedFolderIds
      .map((id) => {
        const path = getPathToNode(folderTree, id)
        return path ? { id, path } : null
      })
      .filter((p): p is { id: string; path: string[] } => p !== null)
  }, [visitedFolderIds, folderTree])

  const pathSearchMatches = useMemo(() => {
    const q = pathSearchInput.trim().toLowerCase()
    if (!q) return visitedPaths
    return visitedPaths.filter((p) => p.path.join(' ').toLowerCase().includes(q))
  }, [visitedPaths, pathSearchInput])

  const storageUsedBytes = useMemo(() => sumFileSizesInTree(folderTree), [folderTree])
  const storageUsedMB = Math.round((storageUsedBytes / (1024 * 1024)) * 10) / 10
  const storageLeftBytes = Math.max(0, TOTAL_STORAGE_BYTES - storageUsedBytes)
  const storageLeftMB = Math.round((storageLeftBytes / (1024 * 1024)) * 10) / 10
  const storageUsageFraction = Math.min(1, storageUsedBytes / TOTAL_STORAGE_BYTES)

  const rawFolderContents = selectedFolder?.type === 'folder' ? selectedFolder.children ?? [] : []
  const currentFolderContents = useMemo(() => {
    const order = selectedFolderId ? folderOrder[selectedFolderId] : undefined
    if (!order?.length) return rawFolderContents
    const byId = new Map(rawFolderContents.map((n) => [n.id, n]))
    const ordered: FolderNode[] = []
    for (const id of order) {
      const n = byId.get(id)
      if (n) ordered.push(n)
    }
    for (const n of rawFolderContents) {
      if (!order.includes(n.id)) ordered.push(n)
    }
    return ordered
  }, [rawFolderContents, selectedFolderId, folderOrder])

  const handleFolderContentDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id || !selectedFolderId) return
    setDraggedNodeId(null)
    const ids = currentFolderContents.map((n) => n.id)
    const from = ids.indexOf(id)
    if (from === -1) return
    const next = [...ids]
    next.splice(from, 1)
    next.splice(dropIndex, 0, id)
    setFolderOrder((prev) => ({ ...prev, [selectedFolderId]: next }))
  }

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    const handleClick = (e: MouseEvent) => {
      if (!contextMenuRef.current?.contains(e.target as Node)) close()
    }
    const handleContextMenu = () => close()
    const handleTouchStart = (e: TouchEvent) => {
      if (!contextMenuRef.current?.contains(e.target as Node)) close()
    }
    window.addEventListener('click', handleClick)
    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('touchstart', handleTouchStart)
    }
  }, [contextMenu])

  const doRefresh = () => {
    setRefreshing(true)
    setMessage('Refreshing…')
    setTimeout(() => {
      setRefreshing(false)
      setMessage('Refreshed.')
    }, 600)
  }

  const doCopy = (nodeId: string | null) => {
    if (!nodeId) {
      setMessage('Select a file or folder to copy.')
      return
    }
    const node = findNode(folderTree, nodeId)
    if (!node) {
      setMessage('Could not find item to copy.')
      return
    }
    setCopiedNode(cloneNodeWithNewIds(node))
    setMessage(`Copied "${node.name}".`)
  }

  const doPaste = () => {
    if (copiedNode) {
      if (!selectedFolderId) {
        setMessage('Select a folder to paste into.')
        return
      }
      const newNode = cloneNodeWithNewIds(copiedNode)
      setFolderTree((prev) => addChildToTree(prev, selectedFolderId, newNode))
      setFolderExpanded((prev) => new Set(prev).add(selectedFolderId))
      setMessage(`Pasted "${newNode.name}".`)
      return
    }
    // Fallback: paste text from system clipboard
    if (!navigator.clipboard?.readText) {
      setMessage('Copy a file or folder first, or allow clipboard access.')
      return
    }
    navigator.clipboard
      .readText()
      .then((text) => {
        setMessage(text ? `Pasted text: ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}` : 'Clipboard is empty.')
      })
      .catch(() => {
        setMessage('Paste failed. Copy a file or folder first, or allow clipboard access.')
      })
  }

  const doUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !selectedFolderId) return
    const id = `new-file-${Date.now()}`
    const size = file.size < 1024 ? `${file.size} B` : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    setFolderTree((prev) =>
      addChildToTree(prev, selectedFolderId, { id, name: file.name, type: 'file', size })
    )
    setFolderExpanded((prev) => new Set(prev).add(selectedFolderId))
    setMessage(`Uploaded "${file.name}".`)
  }

  const openInputModal = (config: InputModalConfig) => {
    const values: Record<string, string> = {}
    config.fields.forEach((f) => { values[f.key] = f.defaultValue })
    setInputModalValues(values)
    setInputModal(config)
  }

  const closeInputModal = () => setInputModal(null)

  const doNewFolder = () => {
    if (!selectedFolderId) return
    openInputModal({
      title: 'New folder',
      fields: [{ label: 'Folder name', key: 'name', placeholder: 'New folder', defaultValue: 'New folder' }],
      onSubmit: (values) => {
        const name = values.name?.trim()
        if (!name) return
        const id = `new-folder-${Date.now()}`
        setFolderTree((prev) =>
          addChildToTree(prev, selectedFolderId, { id, name, type: 'folder', children: [] })
        )
        setFolderExpanded((prev) => new Set(prev).add(selectedFolderId))
        setMessage(`Created folder "${name}".`)
        closeInputModal()
      },
    })
  }

  const doNewNote = () => {
    if (!selectedFolderId) return
    setEditingNoteNodeId(null)
    setNoteTitle('Untitled note')
    setNoteBody('')
    setNoteColor(NOTE_COLORS[0])
    setNoteModalOpen(true)
  }

  const openEditNote = (node: FolderNode) => {
    setEditingNoteNodeId(node.id)
    setNoteTitle(node.name)
    setNoteBody(node.content ?? '')
    setNoteColor((node.noteColor ?? NOTE_COLORS[0]) as NoteColor)
    setNoteModalOpen(true)
  }

  const submitNote = () => {
    const name = noteTitle?.trim() || 'Untitled note'
    if (editingNoteNodeId) {
      updateNoteInTree(editingNoteNodeId, { name, content: noteBody?.trim() || undefined, noteColor })
      setMessage(`Updated "${name}".`)
    } else if (selectedFolderId) {
      const id = `new-note-${Date.now()}`
      setFolderTree((prev) =>
        addChildToTree(prev, selectedFolderId, {
          id,
          name,
          type: 'file',
          size: '0 B',
          content: noteBody?.trim() || undefined,
          noteColor,
        })
      )
      setMessage(`Created "${name}".`)
    }
    setNoteModalOpen(false)
  }

  const updateNoteInTree = (nodeId: string, patch: Partial<Pick<FolderNode, 'noteColor' | 'content' | 'name'>>) => {
    setFolderTree((prev) => updateNodeInTree(prev, nodeId, patch))
  }

  const doAddUrl = () => {
    if (!selectedFolderId) return
    openInputModal({
      title: 'Add URL',
      fields: [
        { label: 'URL', key: 'url', placeholder: 'https://', defaultValue: 'https://' },
        { label: 'Link name', key: 'name', placeholder: 'Link', defaultValue: 'Link' },
      ],
      onSubmit: (values) => {
        const url = values.url?.trim()
        if (!url) return
        let defaultName = 'Link'
        try {
          defaultName = new URL(url).hostname || defaultName
        } catch {
          defaultName = url.slice(0, 30)
        }
        const name = values.name?.trim() || defaultName
        const id = `new-link-${Date.now()}`
        setFolderTree((prev) =>
          addChildToTree(prev, selectedFolderId, { id, name, type: 'file', size: 'Link' })
        )
        setFolderExpanded((prev) => new Set(prev).add(selectedFolderId))
        setMessage(`Added link "${name}".`)
        closeInputModal()
      },
    })
  }

  const runContextAction = (action: ContextAction, nodeId?: string | null) => {
    switch (action) {
      case 'copy':
        doCopy(nodeId ?? contextMenu?.nodeId ?? null)
        break
      case 'refresh':
        doRefresh()
        break
      case 'paste':
        doPaste()
        break
      case 'upload':
        doUpload()
        break
      case 'newFolder':
        doNewFolder()
        break
      case 'newNote':
        doNewNote()
        break
      case 'addUrl':
        doAddUrl()
        break
    }
  }

  const openContextMenu = (e: React.MouseEvent, nodeId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: nodeId ?? null })
  }

  const renderFolderTree = (nodes: FolderNode[], depth: number, accentColor: string = secondaryColor) => (
    <ul className="list-none pl-0">
      {nodes.map((node) => (
        <li key={node.id}>
          {node.type === 'folder' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  toggleFolder(node.id)
                  navigateTo(node.id)
                }}
                onContextMenu={(e) => openContextMenu(e, node.id)}
                className="w-full flex items-center gap-2 py-2 px-2 rounded-base text-left hover:opacity-90"
                style={{
                  paddingLeft: `${depth * 12 + 8}px`,
                  color: dark,
                  backgroundColor: selectedFolderId === node.id ? accentColor + '18' : 'transparent',
                }}
              >
                {folderExpanded.has(node.id) ? (
                  <ChevronDown className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                )}
                <FileNodeIcon node={node} size="sm" accentColor={depth === 0 ? accentColor : undefined} />
                <span className="truncate flex-1">{node.name}</span>
              </button>
              {folderExpanded.has(node.id) && node.children && node.children.length > 0 && (
                <div>{renderFolderTree(node.children, depth + 1, accentColor)}</div>
              )}
            </>
          ) : (
            <a
              href="#"
              onContextMenu={(e) => openContextMenu(e, node.id)}
              className="flex items-center gap-2 py-2 px-2 rounded-base text-left hover:opacity-90"
              style={{ paddingLeft: `${depth * 12 + 8}px`, color: dark }}
            >
              <span className="w-4 shrink-0" />
              <FileNodeIcon node={node} size="sm" />
              <span className="truncate flex-1">{node.name}</span>
              {node.size && (
                <span className="text-sm opacity-70 shrink-0">{node.size}</span>
              )}
            </a>
          )}
        </li>
      ))}
    </ul>
  )

  const handleClose = () => {
    setMessage(null)
    setCopiedNode(null)
    onClose()
  }

  return (
    <>
    <Modal open={open} onClose={handleClose} variant="wide">
      <div
        className="flex flex-col w-full min-h-[80vh] max-h-[95vh]"
        style={{ backgroundColor: current?.system?.foreground }}
      >
        <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b" style={{ borderColor: borderColor }}>
          <h2 className="font-semibold" style={{ fontSize: baseFontSize * 1.2, color: dark }}>
            Project files
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-3 rounded-base opacity-80 hover:opacity-100 flex items-center justify-center"
            style={{ color: dark }}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
          <aside
            className="w-[220px] shrink-0 border-r flex flex-col min-h-0"
            style={{ borderColor: borderColor, backgroundColor: bg }}
          >
            <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ color: dark }}>
              <FileNodeIcon node={{ name: '', type: 'folder' }} size="sm" accentColor={secondaryColor} />
              <span className="font-medium truncate text-sm">Project files</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto scroll-slim py-2">
              {renderFolderTree(folderTree, 0, secondaryColor)}
            </div>
            <div className="shrink-0 px-3 py-3 pt-2 border-t flex flex-col gap-1.5" style={{ borderColor: borderColor }}>
              <div className="flex items-center justify-between gap-2 text-sm" style={{ color: dark }}>
                <span className="opacity-80 truncate text-xs">
                  {storageUsedMB} MB used · {storageLeftMB} MB left
                </span>
                <span className="opacity-70 shrink-0 text-xs">
                  {storageUsedMB} / {DEFAULT_STORAGE_MB} MB
                </span>
              </div>
              <div
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: borderColor ?? 'rgba(0,0,0,0.12)' }}
                role="progressbar"
                aria-valuenow={Math.round(storageUsageFraction * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Storage usage"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${storageUsageFraction * 100}%`,
                    backgroundColor: storageUsageFraction > 0.9 ? (current?.system?.error ?? '#c00') : secondaryColor,
                  }}
                />
              </div>
            </div>
          </aside>
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            {message && (
              <div className="shrink-0 mx-3 mt-2 px-3 py-2 rounded-base text-sm" style={{ backgroundColor: bg, color: dark }}>
                {message}
              </div>
            )}
            <div className="flex items-center justify-between shrink-0 px-3 py-2 border-b" style={{ borderColor: borderColor }}>
              <div className="flex items-center gap-2" style={{ color: dark }}>
                <Settings className="w-4 h-4 shrink-0 opacity-80" />
                <Text variant="sm">View Settings</Text>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-2 rounded-base"
                  style={{
                    color: folderViewMode === 'grid' ? secondaryColor : dark,
                    backgroundColor: folderViewMode === 'grid' ? secondaryColor + '20' : 'transparent',
                  }}
                  onClick={() => setFolderViewMode('grid')}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-base"
                  style={{
                    color: folderViewMode === 'list' ? secondaryColor : dark,
                    backgroundColor: folderViewMode === 'list' ? secondaryColor + '20' : 'transparent',
                  }}
                  onClick={() => setFolderViewMode('list')}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button
                    type="button"
                    className="p-2 rounded-base opacity-80 hover:opacity-100"
                    style={{ color: dark }}
                    title="More options"
                    onClick={() => {
                      setMoreMenuSection('viewSettings')
                      setMoreMenuOpen((prev) => !prev)
                    }}
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {moreMenuOpen && moreMenuSection === 'viewSettings' && (
                      <>
                        <div className="fixed inset-0 z-[99]" aria-hidden onClick={() => { setMoreMenuOpen(false); setMoreMenuSection(null) }} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-full mt-1 py-1 rounded-lg border shadow-lg z-[100] min-w-[180px]"
                          style={{
                            backgroundColor: current?.system?.foreground ?? '#fff',
                            borderColor: borderColor ?? 'rgba(0,0,0,0.1)',
                          }}
                        >
                          {FOLDER_CONTEXT_MENU_ITEMS.map((item, i) => (
                            <button
                              key={i}
                              type="button"
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:opacity-90"
                              style={{ fontSize: baseFontSize, lineHeight: 1.5, color: dark }}
                              onClick={() => {
                                setMoreMenuOpen(false)
                                setMoreMenuSection(null)
                                runContextAction(item.action, null)
                              }}
                            >
                              <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 px-3 py-2 border-b" style={{ borderColor: borderColor }}>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple={false}
                onChange={handleFileSelect}
              />
              <button type="button" className="p-2 rounded-base" style={{ color: secondaryColor, backgroundColor: secondaryColor + '18' }} title="Home" onClick={() => navigateTo('f1')}>
                <Home className="w-4 h-4" />
              </button>
              <button type="button" className="p-2 rounded-base opacity-70 hover:opacity-100 disabled:opacity-40" style={{ color: dark }} title="Back" onClick={goBack} disabled={historyIndex <= 0}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" className="p-2 rounded-base opacity-70 hover:opacity-100 disabled:opacity-40" style={{ color: dark }} title="Forward" onClick={goForward} disabled={historyIndex >= navigationHistory.length - 1}>
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0 relative flex items-center rounded-base overflow-hidden" style={{ backgroundColor: bg }} ref={pathSearchRef}>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 pointer-events-none shrink-0"
                  style={{ color: dark }}
                  aria-hidden
                />
                <input
                  type="text"
                  value={pathSearchInput}
                  onChange={(e) => {
                    setPathSearchInput(e.target.value)
                    setPathDropdownOpen(true)
                  }}
                  onFocus={() => setPathDropdownOpen(true)}
                  placeholder="Search visited paths…"
                  title={folderPath?.length ? folderPath.join(' \\ ') : undefined}
                  className="w-full py-2 pl-9 pr-3 bg-transparent focus:outline-none focus:ring-0 border-0 placeholder:opacity-60 truncate"
                  style={{
                    fontSize: baseFontSize,
                    lineHeight: 1.5,
                    color: dark,
                  }}
                  aria-label="Search visited paths"
                />
                {pathDropdownOpen && pathSearchMatches.length > 0 && (
                  <ul
                    className="absolute left-0 right-0 top-full mt-1 py-1 rounded-lg border shadow-lg z-10 max-h-48 overflow-y-auto scroll-slim list-none"
                    style={{
                      backgroundColor: current?.system?.foreground ?? '#fff',
                      borderColor: borderColor ?? 'rgba(0,0,0,0.1)',
                    }}
                  >
                    {pathSearchMatches.map(({ id, path }) => (
                      <li key={id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:opacity-90 truncate"
                          style={{ fontSize: baseFontSize, lineHeight: 1.5, color: dark }}
                          onClick={() => {
                            navigateTo(id)
                            setPathSearchInput('')
                            setPathDropdownOpen(false)
                          }}
                        >
                          {path.join(' \\ ')}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 relative">
                {[
                  { Icon: RefreshCw, title: 'Refresh', action: 'refresh' as ContextAction },
                  { Icon: Upload, title: 'Upload', action: 'upload' as ContextAction },
                  { Icon: FolderPlus, title: 'New folder', action: 'newFolder' as ContextAction },
                  { Icon: FilePlus, title: 'New file', action: 'newNote' as ContextAction },
                  { Icon: Link2, title: 'Link', action: 'addUrl' as ContextAction },
                ].map(({ Icon, title, action }, i) => (
                  <button
                    key={i}
                    type="button"
                    className="p-2 rounded-base opacity-80 hover:opacity-100 disabled:opacity-50"
                    style={{ color: dark, backgroundColor: bg }}
                    title={title}
                    disabled={refreshing}
                    onClick={() => runContextAction(action)}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
                <button
                  type="button"
                  className="p-2 rounded-base opacity-80 hover:opacity-100"
                  style={{ color: dark, backgroundColor: bg }}
                  title="More options"
                  onClick={() => {
                    setMoreMenuSection('pathBar')
                    setMoreMenuOpen((prev) => !prev)
                  }}
                >
                  <Menu className="w-4 h-4" />
                </button>
                <AnimatePresence>
                {moreMenuOpen && moreMenuSection === 'pathBar' && (
                  <>
                    <div className="fixed inset-0 z-[99]" aria-hidden onClick={() => { setMoreMenuOpen(false); setMoreMenuSection(null) }} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-1 py-1 rounded-lg border shadow-lg z-[100] min-w-[180px]"
                      style={{
                        backgroundColor: current?.system?.foreground ?? '#fff',
                        borderColor: borderColor ?? 'rgba(0,0,0,0.1)',
                      }}
                    >
                      {FOLDER_CONTEXT_MENU_ITEMS.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:opacity-90"
                          style={{ fontSize: baseFontSize, lineHeight: 1.5, color: dark }}
                          onClick={() => {
                            setMoreMenuOpen(false)
                            setMoreMenuSection(null)
                            runContextAction(item.action, null)
                          }}
                        >
                          <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
                </AnimatePresence>
              </div>
            </div>
            <div
              className="flex-1 min-h-0 overflow-y-auto scroll-slim p-4 relative"
              style={{ backgroundColor: bg }}
              onContextMenu={openContextMenu}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(e) => {
                e.preventDefault()
                handleFolderContentDrop(e, currentFolderContents.length)
              }}
            >
              <AnimatePresence>
                {contextMenu && (
                  <motion.div
                    ref={contextMenuRef}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed z-[100] py-1 rounded-lg shadow-lg border min-w-[180px]"
                    style={{
                      left: contextMenu.x,
                      top: contextMenu.y,
                      backgroundColor: current?.system?.foreground ?? '#fff',
                      borderColor: borderColor ?? 'rgba(0,0,0,0.1)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {FOLDER_CONTEXT_MENU_ITEMS.slice(0, 3).map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:opacity-90"
                        style={{ fontSize: baseFontSize, lineHeight: 1.5, color: dark }}
                        onClick={() => {
                          const nodeId = contextMenu?.nodeId ?? null
                          setContextMenu(null)
                          runContextAction(item.action, nodeId)
                        }}
                      >
                        <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                    <div className="my-1 border-t" style={{ borderColor: borderColor }} />
                    {FOLDER_CONTEXT_MENU_ITEMS.slice(3, 7).map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:opacity-90"
                        style={{ fontSize: baseFontSize, lineHeight: 1.5, color: dark }}
                        onClick={() => {
                          const nodeId = contextMenu?.nodeId ?? null
                          setContextMenu(null)
                          runContextAction(item.action, nodeId)
                        }}
                      >
                        <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {folderViewMode === 'grid' ? (
                <div
                  className="grid grid-cols-4 sm:grid-cols-6 gap-4 min-h-full"
                  onContextMenu={openContextMenu}
                >
                  {currentFolderContents.map((node, index) => (
                    <div
                      key={node.id}
                      draggable
                      onContextMenu={(e) => openContextMenu(e, node.id)}
                      onDragStart={(e) => {
                        setDraggedNodeId(node.id)
                        e.dataTransfer.setData('text/plain', node.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => setDraggedNodeId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleFolderContentDrop(e, index)
                      }}
                      className={`flex flex-col items-stretch gap-2 rounded-lg cursor-grab active:cursor-grabbing ${draggedNodeId === node.id ? 'opacity-50' : 'hover:opacity-95'} ${node.noteColor ? 'min-w-[140px]' : ''}`}
                      style={{ color: dark }}
                    >
                      {node.noteColor != null ? (
                        <NoteCard
                          title={node.name}
                          content={node.content ?? ''}
                          color={node.noteColor}
                          variant="full"
                          showColorPicker={true}
                          onColorChange={(c) => updateNoteInTree(node.id, { noteColor: c })}
                          onClick={() => openEditNote(node)}
                        />
                      ) : (
                        <button
                          type="button"
                          className="flex flex-col items-center gap-2 w-full p-4"
                          onClick={() => node.type === 'folder' && navigateTo(node.id)}
                        >
                          <FileNodeIcon node={node} size="lg" accentColor={node.type === 'folder' ? secondaryColor : undefined} />
                          <Text variant="sm" className="truncate w-full text-center">{node.name}</Text>
                          {node.type === 'file' && node.size && (
                            <Text variant="sm" className="opacity-70">{node.size}</Text>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <ul
                  className="list-none py-0 min-h-full"
                  onContextMenu={openContextMenu}
                >
                  {currentFolderContents.map((node, index) => (
                    <li
                      key={node.id}
                      draggable
                      onContextMenu={(e) => openContextMenu(e, node.id)}
                      onDragStart={(e) => {
                        setDraggedNodeId(node.id)
                        e.dataTransfer.setData('text/plain', node.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => setDraggedNodeId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleFolderContentDrop(e, index)
                      }}
                      className={`cursor-grab active:cursor-grabbing ${draggedNodeId === node.id ? 'opacity-50' : ''}`}
                    >
                      {node.noteColor != null ? (
                        <div className="w-full py-1.5">
                          <NoteCard
                            title={node.name}
                            content={node.content ?? ''}
                            color={node.noteColor}
                            variant="compact"
                            showColorPicker={true}
                            onColorChange={(c) => updateNoteInTree(node.id, { noteColor: c })}
                            onClick={() => openEditNote(node)}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 py-2.5 px-2 rounded-base text-left hover:opacity-90"
                          style={{ color: dark }}
                          onClick={() => node.type === 'folder' && navigateTo(node.id)}
                        >
                          <FileNodeIcon node={node} size="md" accentColor={node.type === 'folder' ? secondaryColor : undefined} />
                          <span className="truncate flex-1">{node.name}</span>
                          {node.type === 'file' && node.size && (
                            <Text variant="sm" className="opacity-70 shrink-0">{node.size}</Text>
                          )}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {currentFolderContents.length === 0 && (
                <div
                  className="flex flex-col items-center justify-center py-12 opacity-60 min-h-full w-full"
                  style={{ color: dark }}
                  onContextMenu={openContextMenu}
                >
                  <FileNodeIcon node={{ name: '', type: 'folder' }} size="lg" accentColor={secondaryColor} className="mb-2 opacity-50" />
                  <Text variant="sm">This folder is empty</Text>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <Modal open={!!inputModal} onClose={closeInputModal} closeOnBackdrop>
      {inputModal && (
        <div className="p-5 flex flex-col gap-4" style={{ backgroundColor: current?.system?.foreground }}>
          <h3 className="font-semibold" style={{ fontSize: baseFontSize * 1.15, color: dark }}>
            {inputModal.title}
          </h3>
          <div className="flex flex-col gap-4">
            {inputModal.fields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type="text"
                placeholder={field.placeholder}
                value={inputModalValues[field.key] ?? ''}
                onChange={(e) =>
                  setInputModalValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                autoFocus={field.key === inputModal.fields[0].key}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="background" label="Cancel" onClick={closeInputModal} />
            <Button
              label="Create"
              onClick={() => inputModal.onSubmit(inputModalValues)}
            />
          </div>
        </div>
      )}
    </Modal>

    <Modal open={noteModalOpen} onClose={() => setNoteModalOpen(false)} closeOnBackdrop variant="wide">
      <div
        className="p-6 flex flex-col gap-4 min-h-0 max-h-[85vh] overflow-y-auto scroll-slim"
        style={{ backgroundColor: current?.system?.foreground }}
      >
        <h3 className="font-semibold shrink-0" style={{ fontSize: baseFontSize * 1.15, color: dark }}>
          {editingNoteNodeId ? 'Edit note' : 'New note'}
        </h3>
        <Input
          label="Title"
          type="text"
          placeholder="Untitled note"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          labelBackgroundColor={current?.system?.foreground}
        />
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Text variant="sm" className="font-medium opacity-90" style={{ color: dark }}>
              Background
            </Text>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNoteColor(c)}
                  className="w-7 h-7 rounded-base border-2 shrink-0"
                  style={{
                    backgroundColor: c,
                    borderColor: noteColor === c ? (current?.brand?.primary ?? '#682308') : 'transparent',
                  }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <RichTextEditor
            label=""
            placeholder="Write your note… Headings, lists, quotes, code blocks and links are supported."
            value={noteBody}
            onChange={setNoteBody}
            minHeight="220px"
            toolbarPreset="full"
            mode="fill"
            borderless
            contentBackgroundColor={noteColor}
            contentFontFamily="'Comic Sans MS', 'Comic Neue', Chalkboard, cursive"
            contentFontSize={16}
            enableMentions
            className="min-h-0 flex flex-col [&>div]:min-h-0 [&>div]:flex-1 [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror]:flex-1"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1 shrink-0">
          <Button variant="background" label="Cancel" onClick={() => setNoteModalOpen(false)} />
          <Button label={editingNoteNodeId ? 'Save' : 'Create'} onClick={submitNote} />
        </div>
      </div>
    </Modal>
    </>
  )
}
