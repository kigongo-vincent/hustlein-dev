// User & Auth
export type UserRole = 'super_admin' | 'company_admin' | 'project_lead' | 'consultant'
/** 'on_leave' for suspended / put on leave */
export type UserStatus = 'active' | 'on_leave'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  companyId: string
  avatarUrl?: string
  /** Optional; defaults to active when absent */
  status?: UserStatus
}
export interface AuthUser extends User {
  token?: string
}

// Consultant (full profile for multi-step create form)
export type ConsultantStatus = 'active' | 'inactive'
export interface ConsultantNextOfKin {
  name: string
  phoneNumber: string
  relationship: string
}
export interface ConsultantAddress {
  street: string
  city: string
  state: string
  country: string
  postalCode: string
}
export interface ConsultantBankDetails {
  bankName: string
  branch: string
  accountName: string
  accountNumber: string
}
export interface CreateConsultantPayload {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  dateOfBirth: string
  jobTitle: string
  status: ConsultantStatus
  employeeId?: string
  bio?: string
  grossPay: string
  hourlyRate: string
  currency: string
  totalHoursPerMonth: number
  officeDays: string[]
  nextOfKin: ConsultantNextOfKin
  address: ConsultantAddress
  bankDetails: ConsultantBankDetails
  roleId?: string
  departmentId?: string
  /** Used when creating via current user API (UserRole) */
  role?: UserRole
}

// Full consultant profile (API response shape)
export interface ConsultantProfileRole {
  id: string
  name: string
  created_at?: string | null
  updated_at?: string | null
}
export interface ConsultantProfileCompany {
  id: string
  name: string
  sector?: string
  address?: string | null
  phone?: string | null
  email?: string | null
  status?: string
  createdAt?: string
  updatedAt?: string
  currency?: string
  logo?: string | null
}
export interface ConsultantProfileDepartment {
  id: string
  name: string
  status?: string
  description?: string
  createdAt?: string
  updatedAt?: string
}
export interface ConsultantAttachment {
  url: string
  name: string
}
export interface ConsultantProfile {
  id: string
  fullName?: string
  firstName?: string
  lastName?: string
  email: string
  status?: string
  type?: string
  jobTitle?: string
  bio?: string
  profileImage?: string | null
  phoneNumber?: string | null
  employeeId?: string | null
  grossPay?: string
  dateOfBirth?: string
  nextOfKin?: ConsultantNextOfKin
  address?: ConsultantAddress
  bankDetails?: ConsultantBankDetails
  officeDays?: string[]
  createdAt?: string
  updatedAt?: string
  hourlyRate?: string
  currency?: string
  totalHoursPerMonth?: number
  attachments?: ConsultantAttachment[]
  role?: ConsultantProfileRole
  company?: ConsultantProfileCompany
  department?: ConsultantProfileDepartment
  departmentHead?: unknown
  boardMemberRole?: unknown
}

/** User (list item) or full ConsultantProfile for details modal */
export type ConsultantDetailsSource = User | ConsultantProfile

// Company
export type SubscriptionType = 'free' | 'paid'
export interface Company {
  id: string
  name: string
  subscription: SubscriptionType
  createdAt: string
}

// Project
export interface Project {
  id: string
  companyId: string
  name: string
  description?: string
  projectLeadId: string
  workflowId: string
  folderId?: string
  createdAt: string
}

// Workflow
export interface WorkflowState {
  id: string
  name: string
  order: number
}
export interface Workflow {
  id: string
  projectId: string
  name: string
  states: WorkflowState[]
}

// Task
export type Priority = 'high' | 'medium' | 'low'
export interface Task {
  id: string
  projectId: string
  milestoneId?: string
  title: string
  description?: string
  workflowStateId: string
  ownerId: string
  priority: Priority
  dueDate?: string
  dependencyIds: string[]
  createdAt: string
  updatedAt: string
}

// Milestone
export interface Milestone {
  id: string
  projectId: string
  name: string
  priority: Priority
  targetDate: string
  taskIds: string[]
  createdAt: string
}

// Goal (high-level, can map to milestones)
export interface Goal {
  id: string
  projectId: string
  name: string
  milestoneIds: string[]
  createdAt: string
}

// Project folder / assets
export interface ProjectFile {
  id: string
  projectId: string
  name: string
  type: 'file' | 'link'
  url: string
  uploadedById: string
  createdAt: string
}

// Comment
export interface Comment {
  id: string
  entityType: 'task' | 'doc'
  entityId: string
  authorId: string
  body: string
  createdAt: string
}

// Calendar / scheduling
export interface CalendarEvent {
  id: string
  userId: string
  projectId?: string
  taskId?: string
  title: string
  start: string
  end: string
  type: 'task_schedule' | 'planning_block' | 'milestone_deadline'
}

// Report stats
export interface StatCard {
  label: string
  value: number | string
  trend?: 'up' | 'down' | 'neutral'
  /** Percentage change for trend (e.g. 5 for +5%, -3 for -3%) */
  trendPercent?: number
}
export interface TaskCompletionByOwner {
  ownerId: string
  ownerName: string
  completed: number
  total: number
}
