// User & Auth
export type UserRole = 'super_admin' | 'company_admin' | 'project_lead' | 'consultant'
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  companyId: string
  avatarUrl?: string
}
export interface AuthUser extends User {
  token?: string
}

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
}
export interface TaskCompletionByOwner {
  ownerId: string
  ownerName: string
  completed: number
  total: number
}
