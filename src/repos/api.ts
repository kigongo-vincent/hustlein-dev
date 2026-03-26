/**
 * API-backed repos. All endpoints and HTTP are centralized in api/.
 */
import { api, endpoints, assertOk, getStoredToken } from '../api'
import type {
  Company,
  User,
  Project,
  Workflow,
  WorkflowState,
  Task,
  Milestone,
  Department,
  Comment,
  Note,
  CalendarEvent,
  ProjectFile,
  ProjectFileStorageSummary,
  ApplicationFile,
  ProjectPosting,
  ProjectApplication,
  HireResult,
  MyAssignment,
  TimesheetEntry,
  BillingMilestone,
  ProjectAssignment,
  Invoice,
} from '../types'

function okOrNull<T>(res: { ok: boolean; data: T; status: number }): T | null {
  if (res.ok) return res.data as T
  if (res.status === 404) return null
  const msg =
    typeof res.data === 'object' && res.data !== null && 'error' in res.data
      ? String((res.data as { error: unknown }).error)
      : `Request failed: ${res.status}`
  throw new Error(msg)
}

export const companyRepo = {
  async getAll(): Promise<Company[]> {
    const res = await api.get<Company[]>(endpoints.companies())
    return assertOk(res) as Company[]
  },
  async getById(id: string): Promise<Company | null> {
    const res = await api.get<Company>(endpoints.company(id))
    return okOrNull(res)
  },
  async create(payload: Omit<Company, 'id' | 'createdAt'>): Promise<Company> {
    const res = await api.post<Company>(endpoints.companies(), payload)
    return assertOk(res) as Company
  },
  async update(id: string, patch: Partial<Company>): Promise<Company | null> {
    const res = await api.put<Company>(endpoints.company(id), patch)
    return okOrNull(res)
  },
  async delete(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.company(id))
    return res.ok
  },
}

export const userRepo = {
  async getAll(): Promise<User[]> {
    const res = await api.get<User[]>(endpoints.users())
    return assertOk(res) as User[]
  },
  async getById(id: string): Promise<User | null> {
    const res = await api.get<User>(endpoints.user(id))
    return okOrNull(res)
  },
  async getByCompany(companyId: string): Promise<User[]> {
    const res = await api.get<User[]>(endpoints.usersByCompany(companyId))
    return assertOk(res) as User[]
  },
  async getByEmail(email: string): Promise<User | null> {
    const res = await api.get<User>(endpoints.userByEmail(email))
    return okOrNull(res)
  },
  async create(payload: Omit<User, 'id'>): Promise<User> {
    const res = await api.post<User>(endpoints.users(), payload)
    return assertOk(res) as User
  },
  async update(id: string, patch: Partial<User>): Promise<User | null> {
    const res = await api.put<User>(endpoints.user(id), patch)
    return okOrNull(res)
  },
  async delete(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.user(id))
    return res.ok
  },
}

export const projectRepo = {
  async getAll(): Promise<Project[]> {
    const res = await api.get<Project[]>(endpoints.projects())
    return assertOk(res) as Project[]
  },
  async getById(id: string): Promise<Project | null> {
    const res = await api.get<Project>(endpoints.project(id))
    return okOrNull(res)
  },
  async getByCompany(companyId: string): Promise<Project[]> {
    const res = await api.get<Project[]>(endpoints.projectsByCompany(companyId))
    return assertOk(res) as Project[]
  },
  async getByLead(projectLeadId: string): Promise<Project[]> {
    const res = await api.get<Project[]>(endpoints.projectsByLead(projectLeadId))
    return assertOk(res) as Project[]
  },
  async create(payload: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const res = await api.post<Project>(endpoints.projects(), payload)
    return assertOk(res) as Project
  },
  async update(id: string, patch: Partial<Project>): Promise<Project | null> {
    const res = await api.put<Project>(endpoints.project(id), patch)
    return okOrNull(res)
  },
  async delete(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.project(id))
    return res.ok
  },
}

export const workflowRepo = {
  async getById(_id: string): Promise<Workflow | null> {
    return null
  },
  async getByProject(projectId: string): Promise<Workflow | null> {
    const res = await api.get<Workflow>(endpoints.workflowByProject(projectId))
    return okOrNull(res)
  },
  async create(payload: Omit<Workflow, 'id'>): Promise<Workflow> {
    const res = await api.post<Workflow>(endpoints.workflows(), payload)
    return assertOk(res) as Workflow
  },
  async updateStates(workflowId: string, states: WorkflowState[]): Promise<Workflow | null> {
    const res = await api.put<Workflow>(endpoints.workflowStates(workflowId), { states })
    return okOrNull(res)
  },
}

