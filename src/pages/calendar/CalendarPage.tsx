import { useEffect, useState, useMemo } from 'react'
import Text from '../../components/base/Text'
import View from '../../components/base/View'
import { Card, Button, Input, AlertModal, DatePicker, CustomSelect } from '../../components/ui'
import { calendarService } from '../../services'
import { Authstore } from '../../data/Authstore'
import { Themestore } from '../../data/Themestore'
import type { CalendarEvent } from '../../types'
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, LayoutGrid, Columns3 } from 'lucide-react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const EVENT_TYPES: { value: CalendarEvent['type']; label: string }[] = [
  { value: 'task_schedule', label: 'Task schedule' },
  { value: 'planning_block', label: 'Planning block' },
  { value: 'milestone_deadline', label: 'Milestone deadline' },
]

const WEEK_START_HOUR = 7
const WEEK_END_HOUR = 22
const HOURS = Array.from({ length: WEEK_END_HOUR - WEEK_START_HOUR }, (_, i) => WEEK_START_HOUR + i)

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

function getWeekStart(d: Date): Date {
  const out = new Date(d)
  out.setDate(out.getDate() - out.getDay())
  out.setHours(0, 0, 0, 0)
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

/** Returns 7 days starting from the Sunday of the week containing d */
function getWeekDays(d: Date): { date: Date; iso: string }[] {
  const start = getWeekStart(d)
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    return { date, iso: toDateOnly(date) }
  })
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

