import type { CalendarEvent } from '../../types'

const data: CalendarEvent[] = [
  {
    id: 'e1',
    userId: 'u3',
    taskId: 't1',
    projectId: 'p1',
    title: 'Design homepage mockups',
    start: '2026-02-17T09:00:00',
    end: '2026-02-17T12:00:00',
    type: 'task_schedule',
  },
  {
    id: 'e2',
    userId: 'u3',
    title: 'Planning block',
    start: '2026-02-18T14:00:00',
    end: '2026-02-18T15:00:00',
    type: 'planning_block',
  },
  {
    id: 'e3',
    userId: 'u3',
    projectId: 'p1',
    title: 'Design phase complete',
    start: '2026-03-15T23:59:59',
    end: '2026-03-15T23:59:59',
    type: 'milestone_deadline',
  },
]

export const calendarRepo = {
  async getByUser(userId: string): Promise<CalendarEvent[]> {
    return Promise.resolve(data.filter((e) => e.userId === userId))
  },
  async create(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const next: CalendarEvent = { ...event, id: `e${Date.now()}` }
    data.push(next)
    return Promise.resolve(next)
  },
  async update(id: string, patch: Partial<Omit<CalendarEvent, 'id'>>): Promise<CalendarEvent | null> {
    const i = data.findIndex((e) => e.id === id)
    if (i === -1) return Promise.resolve(null)
    data[i] = { ...data[i], ...patch }
    return Promise.resolve(data[i])
  },
  async delete(id: string): Promise<boolean> {
    const i = data.findIndex((e) => e.id === id)
    if (i === -1) return Promise.resolve(false)
    data.splice(i, 1)
    return Promise.resolve(true)
  },
}
