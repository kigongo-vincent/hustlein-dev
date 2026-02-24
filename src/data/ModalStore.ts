import { create } from 'zustand'

interface ModalStoreState {
  /** Modal open state by key (e.g. projectDetail:projectId:board) */
  modals: Record<string, boolean>
  setModal: (key: string, open: boolean) => void
  getModal: (key: string) => boolean | undefined
}

export const ModalStore = create<ModalStoreState>((set, get) => ({
  modals: {},
  setModal: (key, open) =>
    set((state) => ({
      modals: { ...state.modals, [key]: open },
    })),
  getModal: (key) => get().modals[key],
}))

/** Keys for project detail page modals (prefix with projectDetail:${projectId}:) */
export const PROJECT_DETAIL_MODAL_KEYS = {
  about: 'about',
  board: 'board',
  addMilestone: 'addMilestone',
  addTask: 'addTask',
  edit: 'edit',
  delete: 'delete',
  suspend: 'suspend',
  analytics: 'analytics',
  folder: 'folder',
} as const

/** Keys for board modal's inner modals (prefix with board:${projectId}:) */
export const BOARD_MODAL_KEYS = {
  workflow: 'workflow',
  addMilestone: 'addMilestone',
  editMilestone: 'editMilestone',
  deleteMilestone: 'deleteMilestone',
} as const

/** Keys for project list page modals (prefix with projectList:) */
export const PROJECT_LIST_MODAL_KEYS = {
  create: 'create',
  edit: 'edit',
  analytics: 'analytics',
  filter: 'filter',
} as const

function projectDetailKey(projectId: string | undefined, modal: string): string {
  return `projectDetail:${projectId ?? ''}:${modal}`
}

function boardKey(projectId: string, modal: string): string {
  return `board:${projectId}:${modal}`
}

export function useProjectDetailModal(
  projectId: string | undefined,
  modal: keyof typeof PROJECT_DETAIL_MODAL_KEYS
): [boolean, (open: boolean) => void] {
  const key = projectDetailKey(projectId, PROJECT_DETAIL_MODAL_KEYS[modal])
  const open = ModalStore((s) => s.getModal(key) ?? false)
  const setOpen = (value: boolean) => ModalStore.getState().setModal(key, value)
  return [open, setOpen]
}

export function useBoardModal(
  projectId: string,
  modal: keyof typeof BOARD_MODAL_KEYS
): [boolean, (open: boolean) => void] {
  const key = boardKey(projectId, BOARD_MODAL_KEYS[modal])
  const open = ModalStore((s) => s.getModal(key) ?? false)
  const setOpen = (value: boolean) => ModalStore.getState().setModal(key, value)
  return [open, setOpen]
}

const PROJECT_LIST_PREFIX = 'projectList:'

export function useProjectListModal(
  modal: keyof typeof PROJECT_LIST_MODAL_KEYS
): [boolean, (open: boolean) => void] {
  const key = PROJECT_LIST_PREFIX + PROJECT_LIST_MODAL_KEYS[modal]
  const open = ModalStore((s) => s.getModal(key) ?? false)
  const setOpen = (value: boolean) => ModalStore.getState().setModal(key, value)
  return [open, setOpen]
}
