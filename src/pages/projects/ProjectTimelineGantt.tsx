import { useMemo } from 'react'
import Text, { baseFontSize } from '../../components/base/Text'
import EmptyState from '../../components/ui/EmptyState'
import Avatar from '../../components/base/Avatar'
import type { Project, Milestone, Task } from '../../types'
import { NOTE_COLORS } from '../../types'
import { darkenNoteBg } from '../../components/NoteCard'

const ROW_HEIGHT = 80
const BAR_HEIGHT = 64
const AXIS_HEIGHT = 60
const LABEL_WIDTH = 220
/** Min width of the chart area so longer date ranges scroll horizontally instead of squishing bars */
const CHART_MIN_WIDTH = 1200
const TICK_FONT_SIZE = 11
const TODAY_LINE_WIDTH = 2

/** Bar background: note color palette with dark-mode translation (same as NoteCard). */
function getNoteBarBg(index: number, darkMode: boolean, fg: string): string {
  const hex = NOTE_COLORS[index % NOTE_COLORS.length]
  return darkMode ? darkenNoteBg(hex, fg) : hex
}

/** Text on bar: use app text color (dark from theme). */
function getBarTextColor(dark: string): string {
  return dark ?? '#111'
}

/** Priority colors: gold (high), silver (medium), bronze (low). */
const PRIORITY_COLORS = {
  high: '#D4AF37',
  medium: '#A8A9AD',
  low: '#CD7F32',
} as const

function PriorityMedal({ level }: { level: 'high' | 'medium' | 'low' }) {
  const color = PRIORITY_COLORS[level]
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center"
      style={{ width: 14, height: 14, backgroundColor: color, boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }}
      title={level.charAt(0).toUpperCase() + level.slice(1)}
      aria-hidden
    />
  )
}

function toDate(iso: string): Date {
  const d = new Date(iso)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function dateToMs(d: Date): number {
  return toDate(d.toISOString()).getTime()
}

function formatAxisDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
}

export type ProjectTimelineGanttProps = {
  project: Project | null
  milestones: Milestone[]
  tasks?: Task[]
  /** Map user id -> display name for assignee labels on bars */
  userMap?: Record<string, string>
  /** Users list for assignee avatars (id, name, avatarUrl) */
  users?: { id: string; name: string; avatarUrl?: string }[]
  primaryColor: string
  secondaryColor: string
  dark: string
  fg: string
  /** App background (system.background); chart area uses this, not custom grays */
  bg: string
  /** Border color for axis and label column (e.g. system.border) */
  borderColor?: string
  darkMode?: boolean
  /** Done state id (e.g. 's6'); milestones with this workflowStateId are "complete" */
  doneStateId?: string
  /** Success color for completed milestone bars */
  successColor?: string
  /** When set (e.g. consultant), show this user's task logs per milestone in the label */
  currentUserId?: string
}

