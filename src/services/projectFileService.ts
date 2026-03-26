import { projectFileRepo } from '../repos'
import { endpoints } from '../api'
import { getStoredToken } from '../api/client'
import type { ProjectFile, ProjectFileStorageSummary } from '../types'

export const projectFileService = {
  async listByProject(projectId: string): Promise<ProjectFile[]> {
    return projectFileRepo.getByProject(projectId)
  },
  async treeByProject(projectId: string): Promise<ProjectFile[]> {
    return projectFileRepo.getTreeByProject(projectId)
  },
  async storageSummary(projectId: string): Promise<ProjectFileStorageSummary> {
    return projectFileRepo.getStorageSummary(projectId)
  },
  async add(payload: Omit<ProjectFile, 'id' | 'createdAt'>): Promise<ProjectFile> {
    return projectFileRepo.create(payload)
  },
  async update(id: string, patch: Partial<Pick<ProjectFile, 'name' | 'url'>>): Promise<ProjectFile | null> {
    return projectFileRepo.update(id, patch)
  },
  async remove(id: string): Promise<boolean> {
    return projectFileRepo.delete(id)
  },
  async move(id: string, parentId?: string): Promise<ProjectFile | null> {
    return projectFileRepo.move(id, parentId)
  },
  async upload(projectId: string, file: File, parentId?: string): Promise<ProjectFile> {
    const token = getStoredToken()
    const body = new FormData()
    body.append('file', file)
    if (parentId) body.append('parentId', parentId)
    const res = await fetch(endpoints.projectFileUpload(projectId), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
    })
    const data = (await res.json()) as ProjectFile | { error?: string }
    if (!res.ok) {
      const err = typeof data === 'object' && data && 'error' in data ? data.error : `Upload failed (${res.status})`
      throw new Error(String(err || 'Upload failed'))
    }
    return data as ProjectFile
  },
}
