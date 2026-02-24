import type { ProjectFile } from '../../types'

const data: ProjectFile[] = [
  {
    id: 'f1',
    projectId: 'p1',
    name: 'Brand guidelines.pdf',
    type: 'file',
    url: 'https://example.com/files/brand.pdf',
    uploadedById: 'u2',
    createdAt: '2025-01-16T10:00:00Z',
  },
  {
    id: 'f2',
    projectId: 'p1',
    name: 'Figma design link',
    type: 'link',
    url: 'https://figma.com/file/abc',
    uploadedById: 'u3',
    createdAt: '2025-01-18T14:00:00Z',
  },
  {
    id: 'f3',
    projectId: 'p2',
    name: 'Campaign assets folder',
    type: 'link',
    url: 'https://drive.google.com/drive/folders/xyz',
    uploadedById: 'u2',
    createdAt: '2025-02-02T09:00:00Z',
  },
]

export const projectFileRepo = {
  async getById(id: string): Promise<ProjectFile | null> {
    return Promise.resolve(data.find((f) => f.id === id) ?? null)
  },
  async getByProject(projectId: string): Promise<ProjectFile[]> {
    return Promise.resolve(data.filter((f) => f.projectId === projectId))
  },
  async create(file: Omit<ProjectFile, 'id' | 'createdAt'>): Promise<ProjectFile> {
    const next: ProjectFile = {
      ...file,
      id: `f${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    data.push(next)
    return Promise.resolve(next)
  },
  async delete(id: string): Promise<boolean> {
    const i = data.findIndex((f) => f.id === id)
    if (i === -1) return Promise.resolve(false)
    data.splice(i, 1)
    return Promise.resolve(true)
  },
}
