import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Text, { baseFontSize } from '../../components/base/Text'
import View from '../../components/base/View'
import { Button, Input, Modal, Textarea, CustomSelect, RichTextEditor, CurrencyInput } from '../../components/ui'
import { Themestore, type ThemeI } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { companyService } from '../../services/companyService'
import { marketplaceService } from '../../services/marketplaceService'
import { userService } from '../../services/userService'
import type { ProjectPosting, ProjectApplication, User, Company } from '../../types'
import { AnimatePresence, motion } from 'framer-motion'
import { notifyError, notifySuccess } from '../../data/NotificationStore'
import {
  Plus, Send, Users, CheckCircle2, XCircle, X, Search,
  DollarSign, Sparkles, SlidersHorizontal, Wallet, FileText,
} from 'lucide-react'

const MARKETPLACE_HERO_BG_URL =
  'https://images.pexels.com/photos/9488838/pexels-photo-9488838.jpeg'

const BUDGET_OPTIONS = [
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'fixed', label: 'Fixed' },
] as const

const CURRENCY_OPTIONS = [
  { value: 'UGX', label: 'UGX' },
  { value: 'KES', label: 'KES' },
  { value: 'TZS', label: 'TZS' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
]

type SortOption = 'newest' | 'oldest' | 'budget_high' | 'budget_low'
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'budget_high', label: 'Budget: High → Low' },
  { value: 'budget_low', label: 'Budget: Low → High' },
]

/** Map non-ISO codes stored in DB to ISO 4217 for Intl (e.g. KSH → KES). */
function normalizeCurrencyForIntl(code: string): string {
  const u = (code || 'UGX').trim().toUpperCase() || 'UGX'
  const aliases: Record<string, string> = { KSH: 'KES', SH: 'KES' }
  return aliases[u] ?? u
}

function htmlToPlainText(html?: string): string {
  if (!html) return ''
  // Cover letters are stored as HTML from TipTap; strip tags so previews don't render markup.
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const text = doc.body?.textContent ?? ''
    return text.replace(/\s+/g, ' ').trim()
  } catch {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}

function formatMoney(value?: number, currency = 'UGX') {
  if (value == null || Number.isNaN(value)) return '—'
  const iso = normalizeCurrencyForIntl(currency || 'UGX')
  const displayCode = (currency || 'UGX').trim().toUpperCase() || 'UGX'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: iso,
      currencyDisplay: 'code',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${displayCode} ${Math.round(Number(value)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }
}

function maxBudget(p: ProjectPosting): number {
  return Math.max(p.hourlyMax ?? 0, p.fixedMax ?? 0)
}

function budgetLines(p: ProjectPosting): string[] {
  const cur = p.currency || 'UGX'
  if (p.budgetType === 'hourly') return [`${formatMoney(p.hourlyMin, cur)} – ${formatMoney(p.hourlyMax, cur)} / hr`]
  if (p.budgetType === 'fixed') return [`${formatMoney(p.fixedMin, cur)} – ${formatMoney(p.fixedMax, cur)}`]
  return [
    `${formatMoney(p.hourlyMin, cur)} – ${formatMoney(p.hourlyMax, cur)} / hr`,
    `${formatMoney(p.fixedMin, cur)} – ${formatMoney(p.fixedMax, cur)} fixed`,
  ]
}

function formatPostingDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function domainFromEmail(email?: string) {
  if (!email) return '—'
  const parts = email.split('@')
  if (parts.length < 2) return '—'
  return parts[1]
}

/** Soft spotlight window for “days left” on open listings (UI-only; not enforced by API). */
const MARKETPLACE_LISTING_WINDOW_DAYS = 30

function listingSpotlightDaysLeft(createdAt: string): number {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return MARKETPLACE_LISTING_WINDOW_DAYS
  const elapsedDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24))
  return Math.max(0, MARKETPLACE_LISTING_WINDOW_DAYS - elapsedDays)
}

