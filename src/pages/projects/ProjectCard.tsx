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
  onDelete: () => void
  onEdit: () => void
  onSuspend: () => void
}

const ProjectCard = ({ project: p, onDelete, onEdit, onSuspend }: ProjectCardProps) => {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const primaryColor = current?.brand?.primary ?? '#682308'
  const secondaryColor = current?.brand?.secondary ?? '#FF9600'

  return (
    <Card
      className="p-4 flex flex-col min-h-[200px] rounded-base"
      style={{ backgroundColor: current?.system?.background }}
    >
      <Text
        className="truncate pr-2 mb-1.5 block font-bold"
        style={{ fontSize: baseFontSize, color: dark, lineHeight: 1.35 }}
      >
        {p.name}
      </Text>
      <p
        className="text-sm opacity-80 line-clamp-2 mb-12 shrink-0"
        style={{ color: dark, fontSize: baseFontSize, lineHeight: 1.5 }}
      >
        {(p.description && p.description.trim().length > 0
          ? p.description.trim()
          : DEFAULT_PROJECT_DESCRIPTION)}
      </p>
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-3"
        style={{ color: dark, fontSize: baseFontSize, lineHeight: 1.5 }}
      >
        <span className="flex items-center gap-1.5">
          {p.members.length > 0 ? (
            <span className="flex -space-x-2">
              {p.members.slice(0, 5).map((m) => (
                <span
                  key={m.id}
                  className="rounded-full shrink-0 inline-block"
                  style={{ boxShadow: `0 0 0 2px ${current?.system?.foreground}` }}
                >
                  <Avatar name={m.name} size="sm" src={m.avatarUrl} />
                </span>
              ))}
              {p.members.length > 5 && (
                <span
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0"
                  style={{
                    backgroundColor: current?.system?.border,
                    color: dark,
                    boxShadow: `0 0 0 2px ${current?.system?.foreground}`,
                  }}
                >
                  +{p.members.length - 5}
                </span>
              )}
            </span>
          ) : (
            <User className="w-3.5 h-3.5 shrink-0 opacity-75" />
          )}
          <span className="opacity-75">
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
        className="flex items-center justify-between gap-2 pt-2 border-t"
        style={{ borderColor: current?.system?.border, lineHeight: 1.5 }}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDelete}
            className="p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{ color: current?.system?.error }}
            aria-label="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{ color: dark }}
            aria-label="Edit project"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onSuspend}
            className="p-2 rounded-base opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{ color: dark }}
            aria-label={p.status === 'suspended' ? 'Resume project' : 'Suspend project'}
            title={p.status === 'suspended' ? 'Resume project' : 'Suspend project'}
          >
            {p.status === 'suspended' ? (
              <PlayCircle className="w-4 h-4" />
            ) : (
              <PauseCircle className="w-4 h-4" />
            )}
          </button>
        </div>
        <Link
          to={`/app/projects/${p.id}`}
          className="inline-flex items-center gap-1 transition-colors hover:opacity-90 shrink-0"
          style={{ color: primaryColor, fontSize: baseFontSize }}
        >
          View project
          <ChevronRight className="w-4 h-4 shrink-0" />
        </Link>
      </div>
    </Card>
  )
}

export default ProjectCard
