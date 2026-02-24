import type { Comment } from '../../types'

const data: Comment[] = [
  {
    id: 'c1',
    entityType: 'doc',
    entityId: 'p1',
    authorId: 'u2',
    body: 'Kickoff done. Design phase starts next week.',
    createdAt: '2025-01-15T12:00:00Z',
  },
  {
    id: 'c2',
    entityType: 'doc',
    entityId: 'p1',
    authorId: 'u1',
    body: 'Budget and timeline approved. Go ahead with design.',
    createdAt: '2025-01-16T09:00:00Z',
  },
  {
    id: 'c3',
    entityType: 'doc',
    entityId: 'p1',
    authorId: 'u3',
    body: 'Mockups are in the Figma link under Assets.',
    createdAt: '2025-01-19T11:00:00Z',
  },
  {
    id: 'c4',
    entityType: 'task',
    entityId: 't1',
    authorId: 'u4',
    body: 'First draft ready for review.',
    createdAt: '2025-01-25T16:00:00Z',
  },
]

export const commentRepo = {
  async getByEntity(entityType: Comment['entityType'], entityId: string): Promise<Comment[]> {
    return Promise.resolve(
      data
        .filter((c) => c.entityType === entityType && c.entityId === entityId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    )
  },
  async create(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    const next: Comment = {
      ...comment,
      id: `c${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    data.push(next)
    return Promise.resolve(next)
  },
}
