import { commentRepo } from '../repos'
import type { Comment } from '../types'

export const commentService = {
  async listByEntity(entityType: Comment['entityType'], entityId: string): Promise<Comment[]> {
    return commentRepo.getByEntity(entityType, entityId)
  },
  async add(payload: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    return commentRepo.create(payload)
  },
}
