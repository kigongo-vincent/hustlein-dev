import Avatar from '../../components/base/Avatar'
import { baseFontSize, minFontSize } from '../../components/base/Text'
import { CalendarClock, Target } from 'lucide-react'
import type { Milestone } from '../../types'
import { formatDate } from './utils'

/** Gold / Silver / Bronze priority icons */
const PriorityGold = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <defs>
      <linearGradient id="milestone-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE55C" />
        <stop offset="50%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    <path d="M6 6h3v2H6V6zm9 0h3v2h-3V6zM12 2v2h4l-1.5 4H12v8h-1v-8H9.5L8 4h4V2z" fill="url(#milestone-gold-grad)" stroke="#B8860B" strokeWidth="0.5" />
    <circle cx="12" cy="11" r="6" fill="url(#milestone-gold-grad)" stroke="#B8860B" strokeWidth="1" />
    <circle cx="12" cy="11" r="3" fill="none" stroke="#B8860B" strokeWidth="0.8" opacity="0.8" />
  </svg>
)
const PrioritySilver = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <defs>
      <linearGradient id="milestone-silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF" />
        <stop offset="50%" stopColor="#C0C0C0" />
        <stop offset="100%" stopColor="#808080" />
      </linearGradient>
    </defs>
    <path d="M6 6h3v2H6V6zm9 0h3v2h-3V6zM12 2v2h4l-1.5 4H12v8h-1v-8H9.5L8 4h4V2z" fill="url(#milestone-silver-grad)" stroke="#808080" strokeWidth="0.5" />
    <circle cx="12" cy="11" r="6" fill="url(#milestone-silver-grad)" stroke="#808080" strokeWidth="1" />
    <circle cx="12" cy="11" r="3" fill="none" stroke="#808080" strokeWidth="0.8" opacity="0.8" />
  </svg>
)
const PriorityBronze = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <defs>
      <linearGradient id="milestone-bronze-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C59C" />
        <stop offset="50%" stopColor="#CD7F32" />
        <stop offset="100%" stopColor="#8B4513" />
      </linearGradient>
    </defs>
    <path d="M6 6h3v2H6V6zm9 0h3v2h-3V6zM12 2v2h4l-1.5 4H12v8h-1v-8H9.5L8 4h4V2z" fill="url(#milestone-bronze-grad)" stroke="#8B4513" strokeWidth="0.5" />
    <circle cx="12" cy="11" r="6" fill="url(#milestone-bronze-grad)" stroke="#8B4513" strokeWidth="1" />
    <circle cx="12" cy="11" r="3" fill="none" stroke="#8B4513" strokeWidth="0.8" opacity="0.8" />
  </svg>
)
function PriorityIcon({ priority, className }: { priority: 'high' | 'medium' | 'low'; className?: string }) {
  if (priority === 'high') return <PriorityGold className={className} />
  if (priority === 'medium') return <PrioritySilver className={className} />
  return <PriorityBronze className={className} />
}

export interface MilestoneCardProps {
  milestone: Milestone
  assigneeIds: string[]
  userMap: Record<string, string>
  users: { id: string; avatarUrl?: string }[]
  fg: string
  dark: string
  borderColor: string | undefined
  /** Defaults to utils baseFontSize */
  baseFontSize?: number
  /** Optional: compact layout for board columns */
  compact?: boolean
  /** Optional: show as dragging */
  isDragging?: boolean
  className?: string
}

export default function MilestoneCard({
  milestone: m,
  assigneeIds,
  userMap,
  users,
  fg,
  dark,
  borderColor,
  baseFontSize: base = baseFontSize,
  compact = false,
  isDragging = false,
  className = '',
}: MilestoneCardProps) {
  return (
    <div
      className={`rounded-base flex flex-col ${compact ? 'gap-2 px-3 py-2.5' : 'gap-4 p-5'} ${className}`}
      style={{
        backgroundColor: fg,
        fontSize: Math.min(base, baseFontSize),
        opacity: isDragging ? 0.6 : 1,
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <p className="font-medium truncate" style={{ color: dark }}>{m.name}</p>
        <PriorityIcon priority={m.priority} className="w-6 h-6 shrink-0" />
      </div>
      <div className={`flex flex-wrap items-start justify-between gap-x-4 gap-y-2 ${compact ? '' : 'flex-1 min-h-0'}`} style={{ fontSize: Math.max(minFontSize, Math.min(base * 0.875, base)) }}>
        <div className="flex flex-col gap-y-1">
          <div className="flex items-center gap-2 opacity-80" style={{ color: dark }}>
            <CalendarClock className="w-4 h-4 shrink-0" />
            <span>Due {formatDate(m.targetDate)}</span>
          </div>
          <div className="flex items-center gap-2 opacity-80" style={{ color: dark }}>
            <Target className="w-4 h-4 shrink-0" />
            <span>Created {formatDate(m.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <span className="opacity-70 shrink-0" style={{ color: dark }}>Assigned</span>
          {assigneeIds.length > 0 ? (
            <>
              <span className="flex -space-x-2">
                {assigneeIds.slice(0, 4).map((uid) => (
                  <span
                    key={uid}
                    className="rounded-full shrink-0 inline-block"
                    style={{ boxShadow: `0 0 0 2px ${fg}` }}
                  >
                    <Avatar name={userMap[uid]} size="sm" src={users.find((u) => u.id === uid)?.avatarUrl} />
                  </span>
                ))}
                {assigneeIds.length > 4 && (
                  <span
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                    style={{
                      backgroundColor: borderColor ?? 'rgba(0,0,0,0.1)',
                      color: dark,
                      boxShadow: `0 0 0 2px ${fg}`,
                    }}
                  >
                    +{assigneeIds.length - 4}
                  </span>
                )}
              </span>
              <span className="opacity-75 truncate" style={{ color: dark }}>
                {assigneeIds.length === 1 ? userMap[assigneeIds[0]] : `${assigneeIds.length} people`}
              </span>
            </>
          ) : (
            <span className="opacity-70" style={{ color: dark }}>—</span>
          )}
        </div>
      </div>
    </div>
  )
}
