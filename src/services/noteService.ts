import { noteRepo } from '../repos'
import type { Note } from '../types'

export const noteService = {
  async list(): Promise<Note[]> {
    return noteRepo.getAll()
  },
  async getById(id: string): Promise<Note | null> {
    return noteRepo.getById(id)
  },
  async create(payload: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    return noteRepo.create(payload)
  },
  async update(id: string, patch: Partial<Pick<Note, 'title' | 'content' | 'color'>>): Promise<Note | null> {
    return noteRepo.update(id, patch)
  },
  async remove(id: string): Promise<boolean> {
    return noteRepo.delete(id)
  },
}
