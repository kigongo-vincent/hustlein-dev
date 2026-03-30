import { useEffect, useState, useMemo } from 'react'
import Text from '../../components/base/Text'
import View from '../../components/base/View'
import { Button, Input, AlertModal, DatePicker, CustomSelect, EmptyState, Modal } from '../../components/ui'
import { calendarService, marketplaceService, milestoneService, projectService } from '../../services'
import { Authstore } from '../../data/Authstore'
import { Themestore } from '../../data/Themestore'
import type { CalendarEvent, Milestone, ProjectApplication } from '../../types'
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** User-created events only (excludes synthetic `application_deadline` from marketplace applications). */
const EVENT_TYPES: { value: 'task_schedule' | 'planning_block' | 'milestone_deadline'; label: string }[] = [
  { value: 'task_schedule', label: 'Task schedule' },
  { value: 'planning_block', label: 'Planning block' },
  { value: 'milestone_deadline', label: 'Milestone deadline' },
]

/** Local calendar date YYYY-MM-DD (do not use toISOString — that is UTC and shifts the day vs the grid). */
function toDateOnly(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

/** Returns 42 days (6 weeks) starting from the Sunday before (or of) the first of the month */
function getDaysInView(year: number, month: number): { date: Date; iso: string; isCurrentMonth: boolean }[] {
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(start.getDate() - start.getDay())
  const out: { date: Date; iso: string; isCurrentMonth: boolean }[] = []
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i)
    out.push({
      date: d,
      iso: toDateOnly(d),
      isCurrentMonth: d.getMonth() === month,
    })
  }
  return out
}

function eventOverlapsDay(ev: CalendarEvent, dayIso: string): boolean {
  const start = ev.start.slice(0, 10)
  const end = ev.end.slice(0, 10)
  return start <= dayIso && dayIso <= end
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** 15-minute step time options for non-native time picking */
const TIME_OPTIONS = (() => {
  const out: { value: string; label: string }[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      out.push({ value, label: value })
    }
  }
  return out
})()