function getHoursDecimal(iso: string): number {
  const d = new Date(iso)
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600
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

const CalendarPage = () => {
  const { user } = Authstore()
  const { current } = Themestore()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(() => toDateOnly(new Date()))
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [addTitle, setAddTitle] = useState('')
  const [addStart, setAddStart] = useState('')
  const [addEnd, setAddEnd] = useState('')
  const [addType, setAddType] = useState<CalendarEvent['type']>('task_schedule')
  const [submitting, setSubmitting] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null)

  const primary = current?.brand?.primary || '#682308'
  const secondary = current?.brand?.secondary || '#FF9600'
  const bg = current?.system?.background
  const fg = current?.system?.foreground || '#f9f9f9'
  const dark = current?.system?.dark || 'black'
  useEffect(() => {
    if (!user?.id) return
    calendarService.listByUser(user.id).then(setEvents)
  }, [user?.id])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInView = useMemo(() => getDaysInView(year, month), [year, month])
  const weekDays = useMemo(() => getWeekDays(viewDate), [viewDate])
  const monthTitle = viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const weekTitle = (() => {
    const start = weekDays[0]?.date
    const end = weekDays[6]?.date
    if (!start || !end) return ''
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  })()
  const todayIso = toDateOnly(new Date())

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    daysInView.forEach(({ iso }) => {
      map[iso] = events.filter((e) => eventOverlapsDay(e, iso))
    })
    return map
  }, [events, daysInView])

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    const list = eventsByDay[selectedDate] ?? []
    return [...list].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [selectedDate, eventsByDay])

  const goPrev = () => {
    if (viewMode === 'month') setViewDate(new Date(year, month - 1, 1))
    else setViewDate(addDays(viewDate, -7))
  }
  const goNext = () => {
    if (viewMode === 'month') setViewDate(new Date(year, month + 1, 1))
    else setViewDate(addDays(viewDate, 7))
  }
  const goToday = () => {
    const t = new Date()
    setViewDate(t)
    setSelectedDate(toDateOnly(t))
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !addTitle.trim() || !addStart || !addEnd) return
    setSubmitting(true)
    try {
      const created = await calendarService.create({
        userId: user.id,
        title: addTitle.trim(),
        start: new Date(addStart).toISOString(),
        end: new Date(addEnd).toISOString(),
        type: addType,
      })
      setEvents((prev) => [...prev, created])
      setAddTitle('')
      if (selectedDate) {
        setAddStart(`${selectedDate}T09:00`)
        setAddEnd(`${selectedDate}T10:00`)
      } else {
        setAddStart('')
        setAddEnd('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (ev: CalendarEvent) => setEventToDelete(ev)
  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return
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
      default:
        return dark
    }
  }

  const getEventTypeLabel = (type: CalendarEvent['type']) =>
    EVENT_TYPES.find((t) => t.value === type)?.label ?? type.replace(/_/g, ' ')

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 min-h-0 flex-1">
      {/* Page header */}
      <View bg="bg" className="p-3 rounded-base shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text className="font-medium" style={{ color: dark }}>Calendar</Text>
            <Text variant="sm" className="opacity-80 mt-0.5 block" style={{ color: dark }}>
              Schedule and events · Task schedules, planning blocks, and milestone deadlines
            </Text>
          </div>
        </div>
      </View>

      {/* Main fg section: calendar + sidebar */}
      <View bg="fg" className="rounded-base shadow-custom p-4 lg:p-6 flex flex-col gap-6 flex-1 min-h-0 w-full">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 min-h-0 w-full">
          {/* Calendar area */}
          <div className="min-w-0 flex flex-col lg:w-[60%]">
            <div
              className="rounded-base p-4 overflow-auto flex flex-col min-h-0 flex-1 max-h-[45vh]"
              style={{
                maxWidth: 'min(100%, 72vh)',
                backgroundColor: bg ?? fg,
              }}
            >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  className="p-2 rounded-base opacity-70 hover:opacity-100 transition"
                  aria-label={viewMode === 'month' ? 'Previous month' : 'Previous week'}
                >
                  <ChevronLeft size={20} style={{ color: dark }} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="p-2 rounded-base opacity-70 hover:opacity-100 transition"
                  aria-label={viewMode === 'month' ? 'Next month' : 'Next week'}
                >
                  <ChevronRight size={20} style={{ color: dark }} />
                </button>
                <Text className="font-medium min-w-[140px]" style={{ color: dark, fontSize: 13.5 }}>
                  {viewMode === 'month' ? monthTitle : weekTitle}
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-base overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('month')}
                    className={`p-2 ${viewMode === 'month' ? 'opacity-100' : 'opacity-60'} hover:opacity-100 transition`}
                    style={{ backgroundColor: viewMode === 'month' ? primary + '20' : fg, color: dark }}
                    aria-label="Month view"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('week')}
                    className={`p-2 ${viewMode === 'week' ? 'opacity-100' : 'opacity-60'} hover:opacity-100 transition`}
                    style={{ backgroundColor: viewMode === 'week' ? primary + '20' : fg, color: dark }}
                    aria-label="Week view"
                  >
                    <Columns3 size={18} />
                  </button>
                </div>
                <Button variant="ghost" size="sm" label="Today" startIcon={<CalendarIcon size={16} />} onClick={goToday} />
              </div>
            </div>

            {viewMode === 'month' && (
              <div className="grid grid-cols-7 gap-px">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="py-2 text-center" style={{ backgroundColor: fg, color: dark, fontSize: 13.5 }}>
                    <Text variant="sm" className="font-medium opacity-80">{wd}</Text>
                  </div>
                ))}
                {daysInView.map(({ date, iso, isCurrentMonth }) => {
                  const dayEvents = eventsByDay[iso] ?? []
                  const isToday = iso === todayIso
                  const isSelected = iso === selectedDate
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSelectedDate(iso)}
                      className="min-h-[4.5vh] max-h-[7vh] p-1.5 text-left flex flex-col items-stretch transition hover:opacity-90 focus:outline-none"
                      style={{
                        backgroundColor: isSelected ? primary + '20' : isToday ? primary + '12' : fg,
                        color: dark,
                      }}
                    >
                      <Text variant="sm" className={`font-medium ${isCurrentMonth ? '' : 'opacity-40'}`} style={{ color: dark }}>
                        {date.getDate()}
                      </Text>
                      <div className="flex-1 mt-0.5 space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className="truncate rounded px-1 py-0.5 text-left"
                            style={{ backgroundColor: getEventColor(ev.type) + '30', color: dark, fontSize: 11 }}
                            title={`${ev.title} · ${formatTime(ev.start)}`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <Text variant="sm" className="opacity-60" style={{ fontSize: 11 }}>+{dayEvents.length - 3}</Text>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {viewMode === 'week' && (
              <div className="grid grid-cols-8 gap-px overflow-x-auto scroll-slim" style={{ minHeight: 420 }}>
                <div className="row-span-1 py-1.5" style={{ backgroundColor: fg }} />
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="py-0.5 pr-2 text-right"
                    style={{ backgroundColor: fg, color: dark, fontSize: 11 }}
                  >
                    <Text variant="sm" className="opacity-70">
                      {h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}
                    </Text>
                  </div>
                ))}
                {weekDays.map(({ date, iso }) => {
                  const dayEvents = events.filter((e) => eventOverlapsDay(e, iso))
                  const isToday = iso === todayIso
                  const isSelected = iso === selectedDate
                  const isCurrentMonth = date.getMonth() === month
                  return (
                    <div key={iso} className="contents">
                      <button
                        type="button"
                        onClick={() => setSelectedDate(iso)}
                        className="py-1.5 text-center"
                        style={{
                          backgroundColor: isSelected ? primary + '20' : fg,
                          color: dark,
                          fontWeight: isToday ? 600 : undefined,
                        }}
                      >
                        <Text variant="sm">{date.toLocaleDateString(undefined, { weekday: 'short' })}</Text>
                        <Text variant="sm" className={isCurrentMonth ? '' : 'opacity-50'} style={{ color: dark }}>
                          {date.getDate()}
                        </Text>
                      </button>
                      {HOURS.map((hour) => {
                        const slotStart = hour
                        const slotEnd = hour + 1
                        const inSlot = dayEvents.filter((ev) => {
                          const startH = getHoursDecimal(ev.start)
                          const endH = getHoursDecimal(ev.end)
                          return startH < slotEnd && endH > slotStart
                        })
                        return (
                          <div
                            key={`${iso}-${hour}`}
                            className="min-h-[28px]"
                            style={{ backgroundColor: fg }}
                          >
                            {inSlot.map((ev) => {
                              const startH = getHoursDecimal(ev.start)
                              const endH = getHoursDecimal(ev.end)
                              const top = Math.max(0, (startH - slotStart) / 1) * 100
                              const height = Math.min(1, (endH - Math.max(startH, slotStart)) / 1) * 100
                              return (
                                <div
                                  key={ev.id}
                                  className="absolute left-0 right-0 mx-0.5 rounded px-1 overflow-hidden"
                                  style={{
                                    top: `${top}%`,
                                    height: `${height}%`,
                                    minHeight: 18,
                                    backgroundColor: getEventColor(ev.type) + '35',
                                  }}
                                >
                                  <Text variant="sm" className="truncate block" style={{ fontSize: 11, color: dark }}>
                                    {ev.title}
                                  </Text>
                                  <Text variant="sm" className="opacity-80" style={{ fontSize: 11, color: dark }}>
                                    {formatTime(ev.start)}
                                  </Text>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}

            {viewMode === 'week' && (
              <div className="relative mt-2" style={{ minHeight: (WEEK_END_HOUR - WEEK_START_HOUR) * 28 }}>
                <div className="grid grid-cols-8 gap-px">
                  <div className="py-1.5" style={{ backgroundColor: fg }} />
                  {weekDays.map(({ date, iso }) => (
                    <div key={iso} className="py-1.5 text-center" style={{ backgroundColor: fg }}>
                      <Text variant="sm" className="font-medium" style={{ color: dark }}>
                        {date.toLocaleDateString(undefined, { weekday: 'short' })}
                      </Text>
                      <Text variant="sm" className="opacity-70" style={{ color: dark }}>
                        {date.getDate()}
                      </Text>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-8 gap-px mt-0 absolute inset-0 top-10" style={{ backgroundColor: 'transparent' }}>
                  <div />
                  {weekDays.map(({ iso }) => {
                    const dayEvents = events.filter((e) => eventOverlapsDay(e, iso))
                    return (
                      <div key={iso} className="relative" style={{ height: (WEEK_END_HOUR - WEEK_START_HOUR) * 28 }}>
                        {dayEvents.map((ev) => {
                          const startH = getHoursDecimal(ev.start)
                          const endH = getHoursDecimal(ev.end)
                          const topPx = (startH - WEEK_START_HOUR) * 28
                          const heightPx = (endH - startH) * 28
                          return (
                            <button
                              key={ev.id}
                              type="button"
                              onClick={() => setSelectedDate(iso)}
                              className="absolute left-0.5 right-0.5 rounded text-left px-1.5 py-0.5 overflow-hidden hover:opacity-90 transition"
                              style={{
                                top: Math.max(0, topPx),
                                height: Math.max(18, heightPx),
                                backgroundColor: getEventColor(ev.type) + '30',
                                color: dark,
                              }}
                            >
                              <span className="block truncate" style={{ fontSize: 11 }}>{ev.title}</span>
                              <span className="block opacity-80" style={{ fontSize: 11 }}>{formatTime(ev.start)}</span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Selected day panel */}
          <div className="flex flex-col gap-4 min-w-0 lg:w-[40%] w-full">
          <Card
            title={selectedDate ? new Date(selectedDate + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Pick a day'}
            subtitle={selectedDate ? `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''}` : undefined}
          >
            {selectedDate && (
              <ul className="space-y-0 max-h-[280px] overflow-y-auto scroll-slim">
                {selectedEvents.length === 0 ? (
                  <li>
                    <Text variant="sm" className="opacity-70">
                      No events this day.
                    </Text>
                  </li>
                ) : (
                  selectedEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex items-start justify-between gap-2 py-2.5 last:border-0"
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
                          {formatTime(ev.start)} – {formatTime(ev.end)}
                        </Text>
                        <span
                          className="inline-block mt-1 px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: getEventColor(ev.type) + '25', fontSize: 11, color: dark }}
                        >
                          {getEventTypeLabel(ev.type)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(ev)}
                        className="p-1.5 rounded-base opacity-60 hover:opacity-100 hover:bg-black/5 shrink-0"
                        aria-label={`Delete ${ev.title}`}
                      >
                        <Trash2 size={14} style={{ color: current?.system?.error || 'red' }} />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </Card>

          {selectedDate && user && (
            <Card title="Add event" subtitle="Create an event for this day">
              <form onSubmit={handleAddEvent} className="space-y-3">
                <Input label="Title" placeholder="Event title" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} required />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 items-start">
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
                      onChange={(t) => setAddStart(setDateTime(getDatePart(addStart) || selectedDate || '', t))}
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
                      onChange={(t) => setAddEnd(setDateTime(getDatePart(addEnd) || selectedDate || '', t))}
                      placement="below"
                    />
                  </div>
                </div>
                <CustomSelect
                  label="Type"
                  options={EVENT_TYPES}
                  value={addType}
                  onChange={(v) => setAddType(v as CalendarEvent['type'])}
                  placement="below"
                />
                <Button type="submit" label={submitting ? 'Adding…' : 'Add event'} fullWidth disabled={submitting} startIcon={<Plus size={16} />} />
              </form>
            </Card>
          )}
          </div>
        </div>
      </View>

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