export const noteRepo = {
  async getAll(): Promise<Note[]> {
    const res = await api.get<Note[]>(endpoints.notes())
    return assertOk(res) as Note[]
  },
  async getById(id: string): Promise<Note | null> {
    const res = await api.get<Note>(endpoints.note(id))
    return okOrNull(res)
  },
  async create(payload: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const res = await api.post<Note>(endpoints.notes(), payload)
    return assertOk(res) as Note
  },
  async update(id: string, patch: Partial<Pick<Note, 'title' | 'content' | 'color'>>): Promise<Note | null> {
    const res = await api.put<Note>(endpoints.note(id), patch)
    return okOrNull(res)
  },
  async delete(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.note(id))
    return res.ok
  },
}

export const calendarRepo = {
  async getByUser(_userId: string): Promise<CalendarEvent[]> {
    const res = await api.get<CalendarEvent[]>(endpoints.calendar())
    return assertOk(res) as CalendarEvent[]
  },
  async create(payload: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const res = await api.post<CalendarEvent>(endpoints.calendar(), payload)
    return assertOk(res) as CalendarEvent
  },
  async update(id: string, patch: Partial<Omit<CalendarEvent, 'id'>>): Promise<CalendarEvent | null> {
    const res = await api.put<CalendarEvent>(endpoints.calendarEvent(id), patch)
    return okOrNull(res)
  },
  async delete(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.calendarEvent(id))
    return res.ok
  },
}

export const projectFileRepo = {
  async getById(id: string): Promise<ProjectFile | null> {
    const res = await api.get<ProjectFile>(endpoints.file(id))
    return okOrNull(res)
  },
  async getByProject(projectId: string): Promise<ProjectFile[]> {
    const res = await api.get<ProjectFile[]>(endpoints.projectFiles(projectId))
    return assertOk(res) as ProjectFile[]
  },
  async getTreeByProject(projectId: string): Promise<ProjectFile[]> {
    const res = await api.get<ProjectFile[]>(endpoints.projectFilesTree(projectId))
    return assertOk(res) as ProjectFile[]
  },
  async getStorageSummary(projectId: string): Promise<ProjectFileStorageSummary> {
    const res = await api.get<ProjectFileStorageSummary>(endpoints.projectFilesStorage(projectId))
    return assertOk(res) as ProjectFileStorageSummary
  },
  async create(payload: Omit<ProjectFile, 'id' | 'createdAt'>): Promise<ProjectFile> {
    const res = await api.post<ProjectFile>(endpoints.projectFiles(payload.projectId), payload)
    return assertOk(res) as ProjectFile
  },
  async update(id: string, patch: Partial<Pick<ProjectFile, 'name' | 'url'>>): Promise<ProjectFile | null> {
    const res = await api.put<ProjectFile>(endpoints.file(id), patch)
    return okOrNull(res)
  },
  async delete(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.file(id))
    return res.ok
  },
  async move(id: string, parentId?: string): Promise<ProjectFile | null> {
    const res = await api.patch<ProjectFile>(endpoints.projectFileMove(id), { parentId })
    return okOrNull(res)
  },
}

export const taskRepo = {
  async getAll(): Promise<Task[]> {
    const res = await api.get<Task[]>(endpoints.tasks())
    return assertOk(res) as Task[]
  },
  async getById(id: string): Promise<Task | null> {
    const res = await api.get<Task>(endpoints.task(id))
    return okOrNull(res)
  },
  async getByProject(projectId: string): Promise<Task[]> {
    const res = await api.get<Task[]>(endpoints.tasksByProject(projectId))
    return assertOk(res) as Task[]
  },
  async getByMilestone(milestoneId: string): Promise<Task[]> {
    const res = await api.get<Task[]>(endpoints.tasksByMilestone(milestoneId))
    return assertOk(res) as Task[]
  },
  async getByOwner(ownerId: string): Promise<Task[]> {
    const res = await api.get<Task[]>(endpoints.tasksByOwner(ownerId))
    return assertOk(res) as Task[]
  },
  async create(payload: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const res = await api.post<Task>(endpoints.tasks(), payload)
    return assertOk(res) as Task
  },
  async update(id: string, patch: Partial<Task>): Promise<Task | null> {
    const res = await api.put<Task>(endpoints.task(id), patch)
    return okOrNull(res)
  },
  async delete(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.task(id))
    return res.ok
  },
}

