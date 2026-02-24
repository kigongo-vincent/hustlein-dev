import { projectFileRepo } from '../repos'
import type { ProjectFile } from '../types'

export const projectFileService = {
  async listByProject(projectId: string): Promise<ProjectFile[]> {
    return projectFileRepo.getByProject(projectId)
  },
  async add(payload: Omit<ProjectFile, 'id' | 'createdAt'>): Promise<ProjectFile> {
    return projectFileRepo.create(payload)
  },
  async remove(id: string): Promise<boolean> {
    return projectFileRepo.delete(id)
  },
}
