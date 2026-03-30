import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Card, Button, Modal, Input, AlertModal, Skeleton, EmptyState } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { departmentService } from '../../services'
import type { Department } from '../../types'
import { Plus, Pencil, Trash2, Building2, FileText, Layers, Hash } from 'lucide-react'

const chartTickStyle = { fontSize: 12 }

function getStatIcon(label: string) {
  const n = label.toLowerCase()
  if (n.includes('total') || n.includes('departments')) return <Building2 />
  if (n.includes('description')) return <FileText />
  if (n.includes('without')) return <Layers />
  if (n.includes('company')) return <Hash />
  return <Building2 />
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace(/^#/, '').match(/.{2}/g)
  if (!m) return [0, 0, 0]
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)]
}
function mixHex(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA)
  const [r2, g2, b2] = hexToRgb(hexB)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}
function getChartColors(primary: string, secondary: string, count = 4): string[] {
  const primaryHex = primary || '#682308'
  const secondaryHex = secondary || '#FF9600'
  const colors: string[] = []
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : i / (count - 1)
    colors.push(mixHex(primaryHex, secondaryHex, t))
  }
  return colors
}

export default function DepartmentsPage() {
  const { current, mode } = Themestore()
  const user = Authstore((s) => s.user)
  const dark = current?.system?.dark

  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchDepartments = useCallback(() => {
    if (!user?.companyId) return
    setLoading(true)
    departmentService.listByCompany(user.companyId).then((list) => {
      setDepartments(list)
      setLoading(false)
    })
  }, [user?.companyId])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDescription('')
    setFormOpen(true)
  }

  const openEdit = (d: Department) => {
    setEditing(d)
    setName(d.name)
    setDescription(d.description ?? '')
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!user?.companyId || !name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await departmentService.update(editing.id, { name: name.trim(), description: description.trim() || undefined })
      } else {
        await departmentService.create({
          companyId: user.companyId,
          name: name.trim(),
          description: description.trim() || undefined,
        })
      }
      setFormOpen(false)
      fetchDepartments()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    await departmentService.remove(deleteId)
    setDeleteId(null)
    fetchDepartments()
  }

  const sorted = useMemo(() => [...departments].sort((a, b) => a.name.localeCompare(b.name)), [departments])
  const totalDepartments = departments.length
  const withDescription = departments.filter((d) => (d.description ?? '').trim().length > 0).length
  const withoutDescription = totalDepartments - withDescription
  const statCards = [
    { label: 'Total departments', value: totalDepartments, caption: 'Company-wide' },
    { label: 'With description', value: withDescription, caption: 'Have details set' },
    { label: 'Without description', value: withoutDescription, caption: 'No details yet' },
    { label: 'Departments', value: totalDepartments, caption: 'In company' },
  ]

  const byDescriptionData = [
    { name: 'With description', count: withDescription },
    { name: 'Without', count: withoutDescription },
  ].filter((d) => d.count > 0)
  const trendData = [
    { week: 'W1', count: Math.max(0, totalDepartments - 2) },
    { week: 'W2', count: Math.max(0, totalDepartments - 1) },
    { week: 'W3', count: totalDepartments },
    { week: 'W4', count: totalDepartments },
  ]
  const chartPrimary = mode === 'dark' ? (dark ?? '#e0e0e0') : (current?.brand?.primary ?? '#682308')
  const secondaryColor = current?.brand?.secondary ?? '#FF9600'
  const chartColors = getChartColors(chartPrimary, secondaryColor, Math.max(byDescriptionData.length, 2))
  const tickProps = dark ? { ...chartTickStyle, fill: dark } : chartTickStyle
  const gridColor = dark ? `${dark}40` : 'rgba(0,0,0,0.08)'
  const tooltipContentStyle = {
    fontSize: 13.5,
    backgroundColor: current?.system?.foreground,
    border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
    borderRadius: 4,
    color: dark,
  }
  const tooltipCursor =
    mode === 'dark'
      ? { fill: dark ? `${dark}18` : 'rgba(255,255,255,0.06)', stroke: current?.system?.border ?? 'rgba(255,255,255,0.08)' }
      : { fill: 'rgba(0,0,0,0.04)', stroke: current?.system?.border ?? 'rgba(0,0,0,0.1)' }

  return (
    <div className="w-full mx-auto space-y-4">
      <View bg="bg" className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Text className="font-medium">Departments</Text>
            <Text variant="sm" className="opacity-80">
              Manage departments and assign consultants
            </Text>
          </div>
          <Button size="sm" label="Add department" startIcon={<Plus className="w-4 h-4 shrink-0" />} onClick={openCreate} />
        </div>
      </View>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
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
              rightIcon={getStatIcon(s.label)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="By description" subtitle="With vs without details" className="px-4 pb-4">
          <div className="h-[280px] w-full">
            {loading ? (
              <div className="h-full w-full flex flex-col justify-end gap-3 pb-8">
                {[60, 80].map((pct, i) => (
                  <Skeleton key={i} height="h-6" className="max-w-full" style={{ width: `${pct}%` }} />
                ))}
              </div>
            ) : byDescriptionData.length === 0 ? (
              <EmptyState variant="chart" compact description="No departments yet" className="h-full min-h-[200px]" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDescriptionData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={tickProps} />
                  <YAxis tick={tickProps} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number | undefined) => [value ?? 0, 'Count']}
                    contentStyle={tooltipContentStyle}
                    cursor={tooltipCursor}
                  />
                  <Bar key="count" dataKey="count" radius={[4, 4, 0, 0]}>
                    {byDescriptionData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card title="Departments over time" subtitle="Count over recent weeks" className="px-4 pb-4">
          <div className="h-[280px] w-full">
            {loading ? (
              <div className="h-full w-full flex flex-col justify-end gap-3 pb-8">
                {[50, 70, 60, 85].map((pct, i) => (
                  <Skeleton key={i} height="h-6" className="max-w-full" style={{ width: `${pct}%` }} />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="week" tick={tickProps} />
                  <YAxis tick={tickProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipContentStyle} cursor={tooltipCursor} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={chartPrimary}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Departments"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card title="All departments" subtitle="Company departments used for consultant assignment" className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <Text variant="sm" className="opacity-70">
              Loading…
            </Text>
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState variant="generic" title="No departments yet" description="Add a department to organize your team." className="p-8" />
        ) : (
          <div className="overflow-x-auto scroll-slim">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}` }}>
                  <th className="text-left px-4 py-3">
                    <Text variant="sm" className="font-medium">Name</Text>
                  </th>
                  <th className="text-left px-4 py-3">
                    <Text variant="sm" className="font-medium">Description</Text>
                  </th>
                  <th className="text-right px-4 py-3 w-[1%] whitespace-nowrap">
                    <Text variant="sm" className="font-medium">Actions</Text>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d, i) => (
                  <tr
                    key={d.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? current?.system?.foreground : current?.system?.background,
                      ...(mode === 'dark' && { borderBottom: `1px solid ${current?.system?.border ?? 'rgba(255,255,255,0.08)'}` }),
                    }}
                  >
                    <td className="px-4 py-3">
                      <Text className="font-medium">{d.name}</Text>
                    </td>
                    <td className="px-4 py-3">
                      <Text variant="sm" className="opacity-80">
                        {d.description ?? '—'}
                      </Text>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(d)}
                          className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
                          style={{ color: dark }}
                          aria-label={`Edit ${d.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(d.id)}
                          className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
                          style={{ color: current?.system?.error ?? '#b91c1c' }}
                          aria-label={`Delete ${d.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={formOpen} onClose={() => !saving && setFormOpen(false)}>
        <div className="p-6" style={{ backgroundColor: current?.system?.foreground }}>
          <h2 className="font-medium mb-4" style={{ fontSize: baseFontSize * 1.2, color: dark }}>
            {editing ? 'Edit department' : 'Add department'}
          </h2>
          <div className="space-y-4">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering" />
            <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this department is for" />
          </div>
          <footer className="flex justify-end gap-2 pt-4 mt-4 border-t" style={{ borderColor: current?.system?.border }}>
            <Button variant="background" label="Cancel" onClick={() => !saving && setFormOpen(false)} disabled={saving} />
            <Button label="Save" onClick={handleSave} disabled={saving || !name.trim()} loading={saving} />
          </footer>
        </div>
      </Modal>

      <AlertModal
        open={!!deleteId}
        title="Delete department"
        message="Delete this department? Consultants assigned to it will remain but the department reference will be removed."
        confirmLabel="Delete"
        variant="error"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}

