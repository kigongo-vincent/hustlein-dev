import { useState } from 'react'
import { Folder } from 'lucide-react'
import type { FileNodeLike } from './projectFilesData'
import { getFileNodeIcon } from './projectFilesData'
import folderIconUrl from '../../assets/fs/folder.svg'

const FOLDER_ICON_URL = folderIconUrl

type FileNodeIconProps = {
  node: FileNodeLike
  size?: 'sm' | 'md' | 'lg'
  accentColor?: string
  className?: string
}


export default function FileNodeIcon({
  node,
  size = 'md',
  accentColor,
  className = '',
}: FileNodeIconProps) {
  const [folderImgError, setFolderImgError] = useState(false)
  const Icon = getFileNodeIcon(node)
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-12 h-12' : 'w-5 h-5'

  if (node.type === 'folder') {
    if (folderImgError) {
      return (
        <Folder
          className={`${sizeClass} shrink-0 opacity-80 ${className}`}
          style={accentColor ? { color: accentColor } : undefined}
        />
      )
    }
    return (
      <img
        src={FOLDER_ICON_URL}
        alt=""
        className={`${sizeClass} shrink-0 object-contain ${className}`}
        onError={() => setFolderImgError(true)}
      />
    )
  }

  return (
    <Icon
      className={`${sizeClass} shrink-0 opacity-80 ${className}`}
      style={accentColor ? { color: accentColor } : undefined}
    />
  )
}
