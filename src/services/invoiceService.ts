import { invoiceRepo } from '../repos'
import type { Invoice } from '../types'

export const invoiceService = {
  async listByCompany(companyId: string, status?: string): Promise<Invoice[]> {
    return invoiceRepo.listByCompany(companyId, status ? { status } : undefined)
  },
  async get(id: string): Promise<Invoice | null> {
    return invoiceRepo.getById(id)
  },
  async markPaid(id: string): Promise<Invoice | null> {
    return invoiceRepo.markPaid(id)
  },
}

