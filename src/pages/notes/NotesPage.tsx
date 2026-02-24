import { useCallback, useEffect, useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import Text, { baseFontSize } from '../../components/base/Text'
import View from '../../components/base/View'
import { Card, Button, Modal, AlertModal, Input, RichTextEditor, NoteCard, Skeleton } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { noteService } from '../../services'
import type { Note, NoteColor } from '../../types'
import { NOTE_COLORS } from '../../types'
import { StickyNote, Plus, Pencil, Trash2, BarChart3 } from 'lucide-react'

const chartTickStyle = { fontSize: 12 }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function getWeekKey(iso: string): string {
  const d = new Date(iso)
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  return start.toISOString().slice(0, 10)
}

export default function NotesPage() {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const borderColor = current?.system?.border ?? 'rgba(0,0,0,0.1)'
  const primary = current?.brand?.primary ?? '#682308'
  const secondary = current?.brand?.secondary ?? '#FF9600'

  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formColor, setFormColor] = useState<NoteColor>(NOTE_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)

  const fetchNotes = useCallback(() => {
    setLoading(true)
    noteService.list().then((list) => {
      setNotes(list)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const openCreate = () => {
    setEditingId(null)
    setFormTitle('')
    setFormContent('')
    setFormColor(NOTE_COLORS[0])
    setFormOpen(true)
  }

  const openEdit = (n: Note) => {
    setEditingId(n.id)
    setFormTitle(n.title)
    setFormContent(n.content)
    setFormColor((NOTE_COLORS as readonly string[]).includes(n.color) ? (n.color as NoteColor) : NOTE_COLORS[0])
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!formTitle.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        const updated = await noteService.update(editingId, {
          title: formTitle.trim(),
          content: formContent,
          color: formColor,
        })
        if (updated) setNotes((prev) => prev.map((n) => (n.id === editingId ? updated : n)))
      } else {
        const created = await noteService.create({
          title: formTitle.trim(),
          content: formContent,
          color: formColor,
        })
        setNotes((prev) => [created, ...prev])
      }
      setFormOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    const ok = await noteService.remove(deleteId)
    if (ok) setNotes((prev) => prev.filter((n) => n.id !== deleteId))
    setDeleteId(null)
  }

  const handleColorChange = useCallback((id: string, color: string) => {
    noteService.update(id, { color }).then((updated) => {
      if (updated) setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
    })
  }, [])

  const statCards = useMemo(() => {
    const total = notes.length
    const thisWeek = notes.filter((n) => {
      const t = new Date(n.createdAt).getTime()
      const weekAgo = Date.now() - 7 * 86400000
      return t >= weekAgo
    }).length
    const byColor = NOTE_COLORS.reduce<Record<string, number>>((acc, c) => {
      acc[c] = notes.filter((n) => n.color === c).length
      return acc
    }, {})
    const topColor = NOTE_COLORS.map((c) => ({ color: c, count: byColor[c] ?? 0 })).sort((a, b) => b.count - a.count)[0]
    return [
      { label: 'Total notes', value: total, caption: 'All notes' },
      { label: 'This week', value: thisWeek, caption: 'Created in last 7 days' },
      { label: 'Top color', value: topColor?.count ?? 0, caption: topColor ? `Most used: ${topColor.color}` : '—' },
    ]
  }, [notes])

  const chartDataByWeek = useMemo(() => {
    const byWeek: Record<string, number> = {}
    notes.forEach((n) => {
      const k = getWeekKey(n.createdAt)
      byWeek[k] = (byWeek[k] ?? 0) + 1
    })
    const sorted = Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
    return sorted.map(([week, count]) => ({
      week: new Date(week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count,
    }))
  }, [notes])

  const chartDataByColor = useMemo(() => {
    return NOTE_COLORS.map((c) => ({
      name: c,
      count: notes.filter((n) => n.color === c).length,
    }))
  }, [notes])

  const chartDataByDayLast7 = useMemo(() => {
    const out: { day: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const dayEnd = dayStart + 86400000
      const count = notes.filter((n) => {
        const t = new Date(n.createdAt).getTime()
        return t >= dayStart && t < dayEnd
      }).length
      out.push({
        day: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        count,
      })
    }
    return out
  }, [notes])

  const chartDataLast14Days = useMemo(() => {
    const out: { date: string; created: number; updated: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const dayEnd = dayStart + 86400000
      const created = notes.filter((n) => {
        const t = new Date(n.createdAt).getTime()
        return t >= dayStart && t < dayEnd
      }).length
      const updated = notes.filter((n) => {
        const t = new Date(n.updatedAt).getTime()
        return t >= dayStart && t < dayEnd && new Date(n.createdAt).getTime() < dayStart
      }).length
      out.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        created,
        updated,
      })
    }
    return out
  }, [notes])

  const gridColor = dark ? `${dark}18` : 'rgba(0,0,0,0.08)'
  const fg = current?.system?.foreground ?? '#fff'
  const tooltipStyle = {
    fontSize: 13.5,
    backgroundColor: fg,
    border: `1px solid ${borderColor}`,
    borderRadius: 4,
  }

  const renderChartByWeek = () =>
    chartDataByWeek.length === 0 ? (
      <div className="h-[200px] flex items-center justify-center">
        <Text variant="sm" className="opacity-70" style={{ color: dark }}>No data yet</Text>
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartDataByWeek} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="week" tick={{ ...chartTickStyle, fill: dark }} />
          <YAxis tick={{ ...chartTickStyle, fill: dark }} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill={primary} radius={[4, 4, 0, 0]} name="Notes" />
        </BarChart>
      </ResponsiveContainer>
    )

  const renderChartByColor = () =>
    notes.length === 0 ? (
      <div className="h-[200px] flex items-center justify-center">
        <Text variant="sm" className="opacity-70" style={{ color: dark }}>No data yet</Text>
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartDataByColor} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="name" hide />
          <YAxis tick={{ ...chartTickStyle, fill: dark }} allowDecimals={false} />
          <Tooltip formatter={(v: number | undefined) => [v ?? 0, 'Notes']} contentStyle={tooltipStyle} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartDataByColor.map((entry) => (
              <Cell key={entry.name} fill={entry.name} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )

  const renderChartByDayLast7 = () => (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartDataByDayLast7} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="day" tick={{ ...chartTickStyle, fill: dark }} />
        <YAxis tick={{ ...chartTickStyle, fill: dark }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill={secondary} radius={[4, 4, 0, 0]} name="Created" />
      </BarChart>
    </ResponsiveContainer>
  )

  const renderChartLast14Days = () => (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartDataLast14Days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="date" tick={{ ...chartTickStyle, fill: dark }} />
        <YAxis tick={{ ...chartTickStyle, fill: dark }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="created" stroke={primary} strokeWidth={2} dot={{ r: 3 }} name="Created" />
        <Line type="monotone" dataKey="updated" stroke={secondary} strokeWidth={2} dot={{ r: 3 }} name="Updated" />
      </LineChart>
    </ResponsiveContainer>
  )

  return (
    <div className="w-full h-full mx-auto flex flex-col min-h-0">
      <div className="shrink-0 space-y-4">
        <View bg="bg" className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Text className="font-medium">Notes</Text>
              <Text variant="sm" className="opacity-80">
                Create and manage notes; change color instantly.
              </Text>
            </div>
            <div className="flex items-center gap-2 flex-nowrap">
              <Button
                size="sm"
                label="Add note"
                startIcon={<Plus className="w-4 h-4 shrink-0" />}
                onClick={openCreate}
              />
              <Button
                variant="secondary"
                size="sm"
                label="View analytics"
                startIcon={<BarChart3 className="w-4 h-4 shrink-0" />}
                onClick={() => setAnalyticsOpen(true)}
              />
            </div>
          </div>
        </View>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <Card key={i} className="min-h-[7rem] py-4 px-4">
                <Skeleton height="h-4" width="w-24" className="mb-2" />
                <Skeleton height="h-4" width="w-16" className="mb-1" />
                <Skeleton height="h-8" width="w-12" />
              </Card>
            ))
          ) : (
            statCards.map((s) => (
              <Card
                key={s.label}
                title={s.label}
                rightIcon={<StickyNote className="w-5 h-5 opacity-80" />}
                className="min-h-[7rem] py-4 px-4"
              >
                <Text variant="lg" className="font-medium" style={{ fontSize: baseFontSize * 1.5 }}>
                  {s.value}
                </Text>
                <Text variant="sm" className="opacity-55 mt-0.5">
                  {s.caption}
                </Text>
              </Card>
            ))
          )}
        </div>
      </div>

      <Card
        title="All notes"
        subtitle="Click to edit; change color from the card."
        className="p-0 overflow-hidden flex-1 min-h-0 flex flex-col mt-5"
      >
        <div className="flex-1 min-h-0 overflow-auto scroll-slim">
          <div className="overflow-x-auto scroll-slim">
            <table className="w-full border-collapse" style={{ borderColor }}>
              <thead>
                <tr style={{ backgroundColor: current?.system?.background }}>
                  <th className="text-left py-2.5 px-3 font-medium" style={{ fontSize: baseFontSize, color: dark }}>
                    Note
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium w-28" style={{ fontSize: baseFontSize, color: dark }}>
                    Updated
                  </th>
                  <th className="text-right py-2.5 px-3 font-medium w-24" style={{ fontSize: baseFontSize, color: dark }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr
                      key={i}
                      className="border-t"
                      style={{ borderColor, backgroundColor: current?.system?.foreground }}
                    >
                      <td className="py-2 px-3 align-middle">
                        <div className="flex items-center gap-3 max-w-[280px]">
                          <Skeleton height="h-10" width="w-10" rounded="base" className="shrink-0" />
                          <div className="flex-1 space-y-1 min-w-0">
                            <Skeleton height="h-4" width="w-32" />
                            <Skeleton height="h-3" width="w-48" />
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <Skeleton height="h-4" width="w-20" />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Skeleton height="h-6" width="w-16" className="ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : notes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center opacity-70" style={{ color: dark }}>
                      No notes yet. Click “Add note” to create one.
                    </td>
                  </tr>
                ) : (
                  notes.map((n) => (
                    <tr
                      key={n.id}
                      className="border-t hover:opacity-90"
                      style={{ borderColor, backgroundColor: current?.system?.foreground }}
                    >
                      <td className="py-2 px-3 align-middle">
                        <div className="max-w-[280px]">
                          <NoteCard
                            title={n.title}
                            content={n.content}
                            color={n.color}
                            variant="compact"
                            showColorPicker={true}
                            onColorChange={(c) => handleColorChange(n.id, c)}
                            onClick={() => openEdit(n)}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3" style={{ fontSize: baseFontSize, color: dark }}>
                        {formatDate(n.updatedAt)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(n)}
                            className="p-2 rounded-base opacity-80 hover:opacity-100"
                            style={{ color: dark }}
                            aria-label="Edit note"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(n.id)}
                            className="p-2 rounded-base opacity-80 hover:opacity-100"
                            style={{ color: current?.system?.error ?? 'red' }}
                            aria-label="Delete note"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Modal open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} closeOnBackdrop variant="wide">
        <div className="p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: fg }}>
          <h3 className="font-semibold shrink-0" style={{ fontSize: baseFontSize * 1.15, color: dark }}>
            Notes analytics
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Notes over time" subtitle="Created per week" className="px-4 pb-4">
              {renderChartByWeek()}
            </Card>
            <Card title="By color" subtitle="Notes per color" className="px-4 pb-4">
              {renderChartByColor()}
            </Card>
            <Card title="Last 7 days" subtitle="Created per day" className="px-4 pb-4">
              {renderChartByDayLast7()}
            </Card>
            <Card title="Last 14 days" subtitle="Created vs updated" className="px-4 pb-4">
              {renderChartLast14Days()}
            </Card>
          </div>
        </div>
      </Modal>

      <Modal open={formOpen} onClose={() => !saving && setFormOpen(false)} closeOnBackdrop variant="wide">
        <div
          className="p-6 flex flex-col gap-4 min-h-0 max-h-[85vh] overflow-y-auto scroll-slim"
          style={{ backgroundColor: fg }}
        >
          <h3 className="font-semibold shrink-0" style={{ fontSize: baseFontSize * 1.15, color: dark }}>
            {editingId ? 'Edit note' : 'New note'}
          </h3>
          <Input
            label="Title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Note title"
            labelBackgroundColor={fg}
          />
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Text variant="sm" className="font-medium opacity-90" style={{ color: dark }}>
                Background
              </Text>
              <div className="flex flex-wrap gap-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className="w-7 h-7 rounded-base border-2 shrink-0"
                    style={{
                      backgroundColor: c,
                      borderColor: formColor === c ? primary : 'transparent',
                    }}
                    aria-label={`Color ${c}`}
                  >
                    {formColor === c && <span className="text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <RichTextEditor
              label=""
              placeholder="Write your note… Headings, lists, quotes, code blocks and links are supported."
              value={formContent}
              onChange={setFormContent}
              minHeight="220px"
              toolbarPreset="full"
              mode="fill"
              borderless
              contentBackgroundColor={formColor}
              contentFontFamily="'Comic Sans MS', 'Comic Neue', Chalkboard, cursive"
              contentFontSize={16}
              enableMentions
              className="min-h-0 flex flex-col [&>div]:min-h-0 [&>div]:flex-1 [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror]:flex-1"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 shrink-0">
            <Button variant="secondaryBrand" label="Cancel" onClick={() => !saving && setFormOpen(false)} disabled={saving} />
            <Button label={saving ? 'Saving…' : editingId ? 'Save' : 'Create'} onClick={handleSave} disabled={saving || !formTitle.trim()} />
          </div>
        </div>
      </Modal>

      <AlertModal
        open={!!deleteId}
        title="Delete note"
        message={deleteId ? 'Delete this note? This cannot be undone.' : ''}
        confirmLabel="Delete"
        variant="error"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}

