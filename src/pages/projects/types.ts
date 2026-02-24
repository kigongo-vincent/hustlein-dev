import type { Project } from '../../types'

export type ProjectMember = { id: string; name: string; avatarUrl?: string }

export type ProjectWithMeta = Project & {
  leadName: string
  taskCount: number
  members: ProjectMember[]
}
