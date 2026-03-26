import { marketplaceRepo } from '../repos'
import type { ApplicationFile, HireResult, ProjectApplication, ProjectPosting } from '../types'

export const marketplaceService = {
  async listPostings(): Promise<ProjectPosting[]> {
    return marketplaceRepo.listPostings()
  },
  async getPosting(id: string): Promise<ProjectPosting | null> {
    return marketplaceRepo.getPosting(id)
  },
  async createPosting(payload: Parameters<typeof marketplaceRepo.createPosting>[0]): Promise<ProjectPosting> {
    return marketplaceRepo.createPosting(payload)
  },
  async updatePosting(id: string, patch: Parameters<typeof marketplaceRepo.updatePosting>[1]): Promise<ProjectPosting | null> {
    return marketplaceRepo.updatePosting(id, patch)
  },
  async deletePosting(id: string): Promise<boolean> {
    return marketplaceRepo.deletePosting(id)
  },
  async apply(postingId: string, payload: Parameters<typeof marketplaceRepo.apply>[1]): Promise<ProjectApplication> {
    return marketplaceRepo.apply(postingId, payload)
  },
  async listApplications(postingId: string): Promise<ProjectApplication[]> {
    return marketplaceRepo.listApplications(postingId)
  },
  async listMyApplications(): Promise<ProjectApplication[]> {
    return marketplaceRepo.listMyApplications()
  },
  async updateApplicationStatus(applicationId: string, status: ProjectApplication['status']): Promise<ProjectApplication> {
    return marketplaceRepo.updateApplicationStatus(applicationId, status)
  },
  async hire(applicationId: string, payload: Parameters<typeof marketplaceRepo.hire>[1]): Promise<HireResult> {
    return marketplaceRepo.hire(applicationId, payload)
  },
  async listApplicationFiles(applicationId: string): Promise<ApplicationFile[]> {
    return marketplaceRepo.listApplicationFiles(applicationId)
  },
  async uploadApplicationFile(applicationId: string, file: File): Promise<ApplicationFile> {
    return marketplaceRepo.uploadApplicationFile(applicationId, file)
  },
}