/** Resolve relative upload paths (e.g. /uploads/...) when VITE_API_URL is an absolute API base. */
function resolvePublicAssetUrl(url?: string | null): string | undefined {
  const s = url?.trim()
  if (!s) return undefined
  if (/^https?:\/\//i.test(s)) return s
  const base = import.meta.env.VITE_API_URL as string | undefined
  if (s.startsWith('/') && base?.startsWith('http')) {
    const origin = base.replace(/\/api\/?$/i, '')
    return `${origin}${s}`
  }
  return s
}

type MarketplaceProjectCardProps = {
  posting: ProjectPosting
  company: Company | null
  isFreelancer: boolean
  theme: ThemeI
  skillColors: string[]
  variant?: 'featured' | 'default'
  viewerUser: User | null
  viewerIsCompanyAdmin: boolean
  onApply: () => void
  onManageApplications: () => void
}

const MarketplaceProjectCard = ({
  posting: p,
  company,
  isFreelancer,
  theme,
  skillColors,
  variant = 'default',
  viewerUser: _viewerUser,
  viewerIsCompanyAdmin: _viewerIsCompanyAdmin,
  onApply,
  onManageApplications,
}: MarketplaceProjectCardProps) => {
  const [actionHover, setActionHover] = useState(false)
  const borderColor = theme.system.border ?? 'rgba(0,0,0,0.06)'
  const pad = variant === 'featured' ? 'p-7' : 'p-6'
  const displayName = (company?.name ?? p.companyName ?? '').trim() || 'Company'
  const logoSrc = resolvePublicAssetUrl(company?.logoUrl ?? p.companyLogoUrl ?? undefined)
  const accent = theme.brand.secondary ?? '#FF9600'
  const initial = displayName.trim().slice(0, 1).toUpperCase() || 'C'
  const domain = domainFromEmail(company?.email)
  const postedDate = formatPostingDate(p.createdAt)
  const primary = theme.brand.primary ?? '#682308'
  const onPrimary = theme.brand.onPrimary ?? '#ffffff'
  const actionDisabled = isFreelancer ? p.status !== 'open' : false
  const actionPrimary = actionHover && !actionDisabled

  const logoBoxH = variant === 'featured' ? 56 : 48
  const logoMaxW = variant === 'featured' ? 200 : 168

  const green = theme.accent?.green ?? '#12B886'
  const spotlightLeft = listingSpotlightDaysLeft(p.createdAt)
  const remainingDays = spotlightLeft === 0 ? 1 : spotlightLeft
  const badgeLabel = `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`
  const badgeSuccess = spotlightLeft >= 3
  const currencyCode = (p.currency || 'UGX').trim().toUpperCase() || 'UGX'

  const created = p.createdAt ? new Date(p.createdAt) : null
  const updated = p.updatedAt ? new Date(p.updatedAt) : null

  return (
    <div
      className={`rounded-base shadow-custom ${pad}`}
      style={{ background: theme.system.foreground, color: theme.system.dark }}
    >
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex flex-col gap-0">
            <div className="flex justify-start">
              {logoSrc ? (
                <div
                  className="shrink-0 rounded-base overflow-hidden flex items-center justify-center"
                  style={{
                    background: 'transparent',
                    height: logoBoxH,
                    maxWidth: logoMaxW,
                  }}
                >
                  <img
                    src={logoSrc}
                    alt={`${displayName} logo`}
                    className="block object-contain object-center"
                    style={{
                      maxHeight: logoBoxH,
                      maxWidth: logoMaxW,
                      width: 'auto',
                      height: 'auto',
                    }}
                  />
                </div>
              ) : (
                <div
                  className="w-12 h-12 rounded-base overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: `${accent}18` }}
                >
                  <span className="text-[17px] font-semibold leading-none" style={{ color: accent }}>
                    {initial}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0 mt-3">
              <div className="font-semibold leading-tight" style={{ fontSize: baseFontSize }}>
                {displayName}
              </div>
              <div
                className="font-normal leading-snug"
                style={{
                  fontSize: Math.max(11, baseFontSize * 0.78),
                  opacity: 0.5,
                  marginTop: 2,
                }}
              >
                {domain !== '—' ? `${domain} • ${postedDate}` : postedDate}
              </div>
            </div>
          </div>
          <Text
            variant="sm"
            className="shrink-0 rounded-full font-normal tracking-wide px-6 py-2 ml-auto inline-flex"
            style={{
              background: badgeSuccess ? `${green}22` : `${green}14`,
              color: green,
            }}
          >
            {badgeLabel}
          </Text>
        </div>

        <span className="text-[11px] font-medium" style={{ opacity: 0.4 }}>
          Posted {postedDate}
          {updated && created && updated.getTime() !== created.getTime()
            ? ` · Updated ${formatPostingDate(p.updatedAt)}`
            : ''}
        </span>

        <Text className="font-semibold leading-snug" style={{ fontSize: baseFontSize * 1.15 }}>
          {p.title}
        </Text>

        <Text className="leading-[1.75] whitespace-pre-wrap" style={{ fontSize: baseFontSize, opacity: 0.88 }}>
          {p.description?.trim() || '—'}
        </Text>

        <div>
          <div
            className="flex items-center gap-4 p-4 rounded-base"
            style={{ background: theme.system.background ?? 'rgba(0,0,0,0.06)' }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              style={{ background: theme.system.foreground }}
            >
              <Wallet className="w-5 h-5" style={{ color: theme.system.dark, opacity: 0.7 }} />
            </div>
            <div className="min-w-0">
              <Text
                variant="sm"
                className="tracking-widest uppercase font-medium block mb-1"
                style={{ color: theme.system.dark, opacity: 0.5 }}
              >
                {currencyCode} · {p.budgetType} rate
              </Text>
              {budgetLines(p).map((line, li) => (
                <Text key={li} variant="sm" className="font-medium" style={{ opacity: 0.9 }}>
                  {line}
                </Text>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: borderColor }} />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          {p.requiredSkills && p.requiredSkills.length > 0 ? (
            <div className="min-w-0 flex flex-wrap gap-2">
              {p.requiredSkills.map((s) => {
                const idx = Math.abs(s.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % Math.max(1, skillColors.length)
                const c = skillColors[idx] ?? theme.brand.secondary ?? '#FF9600'
                return (
                  <span
                    key={s}
                    className="px-3 py-1 rounded-full text-[11px] font-medium"
                    style={{ background: `${c}18`, color: c }}
                  >
                    {s}
                  </span>
                )
              })}
            </div>
          ) : <div />}
          <button
            type="button"
            onClick={() => {
              if (isFreelancer) onApply()
              else onManageApplications()
            }}
            disabled={actionDisabled}
            onMouseEnter={() => setActionHover(true)}
            onMouseLeave={() => setActionHover(false)}
            className="px-5 py-2 rounded-full text-[13px] font-medium border-0 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-w-[160px]"
            style={{
              backgroundColor: actionPrimary ? primary : (theme.system.background ?? 'rgba(0,0,0,0.06)'),
              color: actionPrimary ? onPrimary : theme.system.dark,
            }}
            aria-label={isFreelancer ? 'Apply now' : 'Manage applications'}
          >
            {isFreelancer ? 'Apply now' : 'Manage applications'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TRENDING_SKILLS = [
  'React', 'TypeScript', 'Go', 'Figma', 'Node.js', 'Python',
  'AWS', 'Flutter', 'Docker', 'PostgreSQL', 'UX', 'SEO',
]

const MarketplacePage = () => {
  const { current, mode } = Themestore()
  const user = Authstore((s) => s.user)

  const isFreelancer = user?.role === 'freelancer'
  const isCompanyUser = !!user && user.role !== 'freelancer'
  const viewerIsCompanyAdmin = user?.role === 'company_admin' || user?.role === 'super_admin'
  const isDark = mode === 'dark'

  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<Company[]>([])
  const [budgetFilter, setBudgetFilter] = useState<'all' | 'hourly' | 'fixed' | 'hybrid'>('all')
  const [postings, setPostings] = useState<ProjectPosting[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ProjectPosting | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [skillFilter, setSkillFilter] = useState<string | null>(null)

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
  const [applyAttachments, setApplyAttachments] = useState<File[]>([])
  const applyAttachmentInputRef = useRef<HTMLInputElement>(null)

  const [appsOpen, setAppsOpen] = useState(false)
  const [applications, setApplications] = useState<ProjectApplication[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [hireApp, setHireApp] = useState<ProjectApplication | null>(null)
  const [companyUsers, setCompanyUsers] = useState<User[]>([])
  const [leadId, setLeadId] = useState('')
  const [hireBillingType, setHireBillingType] = useState<'hourly' | 'fixed' | 'hybrid'>('hybrid')
  const [hireHourlyRate, setHireHourlyRate] = useState('')
  const [hireFixedBudget, setHireFixedBudget] = useState('')

  const heroLeftRef = useRef<HTMLDivElement>(null)
  const [heroLeftHeight, setHeroLeftHeight] = useState(0)

  useLayoutEffect(() => {
    const measure = () => {
      const node = heroLeftRef.current
      if (!node) return
      const h = Math.round(node.getBoundingClientRect().height)
      setHeroLeftHeight((prev) => (prev !== h ? h : prev))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => {
      measure()
    })
    const node = heroLeftRef.current
    if (node) ro.observe(node)
    return () => ro.disconnect()
  }, [isCompanyUser])

  const refresh = async () => {
    setLoading(true)
    try {
      const listPromise = marketplaceService.listPostings()
      const companyPromise = isFreelancer
        ? Promise.resolve<Company[]>([])
        : companyService.list().catch(() => [] as Company[])

      const [list, companyList] = await Promise.all([listPromise, companyPromise])
      setPostings(list)
      setCompanies(companyList)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const openPostings = useMemo(() => {
    return isCompanyUser && user?.companyId
      ? postings.filter((p) => p.companyId === user.companyId && p.status === 'open')
      : postings.filter((p) => p.status === 'open')
  }, [isCompanyUser, postings, user?.companyId])

  const filtered = useMemo(() => {
    let base = [...openPostings]
    if (budgetFilter !== 'all') base = base.filter((p) => p.budgetType === budgetFilter)
    if (skillFilter) {
      base = base.filter((p) => p.requiredSkills?.some((s) => s.toLowerCase() === skillFilter.toLowerCase()))
    }
    const q = search.trim().toLowerCase()
    if (q) {
      base = base.filter((p) =>
        (`${p.title} ${p.description ?? ''} ${(p.companyName ?? '')} ${(p.requiredSkills ?? []).join(' ')}`).toLowerCase().includes(q),
      )
    }
    switch (sortBy) {
      case 'oldest':
        base.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'budget_high':
        base.sort((a, b) => maxBudget(b) - maxBudget(a))
        break
      case 'budget_low':
        base.sort((a, b) => maxBudget(a) - maxBudget(b))
        break
      default:
        base.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return base
  }, [openPostings, search, budgetFilter, skillFilter, sortBy])

  const skillColors = useMemo(() => {
    const a = current?.accent
    return [a?.blue, a?.purple, a?.pink, a?.green, a?.yellow, a?.teal].filter(Boolean) as string[]
  }, [current?.accent])

  const companiesById = useMemo(() => {
    const map: Record<string, Company> = {}
    companies.forEach((c) => {
      map[c.id] = c
    })
    return map
  }, [companies])

  const openApply = (p: ProjectPosting) => {
    setSelected(p)
    setCoverLetter('')
    setProposedHourly('')
    setProposedFixed('')
    setApplyAttachments([])
    setApplyOpen(true)
  }

  const openApplications = async (p: ProjectPosting) => {
    setSelected(p)
    setAppsOpen(true)
    setAppsLoading(true)
    try {
      const [apps, users] = await Promise.all([
        marketplaceService.listApplications(p.id),
        userService.getByCompany(user?.companyId || p.companyId),
      ])
      setApplications(apps)
      setCompanyUsers(users)
    } finally {
      setAppsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createTitle.trim()) return
    setSaving(true)
    try {
      const skills = createSkills.split(',').map((s) => s.trim()).filter(Boolean)
      const posting = await marketplaceService.createPosting({
        title: createTitle.trim(),
        description: createDesc.trim(),
        budgetType: createBudgetType,
        hourlyMin: createHourlyMin ? Number(createHourlyMin) : undefined,
        hourlyMax: createHourlyMax ? Number(createHourlyMax) : undefined,
        fixedMin: createFixedMin ? Number(createFixedMin) : undefined,
        fixedMax: createFixedMax ? Number(createFixedMax) : undefined,
        currency: createCurrency || 'UGX',
        requiredSkills: skills,
      })
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
      const created = await marketplaceService.apply(selected.id, {
        coverLetter,
        proposedHourlyRate: proposedHourly ? Number(proposedHourly) : undefined,
        proposedFixed: proposedFixed ? Number(proposedFixed) : undefined,
      })

      if (applyAttachments.length > 0) {
        await Promise.all(
          applyAttachments.map((file) => marketplaceService.uploadApplicationFile(created.id, file)),
        )
      }

      setApplyOpen(false)
      setCoverLetter('')
      setProposedHourly('')
      setProposedFixed('')
      setApplyAttachments([])
      notifySuccess('Application submitted.')
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Failed to apply.')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (app: ProjectApplication, status: ProjectApplication['status']) => {
    setSaving(true)
    try {
      const updated = await marketplaceService.updateApplicationStatus(app.id, status)
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    } finally {
      setSaving(false)
    }
  }

  const handleHire = async () => {
    if (!hireApp || !leadId) return
    setSaving(true)
    try {
      await marketplaceService.hire(hireApp.id, {
        projectLeadId: leadId,
        billingType: hireBillingType,
        hourlyRate: hireHourlyRate ? Number(hireHourlyRate) : undefined,
        fixedBudget: hireFixedBudget ? Number(hireFixedBudget) : undefined,
        currency: selected?.currency,
      })
      setApplications((prev) => prev.map((a) => (a.id === hireApp.id ? { ...a, status: 'hired' } : a)))
      setPostings((prev) =>
        prev.map((p) => (p.id === hireApp.postingId ? { ...p, status: 'closed' } : p)),
      )
      setHireApp(null)
      setAppsOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const leadOptions = useMemo(() => {
    return companyUsers
      .filter((u) => u.role === 'project_lead' || u.role === 'company_admin' || u.role === 'super_admin')
      .map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))
  }, [companyUsers])

  const filterCounts = useMemo(() => ({
    all: openPostings.length,
    hourly: openPostings.filter((p) => p.budgetType === 'hourly').length,
    fixed: openPostings.filter((p) => p.budgetType === 'fixed').length,
    hybrid: openPostings.filter((p) => p.budgetType === 'hybrid').length,
  }), [openPostings])

  const activeFilterCount = [budgetFilter !== 'all', !!skillFilter, !!search].filter(Boolean).length

  return (
    <div className="w-full mx-auto space-y-8">
      {/* Hero + search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="min-w-0 min-h-0 flex flex-col gap-7">
          <div ref={heroLeftRef} className="space-y-7 min-w-0 min-h-0">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 space-y-2">
                <Text
                  className="font-semibold leading-tight"
                  style={{ fontSize: baseFontSize * 2.2, color: current?.brand?.primary ?? '#682308' }}
                >
                  Discover Kenya&apos;s
                  <br />
                  open projects
                </Text>
                <Text variant="sm" style={{ opacity: 0.55 }} className="leading-relaxed max-w-[480px]">
                  A Kenyan-first workforce and operations platform designed for freelancers, consultants, and growing
                  businesses. HustleIN is a wordplay that reflects Kenya&apos;s hustle culture.
                </Text>
              </div>
              {isCompanyUser && (
                <Button
                  label="Post project"
                  startIcon={<Plus className="w-4 h-4 shrink-0" />}
                  onClick={() => setCreateOpen(true)}
                  className="shrink-0"
                />
              )}
            </div>

            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-base"
              style={{
                background: current?.system?.foreground,
              }}
            >
              <Search className="w-4 h-4 shrink-0 opacity-35" style={{ color: current?.system?.dark }} />
              <input
                type="text"
                className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
                placeholder="search for projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ color: current?.system?.dark }}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="shrink-0 opacity-35 hover:opacity-80 transition-opacity">
                  <X className="w-3.5 h-3.5" style={{ color: current?.system?.dark }} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-90"
                style={{ background: 'transparent', color: current?.system?.dark, opacity: 0.55 }}
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter drawer */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                className="fixed inset-0 z-[9999]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)',
                    backdropFilter: 'saturate(1.3)',
                  }}
                  onClick={() => setFiltersOpen(false)}
                />
                <motion.div
                  className="absolute right-0 top-0 h-full w-full max-w-[420px] overflow-hidden"
                  initial={{ x: 24 }}
                  animate={{ x: 0 }}
                  exit={{ x: 24 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    backgroundColor: current?.system?.foreground ?? undefined,
                    borderLeft: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
                  }}
                >
                  <div className="h-full overflow-auto p-5 space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.05 }}>
                        Filters
                      </Text>
                      {activeFilterCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setBudgetFilter('all')
                            setSkillFilter(null)
                            setSearch('')
                            setSortBy('newest')
                            setFiltersOpen(false)
                          }}
                          className="text-[12px] font-medium transition-opacity hover:opacity-80"
                          style={{ color: current?.system?.dark, opacity: 0.55 }}
                        >
                          Clear all
                        </button>
                      ) : (
                        <Text variant="sm" style={{ opacity: 0.45 }}>
                          No active filters
                        </Text>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Text variant="sm" style={{ opacity: 0.55 }}>
                        Budget
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        {(['all', 'hourly', 'fixed', 'hybrid'] as const).map((f) => {
                          const active = budgetFilter === f
                          const count = filterCounts[f]
                          const bg = current?.system?.background ?? 'rgba(0,0,0,0.04)'
                          return (
                            <button
                              key={f}
                              type="button"
                              onClick={() => {
                                setBudgetFilter(f)
                                setFiltersOpen(false)
                              }}
                              className="px-4 py-2 rounded-full text-[12px] font-medium transition-opacity whitespace-nowrap"
                              style={{
                                backgroundColor: bg,
                                color: current?.system?.dark,
                                opacity: active ? 1 : 0.55,
                              }}
                            >
                              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                                style={{ marginLeft: 8, backgroundColor: bg, opacity: active ? 1 : 0.75 }}
                              >
                                {count}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Text variant="sm" style={{ opacity: 0.55 }}>
                        Skill
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        {TRENDING_SKILLS.map((skill) => {
                          const active = skillFilter === skill
                          const bg = current?.system?.background ?? 'rgba(0,0,0,0.04)'
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => {
                                setSkillFilter(active ? null : skill)
                                setFiltersOpen(false)
                              }}
                              className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-opacity"
                              style={{
                                backgroundColor: bg,
                                color: current?.system?.dark,
                                opacity: active ? 1 : 0.55,
                              }}
                            >
                              {skill}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Text variant="sm" style={{ opacity: 0.55 }}>
                        Sort
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        {SORT_OPTIONS.map((opt) => {
                          const active = sortBy === opt.value
                          const bg = current?.system?.background ?? 'rgba(0,0,0,0.04)'
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.value)
                                setFiltersOpen(false)
                              }}
                              className="px-4 py-2 rounded-full text-[12px] font-medium transition-opacity"
                              style={{
                                backgroundColor: bg,
                                color: current?.system?.dark,
                                opacity: active ? 1 : 0.55,
                              }}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          className="hidden lg:flex flex-col w-full min-h-0 shrink-0"
          style={{
            height: heroLeftHeight > 0 ? heroLeftHeight : undefined,
            minHeight: heroLeftHeight > 0 ? undefined : 180,
          }}
        >
          <div
            className="h-full min-h-0 w-full overflow-hidden rounded-[16px]"
            role="img"
            aria-label="Marketplace hero"
            style={{
              backgroundColor: current?.system?.foreground,
              backgroundImage: `url(${MARKETPLACE_HERO_BG_URL})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>
      </div>

      {/* Featured + results */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4 max-w-6xl">
            {[1, 2, 3].map((i) => (
              <View key={i} bg="fg" className="rounded-base p-6 animate-pulse shadow-custom" style={{ height: 240 }}>
                <div className="space-y-4">
                  <div className="h-4 rounded-full w-3/4" style={{ background: current?.system?.border }} />
                  <div className="h-3 rounded-full w-full" style={{ background: current?.system?.border, opacity: 0.5 }} />
                  <div className="flex gap-2 mt-4">
                    <div className="h-6 w-16 rounded-full" style={{ background: current?.system?.border, opacity: 0.3 }} />
                    <div className="h-6 w-20 rounded-full" style={{ background: current?.system?.border, opacity: 0.3 }} />
                  </div>
                </div>
              </View>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <View bg="fg" className="rounded-base p-12 text-center shadow-custom">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: `${current?.brand?.secondary ?? '#FF9600'}14` }}
            >
              <Sparkles className="w-6 h-6" style={{ color: current?.brand?.secondary ?? '#FF9600' }} />
            </div>
            <Text className="font-semibold mb-2" style={{ fontSize: baseFontSize * 1.1 }}>
              No projects found
            </Text>
            <Text variant="sm" style={{ opacity: 0.5, maxWidth: 320 }} className="mx-auto leading-relaxed">
              {search || skillFilter
                ? 'Try adjusting your search or filters to find more projects.'
                : 'There are no open projects at the moment. Check back soon!'}
            </Text>
            {(search || skillFilter || budgetFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setBudgetFilter('all')
                  setSkillFilter(null)
                  setSearch('')
                  setSortBy('newest')
                }}
                className="mt-4 text-[12px] font-medium px-4 py-2 rounded-full transition-opacity hover:opacity-80"
                style={{ background: `${current?.brand?.primary ?? '#682308'}12`, color: current?.brand?.primary ?? '#682308' }}
              >
                Clear all filters
              </button>
            )}
          </View>
        ) : (
          <div className="space-y-4 max-w-6xl">
            {filtered.map((p) => (
              <MarketplaceProjectCard
                key={p.id}
                posting={p}
                company={companiesById[p.companyId] ?? null}
                isFreelancer={isFreelancer}
                theme={current}
                skillColors={skillColors}
                variant="default"
                viewerUser={user ?? null}
                viewerIsCompanyAdmin={viewerIsCompanyAdmin}
                onApply={() => openApply(p)}
                onManageApplications={() => openApplications(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create posting modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} variant="wide">
        <div className="p-7 space-y-5">
          <div>
            <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.2 }}>Post a new project</Text>
            <Text variant="sm" className="mt-1" style={{ opacity: 0.45 }}>Describe the role and budget to attract the right freelancers.</Text>
          </div>
          <Input label="Title" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} />
          <Textarea label="Description" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect
              label="Budget type"
              options={BUDGET_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={createBudgetType}
              onChange={(v) => setCreateBudgetType(v === 'hybrid' || v === 'hourly' || v === 'fixed' ? v : 'hybrid')}
              placement="below"
            />
            <CustomSelect
              label="Currency"
              options={CURRENCY_OPTIONS}
              value={createCurrency}
              onChange={(v) => setCreateCurrency(v || 'UGX')}
              placement="below"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput
              label="Hourly min"
              value={createHourlyMin}
              onChange={setCreateHourlyMin}
              currency={createCurrency}
              showCurrencySymbol={false}
            />
            <CurrencyInput
              label="Hourly max"
              value={createHourlyMax}
              onChange={setCreateHourlyMax}
              currency={createCurrency}
              showCurrencySymbol={false}
            />
            <CurrencyInput
              label="Fixed min"
              value={createFixedMin}
              onChange={setCreateFixedMin}
              currency={createCurrency}
              showCurrencySymbol={false}
            />
            <CurrencyInput
              label="Fixed max"
              value={createFixedMax}
              onChange={setCreateFixedMax}
              currency={createCurrency}
              showCurrencySymbol={false}
            />
          </div>
          <Input label="Required skills" placeholder="Comma-separated (e.g. React, Go, Figma)" value={createSkills} onChange={(e) => setCreateSkills(e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button label="Cancel" variant="background" onClick={() => setCreateOpen(false)} />
            <Button label="Post project" onClick={handleCreate} disabled={saving || !createTitle.trim()} />
          </div>
        </div>
      </Modal>

      {/* Apply modal */}
      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} variant="wide">
        <div className="p-7 space-y-5">
          <div>
            <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.2 }}>Apply to project</Text>
            {selected && <Text variant="sm" className="mt-1" style={{ opacity: 0.45 }}>{selected.title}</Text>}
          </div>
          <RichTextEditor
            label="Cover letter"
            placeholder="Tell them why you're a great fit… Add links (GitHub, LinkedIn, portfolio) if helpful."
            value={coverLetter}
            onChange={(html) => setCoverLetter(html)}
            minHeight="220px"
            toolbarPreset="full"
            mode="fill"
            borderless
            enableMentions
          />
          <div className="space-y-2">
            <Text variant="sm" style={{ opacity: 0.55 }}>
              Attach documents (CV / Resume)
            </Text>
            <input
              ref={applyAttachmentInputRef}
              type="file"
              className="hidden"
              multiple
              accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,text/plain,.txt"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                setApplyAttachments(files)
                e.target.value = ''
              }}
              aria-hidden
            />
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                label={applyAttachments.length ? 'Replace files' : 'Add files'}
                size="sm"
                variant="background"
                startIcon={<FileText className="w-4 h-4 shrink-0" />}
                onClick={() => applyAttachmentInputRef.current?.click()}
                disabled={saving}
              />
              {applyAttachments.length > 0 && (
                <Text variant="sm" style={{ opacity: 0.45 }}>
                  {applyAttachments.length} selected
                </Text>
              )}
            </div>

            {applyAttachments.length > 0 && (
              <div className="space-y-2">
                {applyAttachments.map((f, i) => (
                  <div
                    key={`${f.name}_${f.size}_${i}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-base"
                    style={{ background: current?.system?.background ?? 'rgba(0,0,0,0.04)' }}
                  >
                    <FileText className="w-4 h-4 shrink-0" style={{ color: current?.system?.dark ?? undefined, opacity: 0.7 }} />
                    <Text variant="sm" className="truncate flex-1" style={{ opacity: 0.75 }}>
                      {f.name}
                    </Text>
                    <button
                      type="button"
                      onClick={() => setApplyAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="shrink-0 p-1 rounded-base opacity-70 hover:opacity-100 transition-opacity"
                      style={{ color: current?.system?.dark ?? undefined }}
                      aria-label="Remove attachment"
                      disabled={saving}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Proposed hourly rate" value={proposedHourly} onChange={(e) => setProposedHourly(e.target.value)} />
            <Input label="Proposed fixed budget" value={proposedFixed} onChange={(e) => setProposedFixed(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button label="Cancel" variant="background" onClick={() => setApplyOpen(false)} />
            <Button label="Submit application" startIcon={<Send className="w-4 h-4 shrink-0" />} onClick={handleApply} disabled={saving} />
          </div>
        </div>
      </Modal>

      {/* Applications modal */}
      <Modal open={appsOpen} onClose={() => { setAppsOpen(false); setHireApp(null) }} variant="wide">
        <div className="p-7 space-y-5">
          <div>
            <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.2 }}>Applications</Text>
            {selected && <Text variant="sm" className="mt-1" style={{ opacity: 0.45 }}>{selected.title}</Text>}
          </div>
          {appsLoading ? (
            <Text variant="sm" className="opacity-70">Loading...</Text>
          ) : applications.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${current?.brand?.secondary ?? '#FF9600'}14` }}>
                <Users className="w-5 h-5" style={{ color: current?.brand?.secondary ?? '#FF9600' }} />
              </div>
              <Text variant="sm" style={{ opacity: 0.5 }}>No applications yet.</Text>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((a) => (
                <View key={a.id} bg="fg" className="p-5 rounded-base shadow-custom">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Text className="font-medium">Freelancer: {a.freelancerId.slice(0, 8)}...</Text>
                        <span
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{
                            background:
                              a.status === 'shortlisted' ? `${current?.accent?.green ?? '#12B886'}18`
                                : a.status === 'rejected' ? `${current?.system?.error ?? 'red'}14`
                                  : a.status === 'hired' ? `${current?.accent?.blue ?? '#228BE6'}18`
                                    : `${current?.brand?.primary ?? '#682308'}12`,
                            color:
                              a.status === 'shortlisted' ? (current?.accent?.green ?? '#12B886')
                                : a.status === 'rejected' ? (current?.system?.error ?? 'red')
                                  : a.status === 'hired' ? (current?.accent?.blue ?? '#228BE6')
                                    : (current?.brand?.primary ?? '#682308'),
                          }}
                        >
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </span>
                      </div>
                      <Text variant="sm" className="line-clamp-2 leading-relaxed mb-3" style={{ opacity: 0.6 }}>
                        {htmlToPlainText(a.coverLetter) || '—'}
                      </Text>
                      {a.attachments && a.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {a.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium transition-opacity hover:opacity-90"
                              style={{
                                background: current?.system?.background ?? 'rgba(0,0,0,0.04)',
                                color: current?.system?.dark,
                              }}
                            >
                              <FileText className="w-4 h-4 shrink-0" style={{ opacity: 0.7 }} />
                              <span className="truncate max-w-[150px]">{att.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-3.5 h-3.5" style={{ opacity: 0.4 }} />
                        <Text variant="sm" style={{ opacity: 0.6 }}>
                          {a.proposedHourlyRate ? `${formatMoney(a.proposedHourlyRate, a.currency)} / hr` : ''}
                          {a.proposedHourlyRate && a.proposedFixed ? ' + ' : ''}
                          {a.proposedFixed ? `${formatMoney(a.proposedFixed, a.currency)}` : ''}
                          {(!a.proposedHourlyRate && !a.proposedFixed) ? 'No rate proposed' : ''}
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" label="Shortlist" variant="background" startIcon={<CheckCircle2 className="w-4 h-4 shrink-0" />} onClick={() => updateStatus(a, 'shortlisted')} disabled={saving || a.status === 'shortlisted' || a.status === 'hired'} />
                      <Button size="sm" label="Reject" variant="background" startIcon={<XCircle className="w-4 h-4 shrink-0" />} onClick={() => updateStatus(a, 'rejected')} disabled={saving || a.status === 'rejected' || a.status === 'hired'} />
                      <Button size="sm" label="Hire" onClick={() => { setHireApp(a); setLeadId(''); setHireHourlyRate(''); setHireFixedBudget('') }} disabled={saving || a.status === 'hired'} />
                    </div>
                  </div>
                </View>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Hire modal */}
      <Modal open={!!hireApp} onClose={() => setHireApp(null)} variant="wide">
        <div className="p-7 space-y-5">
          <div>
            <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.2 }}>Hire freelancer</Text>
            <Text variant="sm" className="mt-1" style={{ opacity: 0.45 }}>Set billing terms and assign a project lead.</Text>
          </div>
          <CustomSelect label="Project lead" options={leadOptions} value={leadId} onChange={(v) => setLeadId(v || '')} placeholder="Select a project lead" placement="below" />
          <CustomSelect
            label="Billing type"
            options={[{ value: 'hybrid', label: 'Hybrid' }, { value: 'hourly', label: 'Hourly' }, { value: 'fixed', label: 'Fixed' }]}
            value={hireBillingType}
            onChange={(v) => setHireBillingType(v === 'hybrid' || v === 'hourly' || v === 'fixed' ? v : 'hybrid')}
            placement="below"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Hourly rate" value={hireHourlyRate} onChange={(e) => setHireHourlyRate(e.target.value)} />
            <Input label="Fixed budget" value={hireFixedBudget} onChange={(e) => setHireFixedBudget(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button label="Cancel" variant="background" onClick={() => setHireApp(null)} />
            <Button label="Hire" onClick={handleHire} disabled={saving || !leadId} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MarketplacePage
