import { assignmentRepo } from '../repos'
import type { MyAssignment } from '../types'

export const assignmentService = {
  async listMine(): Promise<MyAssignment[]> {
    return assignmentRepo.listMine()
  },
}

