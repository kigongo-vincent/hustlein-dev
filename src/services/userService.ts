import { userRepo } from '../repos'
import type { User } from '../types'

export const userService = {
  async list(): Promise<User[]> {
    return userRepo.getAll()
  },
  async get(id: string): Promise<User | null> {
    return userRepo.getById(id)
  },
  async getByCompany(companyId: string): Promise<User[]> {
    return userRepo.getByCompany(companyId)
  },
  async getByEmail(email: string): Promise<User | null> {
    return userRepo.getByEmail(email)
  },
  async create(payload: Omit<User, 'id'>): Promise<User> {
    return userRepo.create(payload)
  },
  async update(id: string, payload: Partial<User>): Promise<User | null> {
    return userRepo.update(id, payload)
  },
}
