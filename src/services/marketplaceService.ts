import { marketplaceRepo } from '../repos'
import type { HireResult, ProjectApplication, ProjectPosting } from '../types'

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
}

