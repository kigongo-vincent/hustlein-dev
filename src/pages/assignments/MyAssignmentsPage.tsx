import { useEffect, useMemo, useState } from 'react'
import Text from '../../components/base/Text'
import View from '../../components/base/View'
import { Card, Button, Modal, Input, Textarea, EmptyState } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { assignmentService, billingService } from '../../services'
import type { MyAssignment } from '../../types'
import type { TimesheetEntry } from '../../types'
import { BriefcaseBusiness, ArrowRight, Clock, CheckCircle, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router'

function formatMoney(amount?: number, currency = 'UGX') {
  if (amount == null || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

const MyAssignmentsPage = () => {
  const { current } = Themestore()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<MyAssignment[]>([])
  const [logFor, setLogFor] = useState<MyAssignment | null>(null)
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [minutes, setMinutes] = useState('60')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [recentByAssignment, setRecentByAssignment] = useState<Record<string, TimesheetEntry[]>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await assignmentService.listMine()
        if (!cancelled) setItems(list)
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const active = useMemo(() => items.filter((a) => a.status === 'active'), [items])
  const fixedContracts = useMemo(() => items.filter((a) => a.billingType === 'fixed').length, [items])
  const hourlyContracts = useMemo(() => items.filter((a) => a.billingType !== 'fixed').length, [items])

  const openLog = async (a: MyAssignment) => {
    setLogFor(a)
    setWorkDate(new Date().toISOString().slice(0, 10))
    setMinutes('60')
    setNotes('')
    try {
      const rec = await billingService.listTimesheets(a.id, { status: 'submitted' })
      setRecentByAssignment((prev) => ({ ...prev, [a.id]: rec.slice(0, 10) }))
    } catch {
      // ignore
    }
  }

  const saveLog = async () => {
    if (!logFor) return
    const mins = Number(minutes)
    if (!workDate || !mins || mins <= 0) return
    setSaving(true)
    try {
      const created = await billingService.createTimesheet(logFor.id, { workDate, minutes: mins, notes })
      setRecentByAssignment((prev) => ({ ...prev, [logFor.id]: [created, ...(prev[logFor.id] ?? [])].slice(0, 10) }))
      setLogFor(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full mx-auto space-y-4">
      <View bg="bg" className="p-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className="w-9 h-9 rounded-base flex items-center justify-center"
                style={{
                  backgroundColor: current?.system?.background ?? 'rgba(0,0,0,0.04)',
                }}
              >
                <BriefcaseBusiness className="w-5 h-5" style={{ color: current?.system?.dark }} />
              </span>
              <Text className="font-medium">Contracts</Text>
            </div>
            <Text variant="sm" className="opacity-80">
              Your active engagements across companies.
            </Text>
          </div>
        </div>
      </View>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="min-h-[7rem] py-4 px-4" noShadow>
              <Text variant="sm" className="opacity-50">—</Text>
              <div className="h-2" />
              <Text className="font-medium">—</Text>
              <Text variant="sm" className="opacity-50 mt-1">—</Text>
            </Card>
          ))
        ) : (
          [
            { label: 'Active contracts', value: String(active.length), caption: 'Currently running', icon: CheckCircle },
            { label: 'Total contracts', value: String(items.length), caption: 'Across companies', icon: BriefcaseBusiness },
            { label: 'Hourly contracts', value: String(hourlyContracts), caption: 'Time-based billing', icon: Clock },
            { label: 'Fixed contracts', value: String(fixedContracts), caption: 'Milestone/fixed scope', icon: Building2 },
          ].map((s) => (
            <Card key={s.label} title={s.label} rightIcon={<s.icon className="w-4 h-4" />} className="min-h-[7rem] py-4 px-4" noShadow>
              <Text className="font-medium">{s.value}</Text>
              <Text variant="sm" className="opacity-70 mt-1">{s.caption}</Text>
            </Card>
          ))
        )}
      </div>

      <Card title="Engagements" subtitle="Projects you’re hired on" className="p-0 overflow-hidden" noShadow>
        {loading ? (
          <div className="p-6">
            <Text variant="sm" className="opacity-70">
              Loading…
            </Text>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            variant="assignment"
            title="No contracts yet"
            description="Get hired from the marketplace first."
            className="p-8"
          >
            <Button label="Browse marketplace" onClick={() => navigate('/app/marketplace')} />
          </EmptyState>
        ) : (
          <div>
            {items.map((a) => (
              <div
                key={a.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b last:border-b-0"
                style={{ borderColor: current?.system?.border ?? 'rgba(0,0,0,0.06)' }}
              >
                <div className="min-w-0">
                  <Text className="font-medium">{a.projectName}</Text>
                  <Text variant="sm" className="opacity-70 mt-0.5">
                    {a.companyName} • {a.status.toUpperCase()} • {a.billingType.toUpperCase()}
                  </Text>
                  <Text variant="sm" className="opacity-80 mt-2">
                    {a.billingType !== 'fixed'
                      ? `Hourly: ${formatMoney(a.hourlyRate, a.currency)}`
                      : `Fixed: ${formatMoney(a.fixedBudget, a.currency)}`}
                  </Text>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="background"
                    label="Log time"
                    startIcon={<Clock className="w-4 h-4 shrink-0" />}
                    onClick={() => openLog(a)}
                    disabled={a.status !== 'active'}
                  />
                  <Button
                    size="sm"
                    variant="background"
                    label="Open project"
                    startIcon={<ArrowRight className="w-4 h-4 shrink-0" />}
                    onClick={() => navigate(`/app/projects/${a.projectId}`)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={!!logFor} onClose={() => !saving && setLogFor(null)} variant="wide">
        <div className="p-6 space-y-4">
          <Text className="font-semibold">Log time</Text>
          <Text variant="sm" className="opacity-75">
            {logFor ? `${logFor.projectName} • ${logFor.companyName}` : ''}
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Work date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} placeholder="YYYY-MM-DD" />
            <Input label="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="e.g. 90" />
          </div>
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you work on?" />

          {logFor && (recentByAssignment[logFor.id]?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <Text variant="sm" className="font-medium opacity-90">
                Recent submitted entries
              </Text>
              <div className="space-y-1">
                {recentByAssignment[logFor.id]!.slice(0, 5).map((t) => (
                  <div key={t.id} className="text-sm opacity-80">
                    {t.workDate} • {t.minutes} min {t.notes ? `• ${t.notes}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="background" onClick={() => setLogFor(null)} />
            <Button label="Submit" onClick={saveLog} disabled={saving} loading={saving} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MyAssignmentsPage