export const milestoneRepo = {
  async getAll(): Promise<Milestone[]> {
    const res = await api.get<Milestone[]>(endpoints.milestones())
    return assertOk(res) as Milestone[]
  },
  async getById(id: string): Promise<Milestone | null> {
    const res = await api.get<Milestone>(endpoints.milestone(id))
    return okOrNull(res)
  },
  async getByProject(projectId: string): Promise<Milestone[]> {
    const res = await api.get<Milestone[]>(endpoints.milestonesByProject(projectId))
    return assertOk(res) as Milestone[]
  },
  async create(payload: Omit<Milestone, 'id' | 'createdAt'>): Promise<Milestone> {
    const res = await api.post<Milestone>(endpoints.milestones(), payload)
    return assertOk(res) as Milestone
  },
  async update(id: string, patch: Partial<Milestone>): Promise<Milestone | null> {
    const res = await api.put<Milestone>(endpoints.milestone(id), patch)
    return okOrNull(res)
  },
  async delete(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.milestone(id))
    return res.ok
  },
}

export const departmentRepo = {
  async listByCompany(companyId: string): Promise<Department[]> {
    const res = await api.get<Department[]>(endpoints.departmentsByCompany(companyId))
    return assertOk(res) as Department[]
  },
  async create(payload: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> {
    const res = await api.post<Department>(endpoints.departmentsByCompany(payload.companyId), payload)
    return assertOk(res) as Department
  },
  async update(id: string, patch: Partial<Department>): Promise<Department | null> {
    const res = await api.put<Department>(endpoints.department(id), patch)
    return okOrNull(res)
  },
  async remove(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.department(id))
    return res.ok
  },
}

export const commentRepo = {
  async getByEntity(entityType: Comment['entityType'], entityId: string): Promise<Comment[]> {
    const res = await api.get<Comment[]>(
      endpoints.comments({ entityType, entityId })
    )
    return assertOk(res) as Comment[]
  },
  async create(payload: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    const res = await api.post<Comment>(endpoints.commentsCreate(), payload)
    return assertOk(res) as Comment
  },
  async update(id: string, patch: Partial<Pick<Comment, 'body' | 'attachmentUrl' | 'attachmentType' | 'attachmentSize'>>): Promise<Comment | null> {
    const res = await api.put<Comment>(endpoints.comment(id), patch)
    return okOrNull(res)
  },
  async delete(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.comment(id))
    return res.ok
  },
}

export const marketplaceRepo = {
  async listPostings(): Promise<ProjectPosting[]> {
    const res = await api.get<ProjectPosting[]>(endpoints.marketplaceProjects())
    return assertOk(res) as ProjectPosting[]
  },
  async getPosting(id: string): Promise<ProjectPosting | null> {
    const res = await api.get<ProjectPosting>(endpoints.marketplaceProject(id))
    return okOrNull(res)
  },
  async createPosting(payload: Omit<ProjectPosting, 'id' | 'companyId' | 'createdById' | 'status' | 'createdAt' | 'updatedAt'> & { status?: ProjectPosting['status']; companyId?: string }): Promise<ProjectPosting> {
    const res = await api.post<ProjectPosting>(endpoints.marketplaceProjects(), payload)
    return assertOk(res) as ProjectPosting
  },
  async updatePosting(id: string, patch: Partial<Omit<ProjectPosting, 'id' | 'companyId' | 'createdById' | 'createdAt' | 'updatedAt'>>): Promise<ProjectPosting | null> {
    const res = await api.put<ProjectPosting>(endpoints.marketplaceProject(id), patch)
    return okOrNull(res)
  },
  async deletePosting(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.marketplaceProject(id))
    return res.ok
  },
  async apply(postingId: string, payload: Pick<ProjectApplication, 'coverLetter'> & Partial<Pick<ProjectApplication, 'proposedHourlyRate' | 'proposedFixed' | 'currency'>>): Promise<ProjectApplication> {
    const res = await api.post<ProjectApplication>(endpoints.marketplaceApply(postingId), payload)
    return assertOk(res) as ProjectApplication
  },
  async listApplications(postingId: string): Promise<ProjectApplication[]> {
    const res = await api.get<ProjectApplication[]>(endpoints.marketplaceApplicationsByPosting(postingId))
    return assertOk(res) as ProjectApplication[]
  },
  async listMyApplications(): Promise<ProjectApplication[]> {
    const res = await api.get<ProjectApplication[]>(endpoints.marketplaceMyApplications())
    return assertOk(res) as ProjectApplication[]
  },
  async updateApplicationStatus(applicationId: string, status: ProjectApplication['status']): Promise<ProjectApplication> {
    const res = await api.patch<ProjectApplication>(endpoints.marketplaceApplication(applicationId), { status })
    return assertOk(res) as ProjectApplication
  },
  async hire(applicationId: string, payload: { projectLeadId: string; billingType?: HireResult['billingType']; hourlyRate?: number; fixedBudget?: number; currency?: string; startDate?: string }): Promise<HireResult> {
    const res = await api.post<HireResult>(endpoints.marketplaceHire(applicationId), payload)
    return assertOk(res) as HireResult
  },
  async listApplicationFiles(applicationId: string): Promise<ApplicationFile[]> {
    const res = await api.get<ApplicationFile[]>(endpoints.marketplaceApplicationFiles(applicationId))
    return assertOk(res) as ApplicationFile[]
  },
  async uploadApplicationFile(applicationId: string, file: File): Promise<ApplicationFile> {
    const token = getStoredToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(endpoints.marketplaceApplicationFileUpload(applicationId), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    })
    const data = (await res.json()) as ApplicationFile | { error?: string }
    if (!res.ok) {
      const err = typeof data === 'object' && data && 'error' in data ? data.error : `Upload failed (${res.status})`
      throw new Error(String(err || 'Upload failed'))
    }
    return data as ApplicationFile
  },
}

