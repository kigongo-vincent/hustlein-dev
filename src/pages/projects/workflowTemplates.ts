import type { WorkflowState } from '../../types'

export interface WorkflowTemplate {
  id: string
  name: string
  states: Omit<WorkflowState, 'id'>[] // name + order; id will be generated when applying
}

/** Default workflow templates. States get new ids when applied (e.g. s${Date.now()}). */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'simple',
    name: 'Simple',
    states: [
      { name: 'To Do', order: 0 },
      { name: 'In Progress', order: 1 },
      { name: 'Done', order: 2 },
    ],
  },
  {
    id: 'kanban',
    name: 'Kanban',
    states: [
      { name: 'Backlog', order: 0 },
      { name: 'To Do', order: 1 },
      { name: 'In Progress', order: 2 },
      { name: 'Review', order: 3 },
      { name: 'Done', order: 4 },
    ],
  },
  {
    id: 'full',
    name: 'Full',
    states: [
      { name: 'Backlog', order: 0 },
      { name: 'To Do', order: 1 },
      { name: 'In Progress', order: 2 },
      { name: 'Review', order: 3 },
      { name: 'Approved', order: 4 },
      { name: 'Done', order: 5 },
    ],
  },
]

/** Convert a template to WorkflowState[] with generated ids */
export function templateToStates(template: WorkflowTemplate): WorkflowState[] {
  const base = Date.now()
  return template.states.map((s, i) => ({
    ...s,
    id: `s${base + i}`,
  }))
}
