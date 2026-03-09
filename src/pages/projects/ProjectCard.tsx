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
  const hasActions = [onDelete, onEdit, onSuspend].some(Boolean)

  const description = (p.description && p.description.trim().length > 0
    ? p.description.trim()
    : DEFAULT_PROJECT_DESCRIPTION)

  const borderColor = current?.system?.border ?? 'rgba(0,0,0,0.12)'
  const content = (
    <Card
      noShadow
      className="p-6 flex flex-col justify-center gap-2 min-h-[200px] rounded-base transition-opacity hover:opacity-95 h-full"
      style={{ backgroundColor: current?.system?.foreground, border: `1px solid ${borderColor}` }}
    >
        <Text
          className="font-semibold truncate"
          style={{ fontSize: baseFontSize * 1.05, color: dark, lineHeight: 1.35 }}
        >
          {p.name}
        </Text>
        <p
          className="text-sm opacity-85 line-clamp-2"
          style={{ color: dark, fontSize: baseFontSize, lineHeight: 1.5 }}
        >
          {description}
        </p>
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
      {hasActions && (
        <div
          className="shrink-0 flex items-center justify-end gap-1 pt-3 mt-2 border-t"
          style={{ borderColor: current?.system?.border }}
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
              aria-label={p.status === 'suspended' ? 'Resume project' : 'Suspend project'}
              title={p.status === 'suspended' ? 'Resume project' : 'Suspend project'}
            >
              {p.status === 'suspended' ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
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
      )}
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