function getDatePart(dt: string): string {
  if (!dt) return ''
  const i = dt.indexOf('T')
  return i >= 0 ? dt.slice(0, i) : dt.slice(0, 10)
}
function getTimePart(dt: string): string {
  if (!dt) return '09:00'
  const i = dt.indexOf('T')
  if (i < 0) return '09:00'
  const rest = dt.slice(i + 1)
  const [h, m] = rest.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return '09:00'
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function setDateTime(date: string, time: string): string {
  if (!date) return ''
  return `${date}T${time}`
}

const MILESTONE_EVENT_PREFIX = 'milestone:'
const APPLICATION_DEADLINE_PREFIX = 'application:'

function isMilestoneSyncEvent(ev: CalendarEvent): boolean {
  return ev.id.startsWith(MILESTONE_EVENT_PREFIX)
}

function isApplicationDeadlineSyncEvent(ev: CalendarEvent): boolean {
  return ev.id.startsWith(APPLICATION_DEADLINE_PREFIX)
}

function milestoneDateOnly(targetDate: string): string {
  const raw = targetDate.trim().slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const d = new Date(targetDate)
  if (!Number.isNaN(d.getTime())) return toDateOnly(d)
  return raw
}

function formatEventWhen(ev: CalendarEvent): string {
  if (isMilestoneSyncEvent(ev)) return 'Milestone target date'
  if (isApplicationDeadlineSyncEvent(ev)) return 'Project deadline (from your application)'
  return `${formatTime(ev.start)} – ${formatTime(ev.end)}`
}

function calendarCellHint(ev: CalendarEvent): string {
  if (isMilestoneSyncEvent(ev)) return 'Milestone'
  if (isApplicationDeadlineSyncEvent(ev)) return 'Application · project due'
  return formatTime(ev.start)
}

/** Milestones from projects the freelancer is on; optional assigneeIds narrows to assigned milestones only */
function milestoneVisibleToFreelancer(m: Milestone, userId: string): boolean {
  const ids = m.assigneeIds
  if (ids && ids.length > 0) return ids.includes(userId)
  return true
}

function milestoneToCalendarEvent(m: Milestone, userId: string, projectName: string): CalendarEvent {
  const day = milestoneDateOnly(m.targetDate)
  const label = projectName ? `${m.name} (${projectName})` : m.name
  return {
    id: `${MILESTONE_EVENT_PREFIX}${m.id}`,
    userId,
    projectId: m.projectId,
    title: label,
    start: `${day}T12:00:00.000Z`,
    end: `${day}T12:00:00.000Z`,
    type: 'milestone_deadline',
  }
}

/** Project due date for marketplace applications with a linked project (e.g. hired). */
function applicationDeadlineToCalendarEvent(
  app: ProjectApplication,
  postingTitle: string,
  userId: string,
  dueDate: string
): CalendarEvent {
  const day = milestoneDateOnly(dueDate)
  const label = postingTitle.trim() || 'Project'
  return {
    id: `${APPLICATION_DEADLINE_PREFIX}${app.id}`,
    userId,
    projectId: app.linkedProjectId,
    title: `Due · ${label}`,
    start: `${day}T12:00:00.000Z`,
    end: `${day}T12:00:00.000Z`,
    type: 'application_deadline',
  }
}

const CalendarPage = () => {
  const { user } = Authstore()
  const { current } = Themestore()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(() => toDateOnly(new Date()))
  const [addTitle, setAddTitle] = useState('')
  const [addStart, setAddStart] = useState('')
  const [addEnd, setAddEnd] = useState('')
  const [addType, setAddType] = useState<'task_schedule' | 'planning_block' | 'milestone_deadline'>('task_schedule')
  const [submitting, setSubmitting] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null)
  const [dayModalOpen, setDayModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const primary = current?.brand?.primary || '#682308'
  const secondary = current?.brand?.secondary || '#FF9600'
  const bg = current?.system?.background
  const fg = current?.system?.foreground || '#f9f9f9'
  const dark = current?.system?.dark || 'black'
  const borderColor = current?.system?.border ?? 'rgba(0,0,0,0.1)'
  useEffect(() => {
    if (!user?.id) return
    calendarService.listByUser(user.id).then(setEvents)
  }, [user?.id])

  const [freelancerMilestones, setFreelancerMilestones] = useState<Milestone[]>([])
  const [projectNames, setProjectNames] = useState<Record<string, string>>({})
  const [applicationDeadlineEvents, setApplicationDeadlineEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    if (!user?.id || user.role !== 'freelancer') {
      setFreelancerMilestones([])
      setProjectNames({})
      return
    }
    let cancelled = false
    Promise.all([milestoneService.list(), projectService.list()])
      .then(([milestones, projects]) => {
        if (cancelled) return
        const names: Record<string, string> = {}
        projects.forEach((p) => {
          names[p.id] = p.name
        })
        setProjectNames(names)
        setFreelancerMilestones(
          milestones.filter((m) => milestoneVisibleToFreelancer(m, user.id))
        )
      })
      .catch(() => {
        if (!cancelled) setFreelancerMilestones([])
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    if (!user?.id || user.role !== 'freelancer') {
      setApplicationDeadlineEvents([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const apps = await marketplaceService.listMyApplications()
        if (cancelled) return
        const active = apps.filter((a) => a.status !== 'withdrawn' && a.status !== 'rejected')
        const postingIds = [...new Set(active.map((a) => a.postingId))]
        const postingsRes = await Promise.all(postingIds.map((id) => marketplaceService.getPosting(id)))
        const postingById: Record<string, Awaited<ReturnType<typeof marketplaceService.getPosting>>> = {}
        postingIds.forEach((id, i) => {
          postingById[id] = postingsRes[i]
        })
        const projectIds = [...new Set(active.map((a) => a.linkedProjectId).filter((id): id is string => !!id))]
        const projectsRes = await Promise.all(projectIds.map((id) => projectService.get(id)))
        const projectById: Record<string, Awaited<ReturnType<typeof projectService.get>>> = {}
        projectIds.forEach((id, i) => {
          projectById[id] = projectsRes[i]
        })
        const out: CalendarEvent[] = []
        for (const app of active) {
          const lid = app.linkedProjectId
          if (!lid) continue
          const proj = projectById[lid]
          if (!proj?.dueDate) continue
          const posting = postingById[app.postingId]
          const title = posting?.title?.trim() || proj.name
          out.push(applicationDeadlineToCalendarEvent(app, title, user.id, proj.dueDate))
        }
        if (!cancelled) setApplicationDeadlineEvents(out)
      } catch {
        if (!cancelled) setApplicationDeadlineEvents([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.role])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInView = useMemo(() => getDaysInView(year, month), [year, month])
  const monthTitle = viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const todayIso = toDateOnly(new Date())
  /** Shown on the calendar cell for “today” only (fits in the grid). */
  const todayCellDateLabel = new Date(`${todayIso}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const mergedEvents = useMemo(() => {
    if (!user?.id || user.role !== 'freelancer') {
      return events
    }
    const milestoneSynced = freelancerMilestones.map((m) =>
      milestoneToCalendarEvent(m, user.id, projectNames[m.projectId] ?? '')
    )
    return [...events, ...milestoneSynced, ...applicationDeadlineEvents]
  }, [events, user?.id, user?.role, freelancerMilestones, projectNames, applicationDeadlineEvents])

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    daysInView.forEach(({ iso }) => {
      map[iso] = mergedEvents.filter((e) => eventOverlapsDay(e, iso))
    })
    return map
  }, [mergedEvents, daysInView])

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    const list = eventsByDay[selectedDate] ?? []
    return [...list].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [selectedDate, eventsByDay])

  const goPrev = () => setViewDate(new Date(year, month - 1, 1))
  const goNext = () => setViewDate(new Date(year, month + 1, 1))
  const goToday = () => {
    const t = new Date()
    setViewDate(t)
    const iso = toDateOnly(t)
    setSelectedDate(iso)
    setDayModalOpen(true)
  }

  const openCreateModal = () => {
    const base = selectedDate ?? todayIso
    setAddStart(`${base}T09:00`)
    setAddEnd(`${base}T10:00`)
    setCreateModalOpen(true)
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !addTitle.trim() || !addStart || !addEnd) return
    setSubmitting(true)
    try {
      const startIso = addStart.includes('T') ? new Date(addStart).toISOString() : `${addStart}T09:00:00.000Z`
      const endIso = addEnd.includes('T') ? new Date(addEnd).toISOString() : `${addEnd}T10:00:00.000Z`
      const created = await calendarService.create({
        userId: user.id,
        title: addTitle.trim(),
        start: startIso,
        end: endIso,
        type: addType,
      })
      setEvents((prev) => [...prev, created])
      setAddTitle('')
      setCreateModalOpen(false)
      if (selectedDate) {
        setAddStart(`${selectedDate}T09:00`)
        setAddEnd(`${selectedDate}T10:00`)
      } else {
        setAddStart('')
        setAddEnd('')
      }
    } catch {
      // keep form open on error
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (ev: CalendarEvent) => {
    if (isMilestoneSyncEvent(ev) || isApplicationDeadlineSyncEvent(ev)) return
    setEventToDelete(ev)
  }
  const handleDeleteConfirm = async () => {
    if (!eventToDelete || isMilestoneSyncEvent(eventToDelete) || isApplicationDeadlineSyncEvent(eventToDelete)) return
    const ok = await calendarService.remove(eventToDelete.id)
    if (ok) setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id))
    setEventToDelete(null)
  }

  useEffect(() => {
    if (selectedDate) {
      setAddStart(`${selectedDate}T09:00`)
      setAddEnd(`${selectedDate}T10:00`)
    }
  }, [selectedDate])

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'task_schedule':
        return primary
      case 'planning_block':
        return secondary
      case 'milestone_deadline':
        return current?.system?.success || 'green'
      case 'application_deadline':
        return current?.accent?.purple ?? secondary
      default:
        return dark
    }
  }

  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    if (type === 'application_deadline') return 'Application · project due'
    return EVENT_TYPES.find((t) => t.value === type)?.label ?? type.replace(/_/g, ' ')
  }

  const dayModalTitle = selectedDate
    ? new Date(selectedDate + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
    : ''

  return (
    <div className="w-full flex flex-col gap-4 min-h-0 flex-1">
      {/* Page header */}
      <View bg="bg" className="p-3 rounded-base shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text className="font-medium" style={{ color: dark }}>Calendar</Text>
            <Text variant="sm" className="opacity-80 mt-0.5 block" style={{ color: dark }}>
              What to do · Schedule tasks, planning blocks, and milestone deadlines
            </Text>
            {user?.role === 'freelancer' && (
              <Text variant="sm" className="opacity-70 mt-1 block" style={{ color: dark }}>
                Milestone due dates from your projects and project deadlines from your marketplace applications (when hired) show here automatically.
              </Text>
            )}
          </div>
          {user && (
            <Button
              variant="primary"
              size="sm"
              label="Add event"
              startIcon={<Plus size={16} strokeWidth={2.25} />}
              onClick={openCreateModal}
            />
          )}
        </div>
      </View>

      <View bg="fg" noShadow className="rounded-base p-4 lg:p-6 flex flex-col flex-1 min-h-0 w-full min-w-0">
        <div
          className="rounded-base p-4 overflow-auto flex flex-col min-h-0 flex-1 w-full"
          style={{
            backgroundColor: bg ?? fg,
          }}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                className="p-2 rounded-base opacity-80 hover:opacity-100 transition-[opacity,color]"
                style={{ color: dark }}
                aria-label="Previous month"
              >
                <ChevronLeft size={20} strokeWidth={2.25} />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="p-2 rounded-base opacity-80 hover:opacity-100 transition-[opacity,color]"
                style={{ color: dark }}
                aria-label="Next month"
              >
                <ChevronRight size={20} strokeWidth={2.25} />
              </button>
              <Text className="font-medium min-w-[140px]" style={{ color: dark, fontSize: 13.5 }}>
                {monthTitle}
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" label="Today" startIcon={<CalendarIcon size={16} strokeWidth={2.25} style={{ color: dark }} />} onClick={goToday} />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 max-h-[70vh]">
            <div className="grid grid-cols-7 gap-px flex-1 min-h-0" style={{ gridTemplateRows: 'auto repeat(6, minmax(0,1fr))' }}>
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="py-2 text-center" style={{ backgroundColor: fg, color: dark, fontSize: 13.5 }}>
                  <Text variant="sm" className="font-medium opacity-80">{wd}</Text>
                </div>
              ))}
              {daysInView.map(({ date, iso, isCurrentMonth }) => {
                const dayEvents = eventsByDay[iso] ?? []
                const hasEvents = dayEvents.length > 0
                const isToday = iso === todayIso
                const isSelected = iso === selectedDate
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      setSelectedDate(iso)
                      setDayModalOpen(true)
                    }}
                    className={`p-1.5 flex flex-col transition hover:opacity-90 focus:outline-none ${isToday ? 'min-h-[88px]' : 'min-h-[72px]'} ${
                      hasEvents ? 'text-left items-stretch' : 'items-center justify-center text-center'
                    }`}
                    style={{
                      backgroundColor: isSelected ? primary + '20' : isToday ? primary + '12' : fg,
                      color: dark,
                    }}
                  >
                    {isToday ? (
                      <div
                        className={`flex flex-col gap-0.5 w-full min-w-0 shrink-0 ${!hasEvents ? 'items-center text-center' : ''}`}
                      >
                        <div className={`flex items-center gap-1.5 flex-wrap ${!hasEvents ? 'justify-center' : ''}`}>
                          <Text variant="sm" className="font-semibold" style={{ color: dark }}>
                            {date.getDate()}
                          </Text>
                          <span
                            className="text-[10px] font-medium uppercase tracking-wide px-1 py-0 rounded"
                            style={{ backgroundColor: primary + '35', color: primary }}
                          >
                            Today
                          </span>
                        </div>
                        <Text
                          className="leading-tight opacity-90 line-clamp-2"
                          style={{ color: dark, fontSize: 10 }}
                        >
                          {todayCellDateLabel}
                        </Text>
                      </div>
                    ) : (
                      <Text variant="sm" className={`font-medium ${isCurrentMonth ? '' : 'opacity-40'}`} style={{ color: dark }}>
                        {date.getDate()}
                      </Text>
                    )}
                    {hasEvents && (
                      <div className="flex-1 mt-0.5 space-y-0.5 overflow-hidden min-h-0 w-full">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className="truncate rounded px-1 py-0.5 text-left"
                            style={{ backgroundColor: getEventColor(ev.type) + '30', color: dark, fontSize: 11 }}
                            title={`${ev.title} · ${calendarCellHint(ev)}`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <Text variant="sm" className="opacity-60" style={{ fontSize: 11 }}>+{dayEvents.length - 3}</Text>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </View>

      <Modal open={dayModalOpen && !!selectedDate} onClose={() => setDayModalOpen(false)} variant="wide">
        <div className="p-6 flex flex-col gap-4 min-h-0 max-h-[min(85vh,calc(100dvh-2rem))]">
          <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
            <div>
              <h2 className="font-medium text-lg" style={{ color: dark }}>{dayModalTitle}</h2>
              <Text variant="sm" className="opacity-75 mt-0.5">
                {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
              </Text>
            </div>
            {user && (
              <Button
                size="sm"
                label="Add event"
                startIcon={<Plus size={16} strokeWidth={2.25} />}
                onClick={() => {
                  setDayModalOpen(false)
                  openCreateModal()
                }}
              />
            )}
          </div>
          <ul className="space-y-0 flex-1 min-h-0 overflow-y-auto scroll-slim -mx-1 px-1">
            {selectedEvents.length === 0 ? (
              <li className="list-none">
                <EmptyState
                  variant="calendar"
                  compact
                  title="No events this day"
                  description="Add an event from this dialog or use Add event in the header."
                  className="py-6 px-0 text-left items-start"
                />
              </li>
            ) : (
              selectedEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-start justify-between gap-2 py-3 border-b last:border-b-0"
                  style={{ borderColor }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="shrink-0 w-2 h-2 rounded-full"
                        style={{ backgroundColor: getEventColor(ev.type) }}
                        aria-hidden
                      />
                      <Text className="font-medium">{ev.title}</Text>
                    </div>
                    <Text variant="sm" className="opacity-70 mt-0.5">
                      {formatEventWhen(ev)}
                    </Text>
                    <span
                      className="inline-block mt-1 px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: getEventColor(ev.type) + '25', fontSize: 11, color: dark }}
                    >
                      {isMilestoneSyncEvent(ev)
                        ? 'Project milestone'
                        : isApplicationDeadlineSyncEvent(ev)
                          ? 'Application · project due'
                          : getEventTypeLabel(ev.type)}
                    </span>
                  </div>
                  {!isMilestoneSyncEvent(ev) && !isApplicationDeadlineSyncEvent(ev) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(ev)}
                    className="p-1.5 rounded-base opacity-60 hover:opacity-100 hover:bg-black/5 shrink-0"
                    aria-label={`Delete ${ev.title}`}
                  >
                    <Trash2 size={14} style={{ color: current?.system?.error || 'red' }} />
                  </button>
                  )}
                </li>
              ))
            )}
          </ul>
          <footer className="flex justify-end pt-2 border-t shrink-0" style={{ borderColor }}>
            <Button variant="background" label="Close" onClick={() => setDayModalOpen(false)} />
          </footer>
        </div>
      </Modal>

      <Modal open={createModalOpen && !!user} onClose={() => !submitting && setCreateModalOpen(false)} variant="wide">
        <div className="p-6">
          <h2 className="font-medium text-lg mb-1" style={{ color: dark }}>Add event</h2>
          <Text variant="sm" className="opacity-75 mb-4 block">Create a task schedule, planning block, or milestone deadline</Text>
          <form onSubmit={handleAddEvent} className="space-y-3">
            <Input label="Title" placeholder="Event title" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 items-start">
              <div className="min-w-0 flex flex-col gap-1">
                <Text variant="sm" className="font-medium opacity-90" style={{ color: dark }}>Start date</Text>
                <DatePicker
                  label=""
                  placeholder="dd/mm/yyyy"
                  value={getDatePart(addStart)}
                  onChange={(d) => setAddStart(setDateTime(d, getTimePart(addStart)))}
                />
              </div>
              <div className="min-w-0 flex flex-col gap-1">
                <Text variant="sm" className="font-medium opacity-90" style={{ color: dark }}>Start time</Text>
                <CustomSelect
                  label=""
                  options={TIME_OPTIONS}
                  value={getTimePart(addStart)}
                  onChange={(t) => setAddStart(setDateTime(getDatePart(addStart) || selectedDate || todayIso, t))}
                  placement="below"
                />
              </div>
              <div className="min-w-0 flex flex-col gap-1">
                <Text variant="sm" className="font-medium opacity-90" style={{ color: dark }}>End date</Text>
                <DatePicker
                  label=""
                  placeholder="dd/mm/yyyy"
                  value={getDatePart(addEnd)}
                  onChange={(d) => setAddEnd(setDateTime(d, getTimePart(addEnd)))}
                />
              </div>
              <div className="min-w-0 flex flex-col gap-1">
                <Text variant="sm" className="font-medium opacity-90" style={{ color: dark }}>End time</Text>
                <CustomSelect
                  label=""
                  options={TIME_OPTIONS}
                  value={getTimePart(addEnd)}
                  onChange={(t) => setAddEnd(setDateTime(getDatePart(addEnd) || selectedDate || todayIso, t))}
                  placement="below"
                />
              </div>
            </div>
            <CustomSelect
              label="Type"
              options={EVENT_TYPES}
              value={addType}
              onChange={(v) => setAddType(v as 'task_schedule' | 'planning_block' | 'milestone_deadline')}
              placement="below"
            />
            <footer className="flex flex-wrap justify-end gap-2 pt-4 mt-2 border-t" style={{ borderColor }}>
              <Button variant="background" type="button" label="Cancel" disabled={submitting} onClick={() => setCreateModalOpen(false)} />
              <Button type="submit" label="Add event" disabled={submitting} loading={submitting} startIcon={<Plus size={16} />} />
            </footer>
          </form>
        </div>
      </Modal>

      <AlertModal
        open={!!eventToDelete}
        title="Delete event"
        message={eventToDelete ? `Delete "${eventToDelete.title}"? This can't be undone.` : ''}
        confirmLabel="Delete"
        variant="error"
        onConfirm={handleDeleteConfirm}
        onClose={() => setEventToDelete(null)}
      />
    </div>
  )
}

export default CalendarPage
