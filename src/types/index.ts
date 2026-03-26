// User & Auth
export type UserRole = 'super_admin' | 'company_admin' | 'project_lead' | 'consultant' | 'freelancer'
/** 'on_leave' for suspended / put on leave */
export type UserStatus = 'active' | 'on_leave'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  companyId: string
  avatarUrl?: string
  /** Optional department assignment for company admins */
  departmentId?: string
  /** Optional; defaults to active when absent */
  status?: UserStatus
  /** 'online' or ISO date string for last seen (used in chat and mention dropdowns) */
  lastSeen?: string
}
export interface AuthUser extends User {
  token?: string
}

// Marketplace
export type MarketplaceBudgetType = 'hourly' | 'fixed' | 'hybrid'
export type MarketplacePostingStatus = 'open' | 'closed'

export interface ProjectPosting {
  id: string
  companyId: string
  createdById: string
  title: string
  description: string
  budgetType: MarketplaceBudgetType
  hourlyMin?: number
  hourlyMax?: number
  fixedMin?: number
  fixedMax?: number
  currency: string
  requiredSkills?: string[]
  status: MarketplacePostingStatus
  createdAt: string
  updatedAt: string
  /** Present on API responses so freelancers can show company without listing all companies */
  companyName?: string
  companyLogoUrl?: string | null
}

export type ApplicationStatus = 'applied' | 'shortlisted' | 'rejected' | 'withdrawn' | 'hired'

export interface ApplicationFile {
  id: string
  applicationId: string
  name: string
  url: string
}

export interface ProjectApplication {
  id: string
  postingId: string
  companyId: string
  freelancerId: string
  coverLetter: string
  proposedHourlyRate?: number
  proposedFixed?: number
  currency: string
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  attachments?: ApplicationFile[]
}

export interface HireResult {
  projectId: string
  assignmentId: string
  freelancerId: string
  companyId: string
  billingType: 'hourly' | 'fixed' | 'hybrid'
  currency: string
  hourlyRate?: number | null
  fixedBudget?: number | null
}

export interface MyAssignment {
  id: string
  projectId: string
  projectName: string
  companyId: string
  companyName: string
  billingType: 'hourly' | 'fixed' | 'hybrid'
  hourlyRate?: number
  fixedBudget?: number
  currency: string
  status: 'active' | 'completed' | 'terminated'
}

export type TimesheetStatus = 'submitted' | 'approved' | 'rejected'
export interface TimesheetEntry {
  id: string
  assignmentId: string
  companyId: string
  freelancerId: string
  workDate: string
  minutes: number
  notes: string
  status: TimesheetStatus
  createdAt: string
  updatedAt: string
}

export type BillingMilestoneStatus = 'pending' | 'approved' | 'invoiced' | 'paid'
export interface BillingMilestone {
  id: string
  assignmentId: string
  companyId: string
  freelancerId: string
  title: string
  amount: number
  currency: string
  dueDate?: string
  status: BillingMilestoneStatus
  createdAt: string
  updatedAt: string
}

export interface ProjectAssignment {
  id: string
  projectId: string
  companyId: string
  freelancerId: string
  billingType: 'hourly' | 'fixed' | 'hybrid'
  hourlyRate?: number
  fixedBudget?: number
  currency: string
  status: string
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
  /** Optional company-wide tax rate (percentage, e.g. 18 for 18%) */
  taxRate?: number
  /** Optional storage limits & usage in MB for admin overview */
  storageLimitMb?: number
  storageUsedMb?: number
  /** Optional company profile fields used in invoices & settings */
  address?: string
  phone?: string
  email?: string
  /** Optional company logo URL (used in invoices and company completion) */
  logoUrl?: string | null
}

// Department (company admin)
export interface Department {
  id: string
  companyId: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

// Project
export type ProjectStatus = 'active' | 'suspended'
export type ProjectType = 'internal' | 'external'

export interface Project {
  id: string
  companyId: string
  name: string
  description?: string
  projectLeadId: string
  workflowId: string
  folderId?: string
  createdAt: string
  /** Optional; defaults to active when absent */
  status?: ProjectStatus
  /** Optional for backward compatibility; defaults to internal */
  projectType?: ProjectType
  /** Optional project due date (ISO date string) */
  dueDate?: string
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
  /** Board column (workflow state). When missing, treated as first state. */
  workflowStateId?: string
  /** User IDs assigned to this milestone (optional; also derived from task owners). */
  assigneeIds?: string[]
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
  parentId?: string
  name: string
  type: 'file' | 'link' | 'folder'
  url: string
  sizeBytes?: number
  contentType?: string
  uploadedById: string
  createdAt: string
}

export interface ProjectFileStorageSummary {
  projectId: string
  companyId: string
  fileCount: number
  folderCount: number
  projectBytes: number
  usedBytes: number
  limitBytes: number
  limitMb: number
  usagePercent: number
  remainingBytes: number
}

// Comment
export interface Comment {
  id: string
  entityType: 'task' | 'doc'
  entityId: string
  authorId: string
  body: string
  createdAt: string
  /** Optional attachment for display (e.g. in project chat) */
  attachmentUrl?: string
  attachmentType?: 'image' | 'doc'
  /** Display size for doc attachments (e.g. "1.2 MB", "245 KB") */
  attachmentSize?: string
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

// Invoice (company admin)
export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
  /** Optional: consultant id for consultant-based billing */
  consultantId?: string
  /** Optional: hours per month (for rate = gross / hoursPerMonth); total is capped at gross */
  hoursPerMonth?: number
  /** Optional: gross pay for the period (max line total) */
  gross?: number
}

export interface InvoiceIssuer {
  name?: string
  email?: string
  phone?: string
  address?: string
  abn?: string
}

export interface InvoiceBankDetails {
  bankName?: string
  bsb?: string
  accountNumber?: string
  accountName?: string
}

export interface Invoice {
  id: string
  number: string
  clientName: string
  amount: number
  currency: string
  dueDate: string
  issuedDate?: string
  status: InvoiceStatus
  description?: string
  paidAt?: string
  /** Invoices are per person: consultant this invoice is for */
  consultantId?: string
  consultantName?: string
  /** Optional logo URL (e.g. company logo); fallback to app nav logo */
  logoUrl?: string
  issuer?: InvoiceIssuer
  bank?: InvoiceBankDetails
  lineItems?: InvoiceLineItem[]
}

// Note (standalone notes page + project file notes)
export const NOTE_COLORS = ['#fef3c7', '#d1fae5', '#dbeafe', '#fce7f3', '#e9d5ff', '#fed7aa', '#e5e7eb', '#fff'] as const
export type NoteColor = (typeof NOTE_COLORS)[number]

export interface Note {
  id: string
  title: string
  content: string
  color: NoteColor | string
  createdAt: string
  updatedAt: string
  /** When set, note belongs to a project file (folder node id) */
  projectFileNodeId?: string
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
