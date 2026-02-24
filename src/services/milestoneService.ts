import { milestoneRepo } from '../repos'
import type { Milestone } from '../types'

export const milestoneService = {
  async list(): Promise<Milestone[]> {
    return milestoneRepo.getAll()
  },
  async listByProject(projectId: string): Promise<Milestone[]> {
    return milestoneRepo.getByProject(projectId)
  },
  async get(id: string): Promise<Milestone | null> {
    return milestoneRepo.getById(id)
  },
  async create(payload: Omit<Milestone, 'id' | 'createdAt'>): Promise<Milestone> {
    return milestoneRepo.create(payload)
  },
  async update(id: string, payload: Partial<Milestone>): Promise<Milestone | null> {
    return milestoneRepo.update(id, payload)
  },
  async remove(id: string): Promise<boolean> {
    return milestoneRepo.delete(id)
  },
}