export const assignmentRepo = {
  async listMine(): Promise<MyAssignment[]> {
    const res = await api.get<MyAssignment[]>(endpoints.myAssignments())
    return assertOk(res) as MyAssignment[]
  },
  async listByProject(projectId: string): Promise<ProjectAssignment[]> {
    const res = await api.get<ProjectAssignment[]>(endpoints.projectAssignments(projectId))
    return assertOk(res) as ProjectAssignment[]
  },
}

export const billingRepo = {
  async listTimesheets(assignmentId: string, params?: { from?: string; to?: string; status?: string }): Promise<TimesheetEntry[]> {
    const url = endpoints.assignmentTimesheets(assignmentId) + (params ? `?${new URLSearchParams(Object.entries(params).filter(([,v]) => !!v).map(([k,v]) => [k, String(v)])).toString()}` : '')
    const res = await api.get<TimesheetEntry[]>(url)
    return assertOk(res) as TimesheetEntry[]
  },
  async createTimesheet(assignmentId: string, payload: Pick<TimesheetEntry, 'workDate' | 'minutes' | 'notes'>): Promise<TimesheetEntry> {
    const res = await api.post<TimesheetEntry>(endpoints.assignmentTimesheets(assignmentId), payload)
    return assertOk(res) as TimesheetEntry
  },
  async approveTimesheet(id: string): Promise<TimesheetEntry> {
    const res = await api.patch<TimesheetEntry>(endpoints.approveTimesheet(id), {})
    return assertOk(res) as TimesheetEntry
  },
  async listMilestones(assignmentId: string): Promise<BillingMilestone[]> {
    const res = await api.get<BillingMilestone[]>(endpoints.assignmentBillingMilestones(assignmentId))
    return assertOk(res) as BillingMilestone[]
  },
  async createMilestone(assignmentId: string, payload: Pick<BillingMilestone, 'title' | 'amount' | 'currency' | 'dueDate'>): Promise<BillingMilestone> {
    const res = await api.post<BillingMilestone>(endpoints.assignmentBillingMilestones(assignmentId), payload)
    return assertOk(res) as BillingMilestone
  },
  async approveMilestone(id: string): Promise<BillingMilestone> {
    const res = await api.patch<BillingMilestone>(endpoints.approveBillingMilestone(id), {})
    return assertOk(res) as BillingMilestone
  },
  async generateInvoice(assignmentId: string, payload: { from?: string; to?: string }): Promise<Invoice> {
    const res = await api.post<Invoice>(endpoints.generateAssignmentInvoice(assignmentId), payload)
    return assertOk(res) as Invoice
  },
}

export const invoiceRepo = {
  async listByCompany(companyId: string, params?: { status?: string }): Promise<Invoice[]> {
    const url =
      endpoints.invoicesByCompany(companyId) +
      (params?.status ? `?${new URLSearchParams({ status: params.status }).toString()}` : '')
    const res = await api.get<Invoice[]>(url)
    return assertOk(res) as Invoice[]
  },
  async getById(id: string): Promise<Invoice | null> {
    const res = await api.get<Invoice>(endpoints.invoice(id))
    return okOrNull(res)
  },
  async markPaid(id: string): Promise<Invoice | null> {
    const res = await api.patch<Invoice>(endpoints.invoiceMarkPaid(id), {})
    return okOrNull(res)
  },
  async update(id: string, patch: Partial<Invoice>): Promise<Invoice | null> {
    const res = await api.put<Invoice>(endpoints.invoice(id), patch)
    return okOrNull(res)
  },
}
