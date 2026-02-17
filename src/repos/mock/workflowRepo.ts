import type { Workflow, WorkflowState } from '../../types'

const defaultStates: WorkflowState[] = [
  { id: 's1', name: 'Backlog', order: 0 },
  { id: 's2', name: 'To Do', order: 1 },
  { id: 's3', name: 'In Progress', order: 2 },
  { id: 's4', name: 'Review', order: 3 },
  { id: 's5', name: 'Approved', order: 4 },
  { id: 's6', name: 'Done', order: 5 },
]

const data: Workflow[] = [
  { id: 'w1', projectId: 'p1', name: 'Default', states: defaultStates },
  { id: 'w2', projectId: 'p2', name: 'Default', states: defaultStates },
]

export const workflowRepo = {
  async getById(id: string): Promise<Workflow | null> {
    return Promise.resolve(data.find((w) => w.id === id) ?? null)
  },
  async getByProject(projectId: string): Promise<Workflow | null> {
    return Promise.resolve(data.find((w) => w.projectId === projectId) ?? null)
  },
  async create(workflow: Omit<Workflow, 'id'>): Promise<Workflow> {
    const next: Workflow = { ...workflow, id: `w${Date.now()}` }
    data.push(next)
    return Promise.resolve(next)
  },
  async updateStates(workflowId: string, states: WorkflowState[]): Promise<Workflow | null> {
    const w = data.find((x) => x.id === workflowId)
    if (!w) return Promise.resolve(null)
    w.states = states
    return Promise.resolve(w)
  },
}