export default function ProjectTimelineGantt({
  project,
  milestones,
  tasks = [],
  userMap = {},
  users = [],
  primaryColor: _primaryColor,
  secondaryColor,
  dark,
  fg,
  bg,
  borderColor,
  darkMode = false,
  doneStateId = 's6',
  successColor: _successColor,
  currentUserId,
}: ProjectTimelineGanttProps) {
  const padX = darkMode ? 24 : 18
  const padYLabel = darkMode ? 14 : 8
  const padLegend = darkMode ? 16 : 12
  const border = borderColor ?? (darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')

  const { rangeMs, minMs, todayX, rows, dateTicks } = useMemo(() => {
    const allDates: number[] = []
    if (project?.createdAt) allDates.push(dateToMs(new Date(project.createdAt)))
    if (project?.dueDate) allDates.push(dateToMs(new Date(project.dueDate)))
    milestones.forEach((m) => {
      allDates.push(dateToMs(new Date(m.createdAt)))
      allDates.push(dateToMs(new Date(m.targetDate)))
    })
    tasks.forEach((t) => {
      if (t.createdAt) allDates.push(dateToMs(new Date(t.createdAt)))
      if (t.dueDate) allDates.push(dateToMs(new Date(t.dueDate)))
    })
    const today = toDate(new Date().toISOString()).getTime()
    allDates.push(today)

    const minMs = allDates.length ? Math.min(...allDates) : today - 30 * 24 * 60 * 60 * 1000
    const maxMs = allDates.length ? Math.max(...allDates) : today + 30 * 24 * 60 * 60 * 1000
    const rangeMs = Math.max(maxMs - minMs, 24 * 60 * 60 * 1000)
    const todayX = rangeMs > 0 ? (today - minMs) / rangeMs : 0

    const rows: {
      id: string
      label: string
      startMs: number
      endMs: number
      workflowStateId?: string
      targetDateLabel: string
      priority: 'high' | 'medium' | 'low'
      taskCount: number
      assigneeIds: string[]
      myLogTitles: string[]
    }[] = []
    milestones
      .slice()
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
      .forEach((m) => {
        const startMs = dateToMs(new Date(m.createdAt))
        const endMs = dateToMs(new Date(m.targetDate))
        const tasksInM = tasks.filter((t) => t.milestoneId === m.id)
        const fromTasks = tasksInM.map((t) => t.ownerId)
        const fromMilestone = m.assigneeIds ?? []
        const assigneeIds = [...new Set([...fromMilestone, ...fromTasks])].filter(Boolean)
        const priority = (m.priority === 'high' || m.priority === 'medium' || m.priority === 'low' ? m.priority : 'medium') as 'high' | 'medium' | 'low'
        const myLogTitles =
          currentUserId != null
            ? tasksInM.filter((t) => t.ownerId === currentUserId).map((t) => t.title ?? 'Untitled')
            : []
        rows.push({
          id: m.id,
          label: m.name,
          startMs: Math.min(startMs, endMs),
          endMs: Math.max(startMs, endMs),
          workflowStateId: m.workflowStateId,
          targetDateLabel: formatAxisDate(m.targetDate),
          priority,
          taskCount: tasksInM.length,
          assigneeIds,
          myLogTitles,
        })
      })

    const tickCount = 8
    const dateTicks: { ms: number; label: string }[] = []
    for (let i = 0; i <= tickCount; i++) {
      const ms = minMs + (rangeMs * i) / tickCount
      dateTicks.push({ ms, label: formatAxisDate(new Date(ms).toISOString()) })
    }
    return { minMs, rangeMs, todayX, rows, dateTicks }
  }, [project, milestones, tasks, userMap, currentUserId])

  const chartHeight = rows.length * ROW_HEIGHT
  const barTextColor = getBarTextColor(dark ?? '#111')
  const todayMs = toDate(new Date().toISOString()).getTime()

  /** Progress 0–1: done = 1, else time elapsed over duration (capped). */
  const getProgress = (row: { startMs: number; endMs: number; workflowStateId?: string }) => {
    if (row.workflowStateId === doneStateId) return 1
    const duration = row.endMs - row.startMs
    if (duration <= 0) return 0
    const elapsed = todayMs - row.startMs
    if (elapsed <= 0) return 0
    return Math.min(1, elapsed / duration)
  }

  if (milestones.length === 0) {
    return (
      <div className="rounded-base overflow-hidden" style={{ backgroundColor: fg, minHeight: 120 }}>
        <EmptyState
          variant="folder"
          title="No milestones yet"
          description="Add milestones to see the timeline."
          className="py-8"
        />
      </div>
    )
  }

  return (
    <div
      className="rounded-base overflow-hidden w-full flex flex-col flex-1 min-h-0"
      style={{ backgroundColor: fg }}
    >
      {/* Dates + chart scroll together horizontally and vertically (date row sticky on vertical scroll); fills container when in flex layout */}
      <div
        className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-auto scroll-slim"
        style={{ minHeight: 200 }}
      >
        <div
          className="flex flex-col shrink-0"
          style={{ minWidth: LABEL_WIDTH + CHART_MIN_WIDTH }}
        >
          {/* Sticky date section: Timeline label + date axis — fixed when scrolling vertically */}
          <div
            className="flex w-full shrink-0 sticky top-0 z-10"
            style={{ backgroundColor: bg, borderBottom: `1px solid ${border}` }}
          >
            <div
              className="shrink-0 flex items-end pb-2"
              style={{
                width: LABEL_WIDTH,
                height: AXIS_HEIGHT,
                paddingLeft: padX,
                paddingRight: padX,
                paddingTop: 10,
              }}
            >
              <span style={{ fontSize: TICK_FONT_SIZE, color: dark, opacity: 1 }}>
                Timeline
              </span>
            </div>
            <div
              className="flex flex-1 min-w-0 justify-between pb-2 items-end"
              style={{
                height: AXIS_HEIGHT,
                paddingLeft: padX,
                paddingRight: padX,
                paddingTop: 10,
              }}
            >
              {dateTicks.map((t, i) => (
                <span
                  key={i}
                  className="shrink-0"
                  style={{
                    fontSize: TICK_FONT_SIZE,
                    color: dark,
                    opacity: 1,
                    transform:
                      i === 0 ? 'translateX(0)' : i === dateTicks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                  }}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Body: labels + bar rows (scrolls horizontally with date row) */}
          <div className="flex w-full shrink-0 mt-auto" style={{ minHeight: chartHeight }}>
          {/* Left column: milestone labels — app bg, border-right like sidebar */}
          <div
            className="shrink-0 flex flex-col"
            style={{ width: LABEL_WIDTH, backgroundColor: bg, borderRight: `1px solid ${border}` }}
          >
            {rows.map((row) => (
              <div
                key={row.id}
                className="shrink-0 flex flex-col justify-center min-w-0"
                style={{
                  height: ROW_HEIGHT,
                  color: dark,
                  fontSize: Math.min(baseFontSize * 0.9, 13),
                  paddingLeft: padX,
                  paddingRight: padX,
                  paddingTop: padYLabel,
                  paddingBottom: padYLabel,
                  backgroundColor: bg,
                  opacity: 1,
                }}
                title={row.label + (row.myLogTitles?.length ? ` · Your logs: ${row.myLogTitles.join(', ')}` : '')}
              >
                <span className="truncate font-medium">{row.label}</span>
                {currentUserId != null && row.myLogTitles != null && row.myLogTitles.length > 0 && (
                  <span className="truncate opacity-80 text-[11px] mt-0.5" style={{ color: dark }}>
                    Your logs ({row.myLogTitles.length}): {row.myLogTitles.slice(0, 2).join(', ')}
                    {row.myLogTitles.length > 2 ? ` +${row.myLogTitles.length - 2}` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Right column: bar rows only — app bg */}
          <div
            className="relative flex-1 min-w-0 flex flex-col"
            style={{ backgroundColor: bg }}
          >
            {rows.map((row, i) => {
              const startPct = rangeMs > 0 ? (row.startMs - minMs) / rangeMs : 0
              const endPct = rangeMs > 0 ? (row.endMs - minMs) / rangeMs : 0.1
              const widthPct = Math.max((endPct - startPct) * 100, 2)
              const barBg = getNoteBarBg(i, darkMode, fg)
              const progress = getProgress(row)
              return (
                <div
                  key={row.id}
                  className="relative shrink-0"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div
                    className="absolute rounded-sm flex flex-col items-stretch overflow-hidden"
                    style={{
                      left: `${startPct * 100}%`,
                      width: `${widthPct}%`,
                      minWidth: 200,
                      height: BAR_HEIGHT,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    {/* Full bar: subtle progress overlay (left); two-line layout with priority icon, due/tasks, avatars */}
                    <div
                      className="flex flex-1 flex-col justify-center overflow-hidden rounded-sm relative px-4 py-3 gap-2"
                      style={{ backgroundColor: barBg, minHeight: BAR_HEIGHT }}
                    >
                      {progress > 0 && (
                        <div
                          className="absolute inset-y-0 left-0 transition-[width] rounded-l-sm pointer-events-none"
                          style={{
                            width: `${progress * 100}%`,
                            backgroundColor: 'rgba(0,0,0,0.12)',
                          }}
                        />
                      )}
                      <div className="flex items-center gap-2 min-w-0 relative z-10">
                        <PriorityMedal level={row.priority} />
                        <span
                          className="truncate font-medium flex-1 min-w-0"
                          style={{
                            fontSize: Math.min(baseFontSize * 0.9, 13),
                            color: barTextColor,
                          }}
                          title={row.label}
                        >
                          {row.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0 relative z-10 flex-wrap">
                        <span
                          className="opacity-90 shrink-0"
                          style={{
                            fontSize: Math.min(baseFontSize * 0.75, 11),
                            color: barTextColor,
                          }}
                        >
                          Due {row.targetDateLabel}
                        </span>
                        <span
                          className="opacity-80 shrink-0"
                          style={{
                            fontSize: Math.min(baseFontSize * 0.75, 11),
                            color: barTextColor,
                          }}
                        >
                          {row.taskCount} task{row.taskCount !== 1 ? 's' : ''}
                        </span>
                        {row.assigneeIds.length > 0 && (
                          <span className="flex items-center -space-x-1.5 shrink-0">
                            {row.assigneeIds.slice(0, 4).map((uid) => {
                              const u = users.find((x) => x.id === uid)
                              return (
                                <span
                                  key={uid}
                                  className="rounded-full inline-flex overflow-hidden flex-shrink-0"
                                  style={{
                                    width: 22,
                                    height: 22,
                                    boxShadow: '0 0 0 1.5px rgba(0,0,0,0.1)',
                                  }}
                                  title={u ? u.name : userMap[uid] ?? uid}
                                >
                                  <Avatar
                                    name={u?.name ?? userMap[uid] ?? ''}
                                    size="sm"
                                    src={u?.avatarUrl}
                                    className="!h-[22px] !w-[22px] !text-[9px]"
                                  />
                                </span>
                              )
                            })}
                            {row.assigneeIds.length > 4 && (
                              <span
                                className="rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                                style={{
                                  width: 22,
                                  height: 22,
                                  backgroundColor: 'rgba(0,0,0,0.15)',
                                  color: barTextColor,
                                }}
                              >
                                +{row.assigneeIds.length - 4}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Today vertical line — over bar rows only */}
            <div
              className="pointer-events-none absolute left-0 right-0 w-full"
              style={{ top: 0, height: chartHeight }}
            >
              <div
                className="absolute top-0 bottom-0 w-0"
                style={{
                  left: `calc(${todayX * 100}% - ${TODAY_LINE_WIDTH / 2}px)`,
                  width: TODAY_LINE_WIDTH,
                  backgroundColor: secondaryColor,
                  opacity: 0.95,
                }}
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Today legend — app bg, theme text */}
      <div
        className="w-full flex items-center gap-2 shrink-0"
        style={{
          backgroundColor: bg,
          paddingLeft: padX,
          paddingRight: padX,
          paddingTop: padLegend,
          paddingBottom: padLegend,
        }}
      >
        <span
          className="shrink-0 rounded-full"
          style={{ width: TODAY_LINE_WIDTH, height: 14, backgroundColor: secondaryColor }}
        />
        <Text variant="sm" style={{ color: dark, opacity: 1 }}>Today</Text>
      </div>
    </div>
  )
}
