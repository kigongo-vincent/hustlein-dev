import { calendarRepo } from '../repos'
import type { CalendarEvent } from '../types'

export const calendarService = {
  async listByUser(userId: string): Promise<CalendarEvent[]> {
    return calendarRepo.getByUser(userId)
  },
  async create(payload: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    return calendarRepo.create(payload)
  },
  async remove(id: string): Promise<boolean> {
    return calendarRepo.delete(id)
  },
}
