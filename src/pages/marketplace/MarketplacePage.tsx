import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import Text, { baseFontSize } from '../../components/base/Text'
import View from '../../components/base/View'
import { Card, Button, Input, Modal, Textarea, CustomSelect } from '../../components/ui'
import { Themestore, type ThemeI } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import type { ProjectPosting, ProjectApplication, User } from '../../types'
import { BriefcaseBusiness, Plus, Send, Users, CheckCircle2, XCircle } from 'lucide-react'

const BUDGET_OPTIONS = [
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'fixed', label: 'Fixed' },
] as const

function formatMoney(value?: number, currency = 'UGX') {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function budgetLabel(p: ProjectPosting) {
  const cur = p.currency || 'UGX'
  if (p.budgetType === 'hourly') return `${formatMoney(p.hourlyMin, cur)} – ${formatMoney(p.hourlyMax, cur)} / hr`
  if (p.budgetType === 'fixed') return `${formatMoney(p.fixedMin, cur)} – ${formatMoney(p.fixedMax, cur)}`
  return `Hourly ${formatMoney(p.hourlyMin, cur)}–${formatMoney(p.hourlyMax, cur)} + Fixed ${formatMoney(p.fixedMin, cur)}–${formatMoney(p.fixedMax, cur)}`
}

function nowIso() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

const MOCK_COMPANY_ID = 'co_demo'

const MOCK_POSTINGS: ProjectPosting[] = [
  {
    id: 'mp_1',
    companyId: MOCK_COMPANY_ID,
    createdById: 'u_company_admin',
    title: 'Frontend Engineer (React + Tailwind)',
    description: 'Build responsive dashboards and improve UI performance. Strong React patterns and component design required.',
    budgetType: 'hourly',
    hourlyMin: 45000,
    hourlyMax: 120000,
    currency: 'UGX',
    requiredSkills: ['React', 'TypeScript', 'Tailwind', 'UX'],
    status: 'open',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'mp_2',
    companyId: MOCK_COMPANY_ID,
    createdById: 'u_project_lead',
    title: 'Go API: Marketplace endpoints',
    description: 'Implement posting/applications endpoints + validation. Bonus for Postgres experience and clean service boundaries.',
    budgetType: 'fixed',
    fixedMin: 1500000,
    fixedMax: 3500000,
    currency: 'UGX',
    requiredSkills: ['Go', 'PostgreSQL', 'REST', 'Testing'],
    status: 'open',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'mp_3',
    companyId: 'co_other',
    createdById: 'u_other_admin',
    title: 'Product Design: Mobile onboarding',
    description: 'Design an onboarding flow with clear value props and minimal friction. Deliver Figma file + interaction notes.',
    budgetType: 'hybrid',
    hourlyMin: 30000,
    hourlyMax: 70000,
    fixedMin: 800000,
    fixedMax: 1600000,
    currency: 'UGX',
    requiredSkills: ['Figma', 'Product design', 'Copywriting'],
    status: 'open',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
]

type ProjectPostingCardProps = {
  posting: ProjectPosting
  isFreelancer: boolean
  theme: ThemeI
  skillColors: string[]
  onApply: () => void
  onViewDetails: () => void
  onManageApplications: () => void
}

const ProjectPostingCard = ({
  posting: p,
  isFreelancer,
  theme,
  skillColors,
  onApply,
  onViewDetails,
  onManageApplications,
}: ProjectPostingCardProps) => {
  const created = p.createdAt ? new Date(p.createdAt) : null
  const updated = p.updatedAt ? new Date(p.updatedAt) : null
  const statusTint =
    p.status === 'open'
      ? theme.accent?.green ?? '#12B886'
      : p.status === 'closed'
        ? theme.system.border
        : theme.accent?.yellow ?? '#FAB005'

  return (
    <button
      type="button"
      onClick={onViewDetails}
      className="w-full text-left group"
      style={{ color: theme.system.dark }}
    >
      <div
        className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded border border-transparent group-hover:border-[var(--border-subtle)] transition-all duration-150"
        style={{ background: theme.system.foreground }}
      >
        <div className="min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Text className="font-medium truncate">{p.title}</Text>
              <Text variant="sm" className="opacity-70 mt-0.5 line-clamp-2">
                {p.description || '—'}
              </Text>
            </div>
            <span
              className="px-2 py-1 rounded-full text-[10px] font-medium shrink-0"
              style={{ background: `${statusTint}22`, color: theme.system.dark }}
            >
              {p.status.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{
                background: `${theme.brand.primary ?? '#682308'}12`,
                color: theme.brand.primary ?? theme.system.dark,
              }}
            >
              {p.budgetType.toUpperCase()}
            </span>
            <span className="text-xs opacity-80">{budgetLabel(p)}</span>
            {created && (
              <span className="text-[11px] opacity-70">
                Posted {created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
            {updated && created && updated.getTime() !== created.getTime() && (
              <span className="text-[11px] opacity-60">Updated {updated.toLocaleDateString()}</span>
            )}
          </div>

          {p.requiredSkills && p.requiredSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {p.requiredSkills.slice(0, 6).map((s) => {
                const idx = Math.abs(s.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % Math.max(1, skillColors.length)
                const c = skillColors[idx] ?? theme.brand.secondary ?? '#FF9600'
                return (
                  <span
                    key={s}
                    className="px-2 py-1 rounded-full text-[11px]"
                    style={{ background: `${c}18`, color: theme.system.dark, border: `1px solid ${c}40` }}
                  >
                    {s}
                  </span>
                )
              })}
              {p.requiredSkills.length > 6 && (
                <span className="text-[11px] opacity-70">+{p.requiredSkills.length - 6} more</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 self-stretch md:self-center">
          {isFreelancer ? (
            <>
              <Button
                size="sm"
                variant="background"
                label="View details"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails()
                }}
              />
              <Button
                size="sm"
                variant="background"
                label="Apply"
                startIcon={<Send className="w-4 h-4 shrink-0" />}
                onClick={(e) => {
                  e.stopPropagation()
                  onApply()
                }}
                disabled={p.status !== 'open'}
              />
            </>
          ) : (
            <Button
              size="sm"
              variant="background"
              label="Applications"
              startIcon={<Users className="w-4 h-4 shrink-0" />}
              onClick={(e) => {
                e.stopPropagation()
                onManageApplications()
              }}
            />
          )}
        </div>
      </div>
    </button>
  )
}

const MarketplacePage = () => {
  const { current } = Themestore()
  const user = Authstore((s) => s.user)
  const navigate = useNavigate()

  const isFreelancer = user?.role === 'freelancer'
  const isCompanyUser = !!user && user.role !== 'freelancer'

  const [loading, setLoading] = useState(true)
  const [postings, setPostings] = useState<ProjectPosting[]>([])
  const [appsByPostingId, setAppsByPostingId] = useState<Record<string, ProjectApplication[]>>({})
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ProjectPosting | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createBudgetType, setCreateBudgetType] = useState<'hybrid' | 'hourly' | 'fixed'>('hybrid')
  const [createHourlyMin, setCreateHourlyMin] = useState('')
  const [createHourlyMax, setCreateHourlyMax] = useState('')
  const [createFixedMin, setCreateFixedMin] = useState('')
  const [createFixedMax, setCreateFixedMax] = useState('')
  const [createCurrency, setCreateCurrency] = useState('UGX')
  const [createSkills, setCreateSkills] = useState('')
  const [saving, setSaving] = useState(false)

  const [applyOpen, setApplyOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [proposedHourly, setProposedHourly] = useState('')
  const [proposedFixed, setProposedFixed] = useState('')

  const [appsOpen, setAppsOpen] = useState(false)
  const [applications, setApplications] = useState<ProjectApplication[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [hireApp, setHireApp] = useState<ProjectApplication | null>(null)
  const [companyUsers, setCompanyUsers] = useState<User[]>([])
  const [leadId, setLeadId] = useState('')
  const [hireBillingType, setHireBillingType] = useState<'hourly' | 'fixed' | 'hybrid'>('hybrid')
  const [hireHourlyRate, setHireHourlyRate] = useState('')
  const [hireFixedBudget, setHireFixedBudget] = useState('')

  const refresh = async () => {
    setLoading(true)
    try {
      const list = MOCK_POSTINGS
      setPostings(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = useMemo(() => {
    const base =
      isCompanyUser && user?.companyId
        ? postings.filter((p) => p.companyId === user.companyId)
        : postings
    const q = search.trim().toLowerCase()
    if (!q) return base
    return base.filter((p) => (p.title + ' ' + (p.description ?? '')).toLowerCase().includes(q))
  }, [isCompanyUser, postings, search, user?.companyId])

  const skillColors = useMemo(() => {
    const a = current?.accent
    return [a?.blue, a?.purple, a?.pink, a?.green, a?.yellow, a?.teal].filter(Boolean) as string[]
  }, [current?.accent])

  const openApply = (p: ProjectPosting) => {
    setSelected(p)
    setCoverLetter('')
    setProposedHourly('')
    setProposedFixed('')
    setApplyOpen(true)
  }

  const openApplications = async (p: ProjectPosting) => {
    setSelected(p)
    setAppsOpen(true)
    setAppsLoading(true)
    try {
      setApplications(appsByPostingId[p.id] ?? [])
      const companyId = user?.companyId || p.companyId || MOCK_COMPANY_ID
      setCompanyUsers([
        {
          id: 'u_company_admin',
          email: 'admin@demo.co',
          name: 'Demo Admin',
          role: 'company_admin',
          companyId,
        },
        {
          id: 'u_project_lead',
          email: 'lead@demo.co',
          name: 'Demo Lead',
          role: 'project_lead',
          companyId,
        },
      ])
    } finally {
      setAppsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createTitle.trim()) return
    setSaving(true)
    try {
      const skills = createSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const createdAt = nowIso()
      const posting: ProjectPosting = {
        id: uid('mp'),
        companyId: user?.companyId || MOCK_COMPANY_ID,
        createdById: user?.id || 'u_company_admin',
        title: createTitle.trim(),
        description: createDesc.trim(),
        budgetType: createBudgetType,
        hourlyMin: createHourlyMin ? Number(createHourlyMin) : undefined,
        hourlyMax: createHourlyMax ? Number(createHourlyMax) : undefined,
        fixedMin: createFixedMin ? Number(createFixedMin) : undefined,
        fixedMax: createFixedMax ? Number(createFixedMax) : undefined,
        currency: createCurrency || 'UGX',
        requiredSkills: skills,
        status: 'open',
        createdAt,
        updatedAt: createdAt,
      }
      setPostings((prev) => [posting, ...prev])
      setCreateOpen(false)
      setCreateTitle('')
      setCreateDesc('')
      setCreateSkills('')
    } finally {
      setSaving(false)
    }
  }

  const handleApply = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const t = nowIso()
      const app: ProjectApplication = {
        id: uid('app'),
        postingId: selected.id,
        companyId: selected.companyId,
        freelancerId: user?.id || 'u_freelancer_demo',
        coverLetter,
        proposedHourlyRate: proposedHourly ? Number(proposedHourly) : undefined,
        proposedFixed: proposedFixed ? Number(proposedFixed) : undefined,
        currency: selected.currency,
        status: 'applied',
        createdAt: t,
        updatedAt: t,
      }
      setAppsByPostingId((prev) => {
        const list = prev[selected.id] ?? []
        return { ...prev, [selected.id]: [app, ...list] }
      })
      setApplyOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (app: ProjectApplication, status: ProjectApplication['status']) => {
    setSaving(true)
    try {
      const updated: ProjectApplication = { ...app, status, updatedAt: nowIso() }
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      setAppsByPostingId((prev) => {
        const list = prev[app.postingId] ?? []
        return { ...prev, [app.postingId]: list.map((a) => (a.id === updated.id ? updated : a)) }
      })
    } finally {
      setSaving(false)
    }
  }

  const handleHire = async () => {
    if (!hireApp || !leadId) return
    setSaving(true)
    try {
      const updated: ProjectApplication = { ...hireApp, status: 'hired', updatedAt: nowIso() }
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      setAppsByPostingId((prev) => {
        const list = prev[hireApp.postingId] ?? []
        return { ...prev, [hireApp.postingId]: list.map((a) => (a.id === updated.id ? updated : a)) }
      })
      setPostings((prev) =>
        prev.map((p) => (p.id === hireApp.postingId ? { ...p, status: 'closed', updatedAt: nowIso() } : p)),
      )
      setHireApp(null)
      setAppsOpen(false)
      // Optional: navigate to /app/projects/:id, but keep it simple (user will see it in Projects).
    } finally {
      setSaving(false)
    }
  }

  const leadOptions = useMemo(() => {
    return companyUsers
      .filter((u) => u.role === 'project_lead' || u.role === 'company_admin' || u.role === 'super_admin')
      .map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))
  }, [companyUsers])

  return (
    <div className="w-full mx-auto space-y-4">
      <View bg="fg" className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className="w-9 h-9 rounded-base flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${current?.accent?.purple ?? current?.brand?.secondary ?? '#FF9600'} 0%, ${current?.accent?.blue ?? current?.brand?.primary ?? '#682308'} 100%)`,
                  boxShadow: '0 8px 22px rgba(0,0,0,0.12)',
                }}
              >
                <BriefcaseBusiness className="w-5 h-5" style={{ color: current?.brand?.onPrimary ?? '#fff' }} />
              </span>
              <Text className="font-medium">{isFreelancer ? 'Job board' : 'Marketplace'}</Text>
            </div>
            <Text variant="sm" className="opacity-80">
              {isFreelancer ? 'Browse projects posted by companies and apply.' : 'Post projects and hire freelancers.'}
            </Text>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="min-w-[260px] max-w-md flex-1">
              <Input
                label="Search"
                placeholder="Search postings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isCompanyUser && (
              <Button
                size="sm"
                label="Post a project"
                startIcon={<Plus className="w-4 h-4 shrink-0" />}
                onClick={() => setCreateOpen(true)}
              />
            )}
          </div>
        </div>
      </View>

      <Card
        title="Project postings"
        subtitle={isFreelancer ? 'Open roles you can apply to' : 'Your company postings'}
        className="p-0 overflow-hidden"
      >
        {loading ? (
          <div className="p-6">
            <Text variant="sm" className="opacity-70">
              Loading…
            </Text>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Text variant="sm" className="opacity-80">
              No postings yet.
            </Text>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <ProjectPostingCard
                key={p.id}
                posting={p}
                isFreelancer={isFreelancer}
                theme={current}
                skillColors={skillColors}
                onApply={() => openApply(p)}
                onViewDetails={() => navigate(`/app/marketplace/${p.id}`, { state: { posting: p } })}
                onManageApplications={() => openApplications(p)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Create posting */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} variant="wide">
        <div className="p-6 space-y-4">
          <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.15 }}>
            Post a project
          </Text>
          <Input label="Title" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} />
          <Textarea label="Description" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomSelect
              label="Budget type"
              options={BUDGET_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={createBudgetType}
              onChange={(v) => setCreateBudgetType((v as any) || 'hybrid')}
              placement="below"
            />
            <Input label="Currency" value={createCurrency} onChange={(e) => setCreateCurrency(e.target.value.toUpperCase())} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Hourly min" value={createHourlyMin} onChange={(e) => setCreateHourlyMin(e.target.value)} />
            <Input label="Hourly max" value={createHourlyMax} onChange={(e) => setCreateHourlyMax(e.target.value)} />
            <Input label="Fixed min" value={createFixedMin} onChange={(e) => setCreateFixedMin(e.target.value)} />
            <Input label="Fixed max" value={createFixedMax} onChange={(e) => setCreateFixedMax(e.target.value)} />
          </div>
          <Input
            label="Required skills"
            placeholder="Comma-separated (e.g. React, Go, Figma)"
            value={createSkills}
            onChange={(e) => setCreateSkills(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="background" onClick={() => setCreateOpen(false)} />
            <Button label="Post" onClick={handleCreate} disabled={saving || !createTitle.trim()} />
          </div>
        </div>
      </Modal>

      {/* Apply */}
      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} variant="wide">
        <div className="p-6 space-y-4">
          <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.15 }}>
            Apply {selected ? `to “${selected.title}”` : ''}
          </Text>
          <Textarea
            label="Cover letter"
            placeholder="Tell them why you’re a great fit…"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Proposed hourly rate" value={proposedHourly} onChange={(e) => setProposedHourly(e.target.value)} />
            <Input label="Proposed fixed budget" value={proposedFixed} onChange={(e) => setProposedFixed(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="background" onClick={() => setApplyOpen(false)} />
            <Button label="Submit application" onClick={handleApply} disabled={saving} />
          </div>
        </div>
      </Modal>

      {/* Applications */}
      <Modal open={appsOpen} onClose={() => { setAppsOpen(false); setHireApp(null) }} variant="wide">
        <div className="p-6 space-y-4">
          <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.15 }}>
            Applications {selected ? `for “${selected.title}”` : ''}
          </Text>
          {appsLoading ? (
            <Text variant="sm" className="opacity-70">Loading…</Text>
          ) : applications.length === 0 ? (
            <Text variant="sm" className="opacity-70">No applications yet.</Text>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => (
                <View key={a.id} bg="fg" className="p-4 rounded-base border" style={{ borderColor: current?.system?.border }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Text className="font-medium">Freelancer: {a.freelancerId.slice(0, 8)}…</Text>
                      <Text variant="sm" className="opacity-80 mt-1 line-clamp-3">{a.coverLetter || '—'}</Text>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs opacity-80" style={{ color: current?.system?.dark }}>
                          Proposed: {a.proposedHourlyRate ? `${formatMoney(a.proposedHourlyRate, a.currency)} / hr` : ''}{a.proposedHourlyRate && a.proposedFixed ? ' • ' : ''}{a.proposedFixed ? `${formatMoney(a.proposedFixed, a.currency)}` : ''}{(!a.proposedHourlyRate && !a.proposedFixed) ? '—' : ''}
                        </span>
                        <span
                          className="px-2 py-1 rounded-full text-xs"
                          style={{
                            background:
                              a.status === 'shortlisted'
                                ? 'rgba(34,197,94,0.12)'
                                : a.status === 'rejected'
                                  ? 'rgba(239,68,68,0.14)'
                                  : `${current?.brand?.primary ?? '#682308'}12`,
                            color: current?.system?.dark,
                          }}
                        >
                          {a.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        label="Shortlist"
                        startIcon={<CheckCircle2 className="w-4 h-4 shrink-0" />}
                        onClick={() => updateStatus(a, 'shortlisted')}
                        disabled={saving || a.status === 'shortlisted' || a.status === 'hired'}
                      />
                      <Button
                        size="sm"
                        label="Reject"
                        variant="secondary"
                        startIcon={<XCircle className="w-4 h-4 shrink-0" />}
                        onClick={() => updateStatus(a, 'rejected')}
                        disabled={saving || a.status === 'rejected' || a.status === 'hired'}
                      />
                      <Button
                        size="sm"
                        label="Hire"
                        onClick={() => { setHireApp(a); setLeadId(''); setHireHourlyRate(''); setHireFixedBudget('') }}
                        disabled={saving || a.status === 'hired'}
                      />
                    </div>
                  </div>
                </View>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Hire modal (nested) */}
      <Modal open={!!hireApp} onClose={() => setHireApp(null)} variant="wide">
        <div className="p-6 space-y-4">
          <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.15 }}>
            Hire freelancer
          </Text>
          <CustomSelect
            label="Project lead"
            options={leadOptions}
            value={leadId}
            onChange={(v) => setLeadId(v || '')}
            placeholder="Select a project lead"
            placement="below"
          />
          <CustomSelect
            label="Billing type"
            options={[
              { value: 'hybrid', label: 'Hybrid' },
              { value: 'hourly', label: 'Hourly' },
              { value: 'fixed', label: 'Fixed' },
            ]}
            value={hireBillingType}
            onChange={(v) => setHireBillingType((v as any) || 'hybrid')}
            placement="below"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Hourly rate" value={hireHourlyRate} onChange={(e) => setHireHourlyRate(e.target.value)} />
            <Input label="Fixed budget" value={hireFixedBudget} onChange={(e) => setHireFixedBudget(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="background" onClick={() => setHireApp(null)} />
            <Button label="Hire" onClick={handleHire} disabled={saving || !leadId} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MarketplacePage

