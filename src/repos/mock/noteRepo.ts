import type { Note } from '../../types'

const data: Note[] = [
  {
    id: 'n1',
    title: 'Meeting recap',
    content: 'Action items: review design, schedule follow-up.',
    color: '#dbeafe',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'n2',
    title: 'Ideas backlog',
    content: 'Feature: dark mode toggle. Research: performance benchmarks.',
    color: '#fef3c7',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'n3',
    title: 'Quick reminder',
    content: 'Call client tomorrow 10am.',
    color: '#d1fae5',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
]

export const noteRepo = {
  async getAll(): Promise<Note[]> {
    return Promise.resolve([...data].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
  },
  async getById(id: string): Promise<Note | null> {
    return Promise.resolve(data.find((n) => n.id === id) ?? null)
  },
  async create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const now = new Date().toISOString()
    const next: Note = { ...note, id: `n${Date.now()}`, createdAt: now, updatedAt: now }
    data.push(next)
    return Promise.resolve(next)
  },
  async update(id: string, patch: Partial<Pick<Note, 'title' | 'content' | 'color'>>): Promise<Note | null> {
    const i = data.findIndex((n) => n.id === id)
    if (i === -1) return Promise.resolve(null)
    const updated = { ...data[i], ...patch, updatedAt: new Date().toISOString() }
    data[i] = updated
    return Promise.resolve(updated)
  },
  async delete(id: string): Promise<boolean> {
    const i = data.findIndex((n) => n.id === id)
    if (i === -1) return Promise.resolve(false)
    data.splice(i, 1)
    return Promise.resolve(true)
  },
}
