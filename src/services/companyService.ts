import { companyRepo } from '../repos'
import type { Company } from '../types'

export const companyService = {
  async list(): Promise<Company[]> {
    return companyRepo.getAll()
  },
  async get(id: string): Promise<Company | null> {
    return companyRepo.getById(id)
  },
  async create(payload: Omit<Company, 'id' | 'createdAt'>): Promise<Company> {
    return companyRepo.create(payload)
  },
  async update(id: string, payload: Partial<Company>): Promise<Company | null> {
    return companyRepo.update(id, payload)
  },
  async remove(id: string): Promise<boolean> {
    return companyRepo.delete(id)
  },
}
