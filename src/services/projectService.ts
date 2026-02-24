import { projectRepo, workflowRepo } from '../repos'
import type { Project, Workflow, WorkflowState } from '../types'

export const projectService = {
  async list(): Promise<Project[]> {
    return projectRepo.getAll()
  },
  async listByCompany(companyId: string): Promise<Project[]> {
    return projectRepo.getByCompany(companyId)
  },
  async listByLead(projectLeadId: string): Promise<Project[]> {
    return projectRepo.getByLead(projectLeadId)
  },
  async get(id: string): Promise<Project | null> {
    return projectRepo.getById(id)
  },
  async getWorkflow(projectId: string): Promise<Workflow | null> {
    return workflowRepo.getByProject(projectId)
  },
  async updateWorkflowStates(projectId: string, states: WorkflowState[]): Promise<Workflow | null> {
    const workflow = await workflowRepo.getByProject(projectId)
    if (!workflow) return null
    return workflowRepo.updateStates(workflow.id, states)
  },
  async create(payload: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    return projectRepo.create(payload)
  },
  async update(id: string, payload: Partial<Project>): Promise<Project | null> {
    return projectRepo.update(id, payload)
  },
  async delete(id: string): Promise<boolean> {
    return projectRepo.delete(id)
  },
}
