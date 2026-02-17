import { taskRepo } from '../repos'
import type { Task } from '../types'

export const taskService = {
  async list(): Promise<Task[]> {
    return taskRepo.getAll()
  },
  async listByProject(projectId: string): Promise<Task[]> {
    return taskRepo.getByProject(projectId)
  },
  async listByMilestone(milestoneId: string): Promise<Task[]> {
    return taskRepo.getByMilestone(milestoneId)
  },
  async listByOwner(ownerId: string): Promise<Task[]> {
    return taskRepo.getByOwner(ownerId)
  },
  async get(id: string): Promise<Task | null> {
    return taskRepo.getById(id)
  },
  async create(payload: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    return taskRepo.create(payload)
  },
  async update(id: string, payload: Partial<Task>): Promise<Task | null> {
    return taskRepo.update(id, payload)
  },
  async remove(id: string): Promise<boolean> {
    return taskRepo.delete(id)
  },
}
