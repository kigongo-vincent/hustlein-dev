import { useEffect, useMemo, useState } from 'react'
import Text, { baseFontSize } from '../../components/base/Text'
import { Button, Card, CustomSelect, Input, Modal } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { billingService } from '../../services'
import type { BillingMilestone, Invoice, ProjectAssignment, TimesheetEntry } from '../../types'
import { CheckCircle2, FileText, Receipt, Plus } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

function minutesToHours(m: number) {
  return Math.round((m / 60) * 100) / 100
}

export default function ProjectBillingModal({ open, onClose, projectId, projectName }: Props) {
  const { current } = Themestore()
  const dark = current?.system?.dark

  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [assignmentId, setAssignmentId] = useState('')
  const [loading, setLoading] = useState(false)

  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([])
  const [milestones, setMilestones] = useState<BillingMilestone[]>([])

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null)

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [newMilestoneAmount, setNewMilestoneAmount] = useState('')
  const [newMilestoneDue, setNewMilestoneDue] = useState('')
  const [newMilestoneCurrency, setNewMilestoneCurrency] = useState('UGX')

  const assignmentOptions = useMemo(
    () =>
      assignments.map((a) => ({
        value: a.id,
        label: `${a.billingType.toUpperCase()} • ${a.freelancerId.slice(0, 8)}…`,
      })),
    [assignments]
  )

  const selected = useMemo(
    () => assignments.find((a) => a.id === assignmentId) ?? null,
    [assignments, assignmentId]
  )

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setLastInvoice(null)
    ;(async () => {
      try {
        const list = await billingService.listProjectAssignments(projectId)
        setAssignments(list)
        if (!assignmentId && list.length > 0) setAssignmentId(list[0].id)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId])

  const reloadDetails = async (aid: string) => {
    if (!aid) return
    setLoading(true)
    try {
      const [ts, ms] = await Promise.all([
        billingService.listTimesheets(aid, { status: 'submitted' }),
        billingService.listMilestones(aid),
      ])
      setTimesheets(ts)
      setMilestones(ms)
      setNewMilestoneCurrency(selected?.currency ?? 'UGX')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !assignmentId) return
    reloadDetails(assignmentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assignmentId])

  const approveTimesheet = async (id: string) => {
    setLoading(true)
    try {
      await billingService.approveTimesheet(id)
      await reloadDetails(assignmentId)
    } finally {
      setLoading(false)
    }
  }

  const approveMilestone = async (id: string) => {
    setLoading(true)
    try {
      await billingService.approveMilestone(id)
      await reloadDetails(assignmentId)
    } finally {
      setLoading(false)
    }
  }

  const createMilestone = async () => {
    if (!assignmentId || !newMilestoneTitle.trim() || !newMilestoneAmount) return
    setLoading(true)
    try {
      await billingService.createMilestone(assignmentId, {
        title: newMilestoneTitle.trim(),
        amount: Number(newMilestoneAmount),
        currency: newMilestoneCurrency || selected?.currency || 'UGX',
        dueDate: newMilestoneDue || undefined,
      })
      setNewMilestoneTitle('')
      setNewMilestoneAmount('')
      setNewMilestoneDue('')
      await reloadDetails(assignmentId)
    } finally {
      setLoading(false)
    }
  }

  const generateInvoice = async () => {
    if (!assignmentId) return
    setLoading(true)
    try {
      const inv = await billingService.generateInvoice(assignmentId, { from: from || undefined, to: to || undefined })
      setLastInvoice(inv)
      await reloadDetails(assignmentId)
    } finally {
      setLoading(false)
    }
  }

  const submittedMinutes = timesheets.reduce((s, t) => s + (t.minutes ?? 0), 0)

  return (
    <Modal open={open} onClose={() => !loading && onClose()} variant="wide">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.15, color: dark }}>
              Billing • {projectName}
            </Text>
            <Text variant="sm" className="opacity-75" style={{ color: dark }}>
              Approve timesheets/milestones and generate an invoice.
            </Text>
          </div>
          <Button label="Close" variant="background" onClick={onClose} />
        </div>

        <Card className="p-4">
          <CustomSelect
            label="Assignment"
            options={assignmentOptions}
            value={assignmentId}
            onChange={(v) => setAssignmentId(v || '')}
            placement="below"
            placeholder={assignments.length === 0 ? 'No assignments yet' : 'Select assignment'}
          />
          {selected && (
            <Text variant="sm" className="opacity-75 mt-2">
              Billing: {selected.billingType.toUpperCase()} • Currency: {selected.currency}
            </Text>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="Timesheets (submitted)" subtitle={`${minutesToHours(submittedMinutes)}h pending approval`} className="p-4">
            {timesheets.length === 0 ? (
              <Text variant="sm" className="opacity-70">No submitted entries.</Text>
            ) : (
              <div className="space-y-2">
                {timesheets.slice(0, 12).map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Text variant="sm" className="font-medium">{t.workDate} • {t.minutes} min</Text>
                      {t.notes && <Text variant="sm" className="opacity-75 line-clamp-2">{t.notes}</Text>}
                    </div>
                    <Button
                      size="sm"
                      label="Approve"
                      startIcon={<CheckCircle2 className="w-4 h-4 shrink-0" />}
                      onClick={() => approveTimesheet(t.id)}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Milestones (billing)" subtitle="Create and approve fixed milestones" className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Input label="Title" value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)} />
              <Input label="Amount" value={newMilestoneAmount} onChange={(e) => setNewMilestoneAmount(e.target.value)} />
              <Input label="Due date" value={newMilestoneDue} onChange={(e) => setNewMilestoneDue(e.target.value)} placeholder="YYYY-MM-DD" />
              <Input label="Currency" value={newMilestoneCurrency} onChange={(e) => setNewMilestoneCurrency(e.target.value.toUpperCase())} />
            </div>
            <Button
              size="sm"
              label="Add milestone"
              startIcon={<Plus className="w-4 h-4 shrink-0" />}
              onClick={createMilestone}
              disabled={loading || !newMilestoneTitle.trim() || !newMilestoneAmount}
            />

            <div className="mt-4 space-y-2">
              {milestones.length === 0 ? (
                <Text variant="sm" className="opacity-70">No billing milestones yet.</Text>
              ) : (
                milestones.slice(0, 10).map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Text variant="sm" className="font-medium">{m.title} • {m.amount} {m.currency}</Text>
                      <Text variant="sm" className="opacity-75">
                        {m.status.toUpperCase()}{m.dueDate ? ` • Due ${m.dueDate}` : ''}
                      </Text>
                    </div>
                    {m.status === 'pending' ? (
                      <Button size="sm" label="Approve" startIcon={<CheckCircle2 className="w-4 h-4 shrink-0" />} onClick={() => approveMilestone(m.id)} disabled={loading} />
                    ) : (
                      <span className="text-xs opacity-70" style={{ color: dark }}>—</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card title="Generate invoice" subtitle="Benchmarked: invoice from approved hours + milestones" className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="From" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="YYYY-MM-DD" />
            <Input label="To" value={to} onChange={(e) => setTo(e.target.value)} placeholder="YYYY-MM-DD" />
            <div className="flex items-end">
              <Button
                label="Generate invoice"
                startIcon={<Receipt className="w-4 h-4 shrink-0" />}
                onClick={generateInvoice}
                disabled={loading || !assignmentId}
              />
            </div>
          </div>
          {lastInvoice && (
            <div className="mt-3 flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5" style={{ color: current?.system?.success }} />
              <div className="min-w-0">
                <Text variant="sm" className="font-medium">Invoice created: {lastInvoice.number}</Text>
                <Text variant="sm" className="opacity-75">Amount: {lastInvoice.amount} {lastInvoice.currency} • Due {lastInvoice.dueDate}</Text>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Modal>
  )
}

