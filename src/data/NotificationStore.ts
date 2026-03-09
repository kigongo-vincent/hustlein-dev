import { create } from 'zustand'

export type NotificationVariant = 'success' | 'error' | 'info'

export interface AppNotification {
  id: string
  variant: NotificationVariant
  title: string
  message?: string
  createdAt: number
  /** Auto-dismiss after ms (default 4000). Set 0 to persist. */
  ttlMs?: number
}

interface NotificationStoreState {
  notifications: AppNotification[]
  push: (n: Omit<AppNotification, 'id' | 'createdAt'>) => string
  remove: (id: string) => void
  clear: () => void
}

export const NotificationStore = create<NotificationStoreState>((set, _get) => ({
  notifications: [],
  push: (n) => {
    const id = `ntf_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const next: AppNotification = {
      id,
      createdAt: Date.now(),
      ttlMs: n.ttlMs ?? 4000,
      ...n,
    }
    set((s) => ({ notifications: [next, ...s.notifications].slice(0, 5) }))
    return id
  },
  remove: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  clear: () => set({ notifications: [] }),
}))

const SUCCESS_TITLES = ['Done', 'Success', 'All set', 'Completed', 'Nice']
const ERROR_TITLES = ['Something went wrong', 'Could not complete', 'Action failed', 'Error']

export function notifySuccess(message: string, title?: string) {
  NotificationStore.getState().push({
    variant: 'success',
    title: title ?? SUCCESS_TITLES[Math.floor(Math.random() * SUCCESS_TITLES.length)],
    message,
  })
}

export function notifyError(message: string, title?: string) {
  NotificationStore.getState().push({
    variant: 'error',
    title: title ?? ERROR_TITLES[Math.floor(Math.random() * ERROR_TITLES.length)],
    message,
    ttlMs: 6000,
  })
}

