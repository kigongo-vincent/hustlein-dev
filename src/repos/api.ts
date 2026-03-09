/**
 * API-backed repos. All endpoints and HTTP are centralized in api/.
 */
import { api, endpoints, assertOk } from '../api'
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
  async create(payload: Omit<ProjectFile, 'id' | 'createdAt'>): Promise<ProjectFile> {
    const res = await api.post<ProjectFile>(endpoints.projectFiles(payload.projectId), payload)
    return assertOk(res) as ProjectFile
  },
  async delete(id: string): Promise<boolean> {
    const res = await api.delete(endpoints.file(id))
    return res.ok
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
}
