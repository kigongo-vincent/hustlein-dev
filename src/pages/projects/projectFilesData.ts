import {
  Folder,
  File,
  FileText,
  Music,
  Video,
  Image as ImageIcon,
} from 'lucide-react'

export type FolderNode = {
  id: string
  name: string
  type: 'folder' | 'file'
  size?: string
  /** Optional body content for note files */
  content?: string
  /** When set, treat as a note and show NoteCard with this color */
  noteColor?: string
  children?: FolderNode[]
}

export const DEMO_FOLDER_TREE: FolderNode[] = [
  {
    id: 'f1',
    name: 'Project files',
    type: 'folder',
    children: [
      {
        id: 'f1-1',
        name: 'Design',
        type: 'folder',
        children: [
          { id: 'f1-1-1', name: 'mockup-v2.fig', type: 'file', size: '4.2 MB' },
          {
            id: 'f1-1-2',
            name: 'assets',
            type: 'folder',
            children: [{ id: 'f1-1-2-1', name: 'logo.png', type: 'file', size: '128 KB' }],
          },
        ],
      },
      {
        id: 'f1-2',
        name: 'Docs',
        type: 'folder',
        children: [
          { id: 'f1-2-1', name: 'brief.pdf', type: 'file', size: '1.2 MB' },
          { id: 'f1-2-2', name: 'scope.docx', type: 'file', size: '245 KB' },
        ],
      },
    ],
  },
]

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

export type FileNodeLike = { name: string; type: string }

export function getFileNodeIcon(node: FileNodeLike): typeof Folder {
  if (node.type === 'folder') return Folder
  const ext = getFileExtension(node.name)
  const musicExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac']
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v']
  const pictureExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'fig', 'ico', 'bmp']
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'md']
  if (musicExts.includes(ext)) return Music
  if (videoExts.includes(ext)) return Video
  if (pictureExts.includes(ext)) return ImageIcon
  if (docExts.includes(ext)) return FileText
  return File
}
