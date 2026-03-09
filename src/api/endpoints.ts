/**
 * All API endpoints in one place. Use with api client (get, post, put, patch, delete).
 * Base URL is applied by the client (e.g. VITE_API_URL or /api).
 */

const BASE = import.meta.env.VITE_API_URL ?? '/api'

function path(
  segments: string[],
  params?: Record<string, string | undefined>
): string {
  const p = [BASE, ...segments].join('/').replace(/\/+/g, '/')
  if (!params) return p
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  ) as Record<string, string>
  const search = new URLSearchParams(filtered).toString()
  return search ? `${p}?${search}` : p
}

export const endpoints = {
  // Auth (no token required)
  auth: {
    login: () => path(['auth', 'login']),
    signup: () => path(['auth', 'signup']),
  },

  // Current user (from token)
  me: () => path(['me']),

  // Companies
  companies: () => path(['companies']),
  company: (id: string) => path(['companies', id]),

  // Users
  users: () => path(['users']),
  usersByCompany: (companyId: string) => path(['users', 'company', companyId]),
  userByEmail: (email: string) => path(['users', 'email', encodeURIComponent(email)]),
  user: (id: string) => path(['users', id]),
  userProfile: (id: string) => path(['users', id, 'profile']),

  // Departments
  departmentsByCompany: (companyId: string) => path(['companies', companyId, 'departments']),
  department: (id: string) => path(['departments', id]),

  // Projects
  projects: () => path(['projects']),
  projectsByCompany: (companyId: string) => path(['projects', 'company', companyId]),
  projectsByLead: (leadId: string) => path(['projects', 'lead', leadId]),
  project: (id: string) => path(['projects', id]),
  projectFiles: (projectId: string) => path(['projects', projectId, 'files']),
  projectFileUpload: (projectId: string) => path(['projects', projectId, 'files', 'upload']),

  // Workflow
  workflowByProject: (projectId: string) => path(['projects', projectId, 'workflow']),
  workflows: () => path(['workflows']),
  workflowStates: (workflowId: string) => path(['workflows', workflowId, 'states']),

  // Tasks
  tasks: () => path(['tasks']),
  tasksByProject: (projectId: string) => path(['projects', projectId, 'tasks']),
  tasksByMilestone: (milestoneId: string) => path(['milestones', milestoneId, 'tasks']),
  tasksByOwner: (ownerId: string) => path(['tasks', 'owner', ownerId]),
  task: (id: string) => path(['tasks', id]),

  // Milestones
  milestones: () => path(['milestones']),
  milestone: (id: string) => path(['milestones', id]),
  milestonesByProject: (projectId: string) => path(['projects', projectId, 'milestones']),

  // Comments
  comments: (params: { entityType: string; entityId: string }) =>
    path(['comments'], params),
  commentsCreate: () => path(['comments']),

  // Notes
  notes: () => path(['notes']),
  note: (id: string) => path(['notes', id]),

  // Calendar (user from token)
  calendar: () => path(['calendar']),
  calendarEvent: (id: string) => path(['calendar', id]),

  // Files
  file: (id: string) => path(['files', id]),

  // Reports
  reportsStatCards: (projectId?: string) =>
    path(['reports', 'stat-cards'], projectId ? { projectId } : undefined),
  reportsCompletionByOwner: (projectId?: string) =>
    path(['reports', 'completion-by-owner'], projectId ? { projectId } : undefined),
  reportsProgressOverTime: (projectId?: string) =>
    path(['reports', 'progress-over-time'], projectId ? { projectId } : undefined),

  // Invoices
  invoicesByCompany: (companyId: string) => path(['companies', companyId, 'invoices']),
  invoice: (id: string) => path(['invoices', id]),
  invoiceMarkPaid: (id: string) => path(['invoices', id, 'paid']),
} as const

export type Endpoints = typeof endpoints
