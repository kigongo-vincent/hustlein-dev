import { api, endpoints, assertOk } from '../api'
import type { StatCard, TaskCompletionByOwner } from '../types'

export const reportService = {
  async getStatCards(projectId?: string): Promise<StatCard[]> {
    const res = await api.get<StatCard[]>(endpoints.reportsStatCards(projectId))
    const data = assertOk(res) as StatCard[]
    return data.map((s) => ({ ...s, value: typeof s.value === 'number' ? s.value : Number(s.value) ?? 0 }))
  },
  async getCompletionByOwner(projectId?: string): Promise<TaskCompletionByOwner[]> {
    const res = await api.get<TaskCompletionByOwner[]>(endpoints.reportsCompletionByOwner(projectId))
    return assertOk(res) as TaskCompletionByOwner[]
  },
  async getProgressOverTime(projectId?: string): Promise<{ date: string; completed: number }[]> {
    const res = await api.get<{ date: string; completed: number }[]>(endpoints.reportsProgressOverTime(projectId))
    return assertOk(res) as { date: string; completed: number }[]
  },
}
