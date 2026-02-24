import Text, { baseFontSize } from '../../components/base/Text'
import Avatar from '../../components/base/Avatar'
import { Button, Modal } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { CalendarClock, Target, Pencil, Trash2, ListTodo } from 'lucide-react'
import type { Milestone } from '../../types'
import { formatDate } from './utils'

function PriorityLabel({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const label = priority.charAt(0).toUpperCase() + priority.slice(1)
  return <span>{label}</span>
}

type MilestoneDetailModalProps = {
  open: boolean
  onClose: () => void
  milestone: Milestone | null
  assigneeIds: string[]
  userMap: Record<string, string>
  users: { id: string; name?: string; avatarUrl?: string }[]
  /** Column/board name for this milestone */
  workflowStateName?: string
  /** Task titles in this milestone (optional) */
  taskTitles?: string[]
  onEdit: () => void
  onDelete: () => void
  deleting?: boolean
}

const MilestoneDetailModal = ({
  open,
  onClose,
  milestone,
  assigneeIds,
  userMap,
  users,
  workflowStateName,
  taskTitles = [],
  onEdit,
  onDelete,
  deleting = false,
}: MilestoneDetailModalProps) => {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const fg = current?.system?.foreground
  const borderColor = current?.system?.border

  if (!milestone) return null

  return (
    <Modal open={open} onClose={() => !deleting && onClose()} variant="wide">
      <div className="min-w-0 w-full flex flex-col p-6" style={{ backgroundColor: fg }}>
        <h2 className="font-medium mb-4" style={{ fontSize: baseFontSize * 1.2, color: dark }}>
          Milestone details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-1">
              <Text variant="sm" style={{ color: dark }}>Name</Text>
            </label>
            <Text style={{ color: dark }}>{milestone.name}</Text>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">
                <Text variant="sm" style={{ color: dark }}>Priority</Text>
              </label>
              <Text style={{ color: dark }}><PriorityLabel priority={milestone.priority} /></Text>
            </div>
            {workflowStateName && (
              <div>
                <label className="block mb-1">
                  <Text variant="sm" style={{ color: dark }}>Column</Text>
                </label>
                <Text style={{ color: dark }}>{workflowStateName}</Text>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 shrink-0 opacity-80" style={{ color: dark }} />
              <Text variant="sm" style={{ color: dark }}>Due {formatDate(milestone.targetDate)}</Text>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 shrink-0 opacity-80" style={{ color: dark }} />
              <Text variant="sm" style={{ color: dark }}>Created {formatDate(milestone.createdAt)}</Text>
            </div>
          </div>

          <div>
            <label className="block mb-1">
              <Text variant="sm" style={{ color: dark }}>Assigned</Text>
            </label>
            {assigneeIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex -space-x-2">
                  {assigneeIds.slice(0, 6).map((uid) => (
                    <span
                      key={uid}
                      className="rounded-full shrink-0 inline-block"
                      style={{ boxShadow: `0 0 0 2px ${fg}` }}
                    >
                      <Avatar name={userMap[uid]} size="sm" src={users.find((u) => u.id === uid)?.avatarUrl} />
                    </span>
                  ))}
                  {assigneeIds.length > 6 && (
                    <span
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                      style={{
                        backgroundColor: borderColor ?? 'rgba(0,0,0,0.1)',
                        color: dark,
                        boxShadow: `0 0 0 2px ${fg}`,
                      }}
                    >
                      +{assigneeIds.length - 6}
                    </span>
                  )}
                </span>
                <Text variant="sm" className="opacity-80" style={{ color: dark }}>
                  {assigneeIds.length === 1 ? userMap[assigneeIds[0]] : `${assigneeIds.length} people`}
                </Text>
              </div>
            ) : (
              <Text variant="sm" className="opacity-70" style={{ color: dark }}>— No one assigned</Text>
            )}
          </div>

          {taskTitles.length > 0 && (
            <div>
              <label className="block mb-1 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4" style={{ color: dark }} />
                <Text variant="sm" style={{ color: dark }}>Tasks ({taskTitles.length})</Text>
              </label>
              <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto scroll-slim" style={{ color: dark }}>
                {taskTitles.map((title, i) => (
                  <li key={i}>
                    <Text variant="sm">{title}</Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 pt-4 mt-4 border-t shrink-0" style={{ borderColor }}>
          <Button variant="secondary" label="Close" onClick={onClose} disabled={deleting} />
          <Button label="Edit" startIcon={<Pencil className="w-4 h-4" />} onClick={onEdit} disabled={deleting} />
          <Button variant="danger" label="Delete" startIcon={<Trash2 className="w-4 h-4" />} onClick={onDelete} disabled={deleting} />
        </footer>
      </div>
    </Modal>
  )
}

export default MilestoneDetailModal
