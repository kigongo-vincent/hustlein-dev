import { assignmentRepo } from '../repos'
import type { MyAssignment, ProjectAssignment } from '../types'

export const assignmentService = {
  async listMine(): Promise<MyAssignment[]> {
    return assignmentRepo.listMine()
  },
  async listByProject(projectId: string): Promise<ProjectAssignment[]> {
    return assignmentRepo.listByProject(projectId)
  },
}

