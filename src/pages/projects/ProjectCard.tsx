import { useMemo } from 'react'
import { Link } from 'react-router'
import Text, { baseFontSize } from '../../components/base/Text'
import { Card } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import Avatar from '../../components/base/Avatar'
import {
  User,
  ListTodo,
  Calendar,
  ChevronRight,
  Pencil,
  Trash2,
  PauseCircle,
  PlayCircle,
} from 'lucide-react'
import { formatDate } from './utils'
import { DEFAULT_PROJECT_DESCRIPTION } from './constants'
import type { ProjectWithMeta } from './types'

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Calendar days until due (local midnight). */
function projectDueDayState(dueDate?: string): { label: string; tone: 'danger' | 'success' } | null {
  if (!dueDate) return null
  const due = new Date(dueDate)
  if (Number.isNaN(due.getTime())) return null
  const days = Math.round((startOfLocalDay(due) - startOfLocalDay(new Date())) / 86400000)
  if (days < 0) return { label: 'Overdue', tone: 'danger' }
  if (days === 0) return { label: 'Due today', tone: 'danger' }
  if (days < 3) return { label: `${days}d left`, tone: 'danger' }
  return { label: `${days}d left`, tone: 'success' }
}

type ProjectCardProps = {
  project: ProjectWithMeta
  onDelete?: () => void
  onEdit?: () => void
  onSuspend?: () => void
}

const ProjectCard = ({ project: p, onDelete, onEdit, onSuspend }: ProjectCardProps) => {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const primaryColor = current?.brand?.primary ?? '#682308'
  const secondaryColor = current?.brand?.secondary ?? '#FF9600'
  const green = current?.accent?.green ?? '#12B886'
  const errorColor = current?.system?.error ?? '#e03131'
  const hasActions = [onDelete, onEdit, onSuspend].some(Boolean)
  const status = p.status ?? 'active'
  const dueBadge = projectDueDayState(p.dueDate)

  const skillChipColors = useMemo(() => {
    const a = current?.accent
    return [a?.blue, a?.purple, a?.pink, a?.green, a?.yellow, a?.teal].filter(Boolean) as string[]
  }, [current?.accent])

  const description = (p.description && p.description.trim().length > 0
    ? p.description.trim()
    : DEFAULT_PROJECT_DESCRIPTION)

  const content = (
    <Card
      noShadow
      className="p-6 flex flex-col justify-center gap-2 min-h-[200px] rounded-base transition-opacity hover:opacity-95 h-full shadow-custom"
      style={{ backgroundColor: current?.system?.foreground }}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <Text
          className="font-semibold min-w-0 flex-1 leading-snug"
          style={{ fontSize: baseFontSize * 1.05, color: dark, lineHeight: 1.35 }}
        >
          {p.name}
        </Text>
        {dueBadge ? (
          <span
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
            style={
              dueBadge.tone === 'success'
                ? { background: `${green}22`, color: green }
                : { background: `${errorColor}18`, color: errorColor }
            }
          >
            {dueBadge.label}
          </span>
        ) : null}
      </div>
      <p
        className="text-sm opacity-85 line-clamp-4"
        style={{ color: dark, fontSize: baseFontSize, lineHeight: 1.5 }}
      >
        {description}
      </p>
      {p.skills && p.skills.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {p.skills.map((s) => {
            const idx = Math.abs(s.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % Math.max(1, skillChipColors.length)
            const c = skillChipColors[idx] ?? secondaryColor
            return (
              <span
                key={s}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{ background: `${c}18`, color: c }}
              >
                {s}
              </span>
            )
          })}
        </div>
      ) : null}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-0.5"
        style={{ color: dark, fontSize: baseFontSize * 0.9, lineHeight: 1.5 }}
      >
        <span className="flex items-center gap-1.5 opacity-75">
          {p.members.length > 0 ? (
            <span className="flex -space-x-2">
              {p.members.slice(0, 4).map((m) => (
                <span
                  key={m.id}
                  className="rounded-full shrink-0 inline-block"
                  style={{ boxShadow: `0 0 0 2px ${current?.system?.foreground}` }}
                >
                  <Avatar name={m.name} size="sm" src={m.avatarUrl} />
                </span>
              ))}
              {p.members.length > 4 && (
                <span
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                  style={{
                    backgroundColor: current?.system?.border,
                    color: dark,
                    boxShadow: `0 0 0 2px ${current?.system?.foreground}`,
                  }}
                >
                  +{p.members.length - 4}
                </span>
              )}
            </span>
          ) : (
            <User className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>
            {p.members.length > 0
              ? p.members.length === 1
                ? p.members[0].name
                : `${p.members.length} working`
              : p.leadName}
          </span>
        </span>
        <span className="flex items-center gap-1 opacity-75">
          <ListTodo className="w-3.5 h-3.5 shrink-0" style={{ color: primaryColor }} />
          {p.taskCount} task{p.taskCount !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1 opacity-75">
          <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: secondaryColor }} />
          {formatDate(p.createdAt)}
        </span>
      </div>
      <div
        className="shrink-0 flex flex-wrap items-center justify-between gap-2 pt-3 mt-2 border-t"
        style={{ borderColor: current?.system?.border }}
        onClick={hasActions ? (e) => e.preventDefault() : undefined}
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
            style={
              status === 'suspended'
                ? {
                  color: errorColor,
                  backgroundColor: `${errorColor}18`,
                }
                : {
                  color: green,
                  backgroundColor: `${green}1a`,
                }
            }
          >
            {status === 'suspended' ? 'Suspended' : 'Active'}
          </span>
        </div>
        {hasActions ? (
          <div
            className="flex items-center justify-end gap-1 shrink-0"
            onClick={(e) => e.preventDefault()}
          >
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete() }}
                className="p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity"
                style={{ color: current?.system?.error }}
                aria-label="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit() }}
                className="p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity"
                style={{ color: dark }}
                aria-label="Edit project"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onSuspend && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSuspend() }}
                className="p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity"
                style={{ color: dark }}
                aria-label={status === 'suspended' ? 'Resume project' : 'Suspend project'}
                title={status === 'suspended' ? 'Resume project' : 'Suspend project'}
              >
                {status === 'suspended' ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
              </button>
            )}
            <Link
              to={`/app/projects/${p.id}`}
              className="inline-flex items-center gap-1 font-medium"
              style={{ color: primaryColor, fontSize: baseFontSize }}
              onClick={(e) => e.stopPropagation()}
            >
              View project
              <ChevronRight className="w-4 h-4 shrink-0" />
            </Link>
          </div>
        ) : null}
      </div>
    </Card>
  )

  if (hasActions) {
    return <div className="h-full">{content}</div>
  }
  return (
    <Link to={`/app/projects/${p.id}`} className="block h-full">
      {content}
    </Link>
  )
}

export default ProjectCard
