import { departmentRepo } from '../repos'
import type { Department } from '../types'

export const departmentService = {
  async listByCompany(companyId: string): Promise<Department[]> {
    return departmentRepo.listByCompany(companyId)
  },
  async create(payload: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> {
    return departmentRepo.create(payload)
  },
  async update(id: string, patch: Partial<Department>): Promise<Department | null> {
    return departmentRepo.update(id, patch)
  },
  async remove(id: string): Promise<boolean> {
    return departmentRepo.remove(id)
  },
}

