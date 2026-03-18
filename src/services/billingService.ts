import { billingRepo, assignmentRepo } from '../repos'
import type { BillingMilestone, Invoice, ProjectAssignment, TimesheetEntry } from '../types'

export const billingService = {
  async listProjectAssignments(projectId: string): Promise<ProjectAssignment[]> {
    return assignmentRepo.listByProject(projectId)
  },
  async listTimesheets(assignmentId: string, params?: { from?: string; to?: string; status?: string }): Promise<TimesheetEntry[]> {
    return billingRepo.listTimesheets(assignmentId, params)
  },
  async createTimesheet(assignmentId: string, payload: Pick<TimesheetEntry, 'workDate' | 'minutes' | 'notes'>): Promise<TimesheetEntry> {
    return billingRepo.createTimesheet(assignmentId, payload)
  },
  async approveTimesheet(id: string): Promise<TimesheetEntry> {
    return billingRepo.approveTimesheet(id)
  },
  async listMilestones(assignmentId: string): Promise<BillingMilestone[]> {
    return billingRepo.listMilestones(assignmentId)
  },
  async createMilestone(assignmentId: string, payload: Pick<BillingMilestone, 'title' | 'amount' | 'currency' | 'dueDate'>): Promise<BillingMilestone> {
    return billingRepo.createMilestone(assignmentId, payload)
  },
  async approveMilestone(id: string): Promise<BillingMilestone> {
    return billingRepo.approveMilestone(id)
  },
  async generateInvoice(assignmentId: string, payload: { from?: string; to?: string }): Promise<Invoice> {
    return billingRepo.generateInvoice(assignmentId, payload)
  },
}

