import type { Project } from '../../types'

const data: Project[] = [
  {
    id: 'p1',
    companyId: 'c1',
    name: 'Website Redesign',
    description: 'Full redesign of the company marketing website and blog to align with the new brand guidelines, improve performance, and support upcoming product launches. The project covers discovery and research, information architecture, visual design, content migration from the legacy CMS, and implementation on the new stack. We will deliver a responsive, accessible site with improved SEO, faster load times, and a streamlined content workflow for the marketing team. Success criteria include core web vitals targets, stakeholder sign-off on key pages, and completion of training and handover documentation.',
    projectLeadId: 'u2',
    workflowId: 'w1',
    folderId: 'f1',
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'p2',
    companyId: 'c1',
    name: 'Q1 Campaign',
    description: 'End-to-end launch of the Q1 marketing campaign including strategy, creative production, paid and organic channels, events, and measurement. The campaign will run across web, email, social, and partner channels with a unified message and clear CTAs. Deliverables include campaign brief and calendar, creative assets (banners, copy, landing pages), audience segmentation, launch playbook, and a dashboard for tracking KPIs. We will coordinate with product, sales, and customer success to ensure messaging consistency and alignment with the quarterly business goals.',
    projectLeadId: 'u2',
    workflowId: 'w2',
    folderId: 'f2',
    createdAt: '2025-02-01T00:00:00Z',
  },
]

export const projectRepo = {
  async getAll(): Promise<Project[]> {
    return Promise.resolve([...data])
  },
  async getById(id: string): Promise<Project | null> {
    return Promise.resolve(data.find((p) => p.id === id) ?? null)
  },
  async getByCompany(companyId: string): Promise<Project[]> {
    return Promise.resolve(data.filter((p) => p.companyId === companyId))
  },
  async getByLead(projectLeadId: string): Promise<Project[]> {
    return Promise.resolve(data.filter((p) => p.projectLeadId === projectLeadId))
  },
  async create(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const next: Project = {
      ...project,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    data.push(next)
    return Promise.resolve(next)
  },
  async update(id: string, patch: Partial<Project>): Promise<Project | null> {
    const i = data.findIndex((p) => p.id === id)
    if (i === -1) return Promise.resolve(null)
    data[i] = { ...data[i], ...patch }
    return Promise.resolve(data[i])
  },
  async delete(id: string): Promise<boolean> {
    const i = data.findIndex((p) => p.id === id)
    if (i === -1) return Promise.resolve(false)
    data.splice(i, 1)
    return Promise.resolve(true)
  },
}
