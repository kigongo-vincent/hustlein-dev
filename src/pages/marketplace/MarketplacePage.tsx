import { useCallback, useEffect, useMemo, useState } from 'react'
import marketplaceHeroGallery from '../../assets/gallery.png'
import Text, { baseFontSize } from '../../components/base/Text'
import View from '../../components/base/View'
import { Button, Input, Modal, Textarea, CustomSelect, RichTextEditor, CurrencyInput, FileAttachmentDropzone, EmptyState } from '../../components/ui'
import { Themestore, type ThemeI } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { companyService } from '../../services/companyService'
import { marketplaceService } from '../../services/marketplaceService'
import { userService } from '../../services/userService'
import type { ProjectPosting, ProjectApplication, User, Company } from '../../types'
import { AnimatePresence, motion } from 'framer-motion'
import { notifyError, notifySuccess } from '../../data/NotificationStore'
import MarketplaceProjectCard from '../../components/marketplace/MarketplaceProjectCard'
import { postingBudgetMax } from '../../utils/marketplaceBudget'
import {
  Plus, Send, CheckCircle2, XCircle, X, Search,
  DollarSign, SlidersHorizontal, FileText,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

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
  return postingBudgetMax(p)
}

const TRENDING_SKILLS = [
  'React', 'TypeScript', 'Go', 'Figma', 'Node.js', 'Python',
  'AWS', 'Flutter', 'Docker', 'PostgreSQL', 'UX', 'SEO',
]

const MARKETPLACE_PAGE_SIZE = 8

const SEARCH_DEBOUNCE_MS = 280

type SkeletonColors = {
  fg: string
  bg: string
  border: string
  muted: string
}

function skeletonColors(current: ThemeI | null | undefined): SkeletonColors {
  return {
    fg: current?.system?.foreground ?? 'rgba(255,255,255,0.06)',
    bg: current?.system?.background ?? 'rgba(0,0,0,0.04)',
    border: current?.system?.border ?? 'rgba(0,0,0,0.08)',
    muted: current?.system?.border ?? 'rgba(0,0,0,0.12)',
  }
}

/** Matches `MarketplaceProjectCard` default layout: logo row, badge, title, body, divider, skills, footer. */
function MarketplaceProjectCardSkeleton({ colors }: { colors: SkeletonColors }) {
  return (
    <View
      bg="fg"
      className="rounded-base p-6 shadow-custom animate-pulse min-w-0"
      style={{ backgroundColor: colors.fg }}
    >
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-start gap-4">
          <div className="flex flex-col gap-0 min-w-0">
            <div className="w-12 h-12 rounded-base shrink-0" style={{ backgroundColor: colors.muted, opacity: 0.45 }} />
            <div className="mt-3 space-y-2">
              <div className="h-4 rounded-md w-28" style={{ backgroundColor: colors.muted, opacity: 0.55 }} />
              <div className="h-3 rounded-md w-36" style={{ backgroundColor: colors.muted, opacity: 0.35 }} />
            </div>
          </div>
          <div
            className="h-9 rounded-full ml-auto shrink-0 w-[7.5rem]"
            style={{ backgroundColor: colors.muted, opacity: 0.3 }}
          />
        </div>
        <div className="h-5 rounded-md w-[72%] max-w-xl" style={{ backgroundColor: colors.muted, opacity: 0.5 }} />
        <div className="space-y-2">
          <div className="h-3.5 rounded-md w-full" style={{ backgroundColor: colors.muted, opacity: 0.28 }} />
          <div className="h-3.5 rounded-md w-[92%]" style={{ backgroundColor: colors.muted, opacity: 0.22 }} />
          <div className="h-3.5 rounded-md w-[58%]" style={{ backgroundColor: colors.muted, opacity: 0.18 }} />
        </div>
        <div className="h-px w-full" style={{ backgroundColor: colors.border, opacity: 0.85 }} />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-7 w-20 rounded-full" style={{ backgroundColor: colors.muted, opacity: 0.25 }} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <div className="h-4 rounded-md w-44" style={{ backgroundColor: colors.muted, opacity: 0.35 }} />
          <div className="h-10 w-[7.25rem] rounded-base" style={{ backgroundColor: colors.muted, opacity: 0.4 }} />
        </div>
      </div>
    </View>
  )
}

function MarketplaceProjectsGridSkeleton({
  colors,
  count = MARKETPLACE_PAGE_SIZE,
}: {
  colors: SkeletonColors
  count?: number
}) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }, (_, i) => (
        <MarketplaceProjectCardSkeleton key={i} colors={colors} />
      ))}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <div
          className="h-10 w-10 rounded-full animate-pulse"
          style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
        />
        <div className="h-10 w-40 rounded-md animate-pulse" style={{ backgroundColor: colors.muted, opacity: 0.35 }} />
        <div
          className="h-10 w-10 rounded-full animate-pulse"
          style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
        />
      </div>
    </div>
  )
}

/** Hero (40vh) + search row + project cards — mirrors loaded marketplace layout. */
function MarketplaceFullPageSkeleton({ colors }: { colors: SkeletonColors }) {
  return (
    <div className="space-y-8 w-full">
      <div className="relative overflow-hidden rounded-[4px] h-[40vh] max-h-[40vh] pl-[1rem] animate-pulse">
        <div className="absolute inset-0 bg-neutral-900" />
        <div
          className="absolute inset-0 pointer-events-none opacity-90"
          style={{
            background:
              'linear-gradient(77deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.25) 100%)',
          }}
        />
        <div className="relative z-10 flex h-full min-h-0 flex-col justify-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-10">
          <div className="flex min-h-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0 max-w-2xl space-y-2 sm:space-y-2.5">
              <div className="h-8 sm:h-9 rounded-md w-[min(100%,22rem)] bg-white/10" />
              <div className="h-3.5 rounded-md w-full max-w-[540px] bg-white/8" />
              <div className="h-3.5 rounded-md w-[88%] max-w-[480px] bg-white/6" />
            </div>
            <div className="h-10 w-36 rounded-base shrink-0 bg-white/10 self-start sm:self-auto" />
          </div>
          <div
            className="flex w-full max-w-xl shrink-0 items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 sm:gap-3 sm:px-3 sm:py-2 mt-1"
            style={{ background: 'rgba(0,0,0,0.35)' }}
          >
            <div className="h-4 w-4 rounded bg-white/15 shrink-0" />
            <div className="min-w-0 flex-1 h-4 rounded-md bg-white/10" />
            <div className="h-9 w-9 rounded-full bg-white/10 shrink-0" />
          </div>
        </div>
      </div>
      <MarketplaceProjectsGridSkeleton colors={colors} />
    </div>
  )
}

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
  /** Freelancer's applications — used to hide postings they've already applied to. */
  const [myApplications, setMyApplications] = useState<ProjectApplication[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selected, setSelected] = useState<ProjectPosting | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [skillFilter, setSkillFilter] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [createOpen, setCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createBudgetType, setCreateBudgetType] = useState<'hybrid' | 'hourly' | 'fixed'>('hybrid')
  const [createHourlyRate, setCreateHourlyRate] = useState('')
  const [createFixedBudget, setCreateFixedBudget] = useState('')
  const [createCurrency, setCreateCurrency] = useState('UGX')
  const [createSkills, setCreateSkills] = useState('')
  const [saving, setSaving] = useState(false)

  const [applyOpen, setApplyOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [applyAttachments, setApplyAttachments] = useState<File[]>([])
  const [appsOpen, setAppsOpen] = useState(false)
  const [applications, setApplications] = useState<ProjectApplication[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [hireApp, setHireApp] = useState<ProjectApplication | null>(null)
  const [companyUsers, setCompanyUsers] = useState<User[]>([])
  const [leadId, setLeadId] = useState('')
  const [hireBillingType, setHireBillingType] = useState<'hourly' | 'fixed' | 'hybrid'>('hybrid')
  const [hireHourlyRate, setHireHourlyRate] = useState('')
  const [hireFixedBudget, setHireFixedBudget] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const isFL = user?.role === 'freelancer'
      const listPromise = marketplaceService.listPostings()
      const myAppsPromise = isFL
        ? marketplaceService.listMyApplications().catch(() => [] as ProjectApplication[])
        : Promise.resolve<ProjectApplication[]>([])
      const companyPromise = isFL
        ? Promise.resolve<Company[]>([])
        : companyService.list().catch(() => [] as Company[])

      const [list, myApps, companyList] = await Promise.all([listPromise, myAppsPromise, companyPromise])
      setPostings(list)
      setMyApplications(myApps)
      setCompanies(companyList)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [search])

  const isSearchPending = search.trim() !== debouncedSearch.trim()
  const showProjectsSearchSkeleton = !loading && isSearchPending && search.trim().length > 0

  const skeletonPalette = useMemo(() => skeletonColors(current), [current])

  const openPostings = useMemo(() => {
    let base =
      isCompanyUser && user?.companyId
        ? postings.filter((p) => p.companyId === user.companyId && p.status === 'open')
        : postings.filter((p) => p.status === 'open')
    if (isFreelancer) {
      const appliedPostingIds = new Set(
        myApplications.filter((a) => a.status !== 'withdrawn').map((a) => a.postingId),
      )
      base = base.filter((p) => !appliedPostingIds.has(p.id))
    }
    return base
  }, [isCompanyUser, isFreelancer, myApplications, postings, user?.companyId])

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

  useEffect(() => {
    setPage(1)
  }, [search, budgetFilter, skillFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / MARKETPLACE_PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginated = useMemo(() => {
    const start = (page - 1) * MARKETPLACE_PAGE_SIZE
    return filtered.slice(start, start + MARKETPLACE_PAGE_SIZE)
  }, [filtered, page])

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

  const createBudgetValid = useMemo(() => {
    const h = createHourlyRate.trim()
    const f = createFixedBudget.trim()
    const hn = h ? Number(h) : NaN
    const fn = f ? Number(f) : NaN
    if (createBudgetType === 'hourly') return !!h && !Number.isNaN(hn)
    if (createBudgetType === 'fixed') return !!f && !Number.isNaN(fn)
    return !!h && !!f && !Number.isNaN(hn) && !Number.isNaN(fn)
  }, [createBudgetType, createHourlyRate, createFixedBudget])

  const handleCreate = async () => {
    if (!createTitle.trim() || !createBudgetValid) return
    setSaving(true)
    try {
      const skills = createSkills.split(',').map((s) => s.trim()).filter(Boolean)
      const hourlyN = createHourlyRate.trim() ? Number(createHourlyRate) : undefined
      const fixedN = createFixedBudget.trim() ? Number(createFixedBudget) : undefined
      const hourlyMin =
        createBudgetType === 'hourly' || createBudgetType === 'hybrid' ? hourlyN : undefined
      const hourlyMax = hourlyMin
      const fixedMin = createBudgetType === 'fixed' || createBudgetType === 'hybrid' ? fixedN : undefined
      const fixedMax = fixedMin
      const posting = await marketplaceService.createPosting({
        title: createTitle.trim(),
        description: createDesc.trim(),
        budgetType: createBudgetType,
        hourlyMin,
        hourlyMax,
        fixedMin,
        fixedMax,
        currency: createCurrency || 'UGX',
        requiredSkills: skills,
      })
      setPostings((prev) => [posting, ...prev])
      setCreateOpen(false)
      setCreateTitle('')
      setCreateDesc('')
      setCreateSkills('')
      notifySuccess('Project posted to the marketplace.')
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Could not create posting.')
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
      })

      if (applyAttachments.length > 0) {
        await Promise.all(
          applyAttachments.map((file) => marketplaceService.uploadApplicationFile(created.id, file)),
        )
      }

      setApplyOpen(false)
      setCoverLetter('')
      setApplyAttachments([])
      setMyApplications((prev) => [...prev, created])
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
      notifySuccess(
        status === 'shortlisted'
          ? 'Applicant shortlisted.'
          : status === 'rejected'
            ? 'Application rejected.'
            : 'Application updated.',
      )
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Could not update application.')
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
        currency: selected?.currency ?? hireApp.currency,
      })
      setApplications((prev) => prev.map((a) => (a.id === hireApp.id ? { ...a, status: 'hired' } : a)))
      setPostings((prev) =>
        prev.map((p) => (p.id === hireApp.postingId ? { ...p, status: 'closed' } : p)),
      )
      setHireApp(null)
      setAppsOpen(false)
      notifySuccess('Freelancer hired. A project workspace was created.')
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Could not complete hire.')
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
      {loading ? (
        <MarketplaceFullPageSkeleton colors={skeletonPalette} />
      ) : (
        <>
      {/* Hero — Netflix-style billboard + gallery backdrop (full main width, max 30vh) */}
      <div className="relative   overflow-hidden rounded-[4px] h-[40vh] max-h-[40vh] pl-[1rem] ">
        <img
          src={marketplaceHeroGallery}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
          decoding="async"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              'linear-gradient(77deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.62) 36%, rgba(0,0,0,0.22) 62%, rgba(0,0,0,0.05) 100%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 42%, rgba(0,0,0,0.88) 100%)',
          }}
        />
        <div className="relative z-10 flex h-full min-h-0 flex-col justify-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-10">
          <div className="flex min-h-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0 max-w-2xl space-y-1 sm:space-y-1.5">
              <Text
                className="font-bold leading-tight tracking-tight line-clamp-2"
                style={{
                  fontSize: baseFontSize * 1.85,
                  color: '#f5f5f5',
                  textShadow: '0 2px 28px rgba(0,0,0,0.55)',
                }}
              >
                Discover Kenya&apos;s
                {/* <br /> */}
                {/* <span style={{ color: current?.brand?.primary ?? '#E50914' }}>open projects</span> */}
                <span > open projects</span>
              </Text>
              <Text
                variant="sm"
                className="leading-snug max-w-[540px] line-clamp-2 sm:line-clamp-2"
                style={{
                  color: 'rgba(255,255,255,0.82)',
                  textShadow: '0 1px 14px rgba(0,0,0,0.45)',
                }}
              >
                A Kenyan-first workforce and operations platform designed for freelancers, consultants, and growing
                businesses. HustleIN is a wordplay that reflects Kenya&apos;s hustle culture.
              </Text>
            </div>
            {isCompanyUser && (
              <Button
                label="Post project"
                startIcon={<Plus className="w-4 h-4 shrink-0" />}
                onClick={() => setCreateOpen(true)}
                className="shrink-0 self-start sm:self-auto"
              />
            )}
          </div>

          <div
            className="flex w-full max-w-xl shrink-0 items-center gap-2 rounded-lg border border-white/15 px-2.5 py-1.5 backdrop-blur-md sm:gap-3 sm:px-3 sm:py-2"
            style={{ background: 'rgba(0,0,0,0.42)' }}
          >
            <Search className="h-4 w-4 shrink-0 text-white/45" />
            <input
              type="text"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="shrink-0 text-white/45 transition-opacity hover:text-white/90"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white/95"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
        </>
      )}

      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] min-h-[100dvh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 min-h-[100dvh]"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)',
                backdropFilter: 'saturate(1.3)',
              }}
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div
              className="absolute inset-y-0 right-0 flex w-full max-w-[420px] min-h-0 flex-col overflow-hidden"
              initial={{ x: 24 }}
              animate={{ x: 0 }}
              exit={{ x: 24 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{
                backgroundColor: current?.system?.foreground ?? undefined,
                borderLeft: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
              }}
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 scroll-slim">
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

      {/* Featured + results */}
      {!loading && (
      <div className="space-y-6">
        {showProjectsSearchSkeleton ? (
          <div
            className="w-full"
            role="status"
            aria-busy="true"
            aria-label="Updating search results"
          >
            <MarketplaceProjectsGridSkeleton colors={skeletonPalette} />
          </div>
        ) : filtered.length === 0 ? (
          <View bg="fg" className="rounded-base p-4 shadow-custom">
            <EmptyState
              variant={search || skillFilter || budgetFilter !== 'all' ? 'search' : 'folder'}
              title="No projects found"
              description={
                search || skillFilter
                  ? 'Try adjusting your search or filters to find more projects.'
                  : 'There are no open projects at the moment. Check back soon!'
              }
            >
              {(search || skillFilter || budgetFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setBudgetFilter('all')
                    setSkillFilter(null)
                    setSearch('')
                    setSortBy('newest')
                  }}
                  className="mt-2 text-[12px] font-medium px-4 py-2 rounded-full transition-opacity hover:opacity-80"
                  style={{ background: `${current?.brand?.primary ?? '#682308'}12`, color: current?.brand?.primary ?? '#682308' }}
                >
                  Clear all filters
                </button>
              )}
            </EmptyState>
          </View>
        ) : (
          <div className="space-y-4 w-full">
            {paginated.map((p) => (
              <MarketplaceProjectCard
                key={p.id}
                posting={p}
                company={companiesById[p.companyId] ?? null}
                isFreelancer={isFreelancer}
                theme={current!}
                skillColors={skillColors}
                variant="default"
                viewerUser={user ?? null}
                viewerIsCompanyAdmin={viewerIsCompanyAdmin}
                onApply={() => openApply(p)}
                onManageApplications={() => openApplications(p)}
              />
            ))}
            <div
              className="flex flex-wrap items-center justify-center gap-3 pt-2"
              style={{ color: current?.system?.dark }}
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
                style={{
                  borderColor: current?.system?.border ?? 'rgba(0,0,0,0.12)',
                  background: current?.system?.background ?? 'rgba(0,0,0,0.04)',
                }}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <Text variant="sm" className="min-w-[10rem] text-center font-medium" style={{ opacity: 0.85 }}>
                Page {page} of {totalPages}
                <span className="block text-[11px] font-normal mt-0.5" style={{ opacity: 0.65 }}>
                  {filtered.length} project{filtered.length === 1 ? '' : 's'}
                </span>
              </Text>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
                style={{
                  borderColor: current?.system?.border ?? 'rgba(0,0,0,0.12)',
                  background: current?.system?.background ?? 'rgba(0,0,0,0.04)',
                }}
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Create posting modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} variant="wide">
        <div className="p-7 space-y-5">
          <div>
            <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.2 }}>Post a new project</Text>
            <Text variant="sm" className="mt-1" style={{ opacity: 0.45 }}>
              Describe the role and set a fixed budget and/or hourly rate (single amounts, not ranges).
            </Text>
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
          {(createBudgetType === 'hourly' || createBudgetType === 'hybrid') && (
            <CurrencyInput
              label={createBudgetType === 'hybrid' ? 'Hourly rate' : 'Hourly rate (per hour)'}
              value={createHourlyRate}
              onChange={setCreateHourlyRate}
              currency={createCurrency}
              showCurrencySymbol={false}
            />
          )}
          {(createBudgetType === 'fixed' || createBudgetType === 'hybrid') && (
            <CurrencyInput
              label={createBudgetType === 'hybrid' ? 'Fixed budget (total)' : 'Fixed budget'}
              value={createFixedBudget}
              onChange={setCreateFixedBudget}
              currency={createCurrency}
              showCurrencySymbol={false}
            />
          )}
          <Input label="Required skills" placeholder="Comma-separated (e.g. React, Go, Figma)" value={createSkills} onChange={(e) => setCreateSkills(e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button label="Cancel" variant="background" onClick={() => setCreateOpen(false)} />
            <Button
              label="Post project"
              onClick={handleCreate}
              disabled={saving || !createTitle.trim() || !createBudgetValid}
              loading={saving}
            />
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
            linkInputMode="fields"
          />
          <div className="space-y-2">
            <FileAttachmentDropzone files={applyAttachments} onFilesChange={setApplyAttachments} disabled={saving} />

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
          <div className="flex justify-end gap-3 pt-2">
            <Button label="Cancel" variant="background" onClick={() => setApplyOpen(false)} />
            <Button label="Submit application" startIcon={<Send className="w-4 h-4 shrink-0" />} onClick={handleApply} disabled={saving} loading={saving} />
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
            <EmptyState variant="inbox" compact title="No applications yet" description="When freelancers apply, they’ll appear here." className="py-6" />
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
                      {(a.proposedHourlyRate != null || a.proposedFixed != null) && (
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-3.5 h-3.5" style={{ opacity: 0.4 }} />
                          <Text variant="sm" style={{ opacity: 0.6 }}>
                            {a.proposedHourlyRate != null ? `${formatMoney(a.proposedHourlyRate, a.currency)} / hr` : ''}
                            {a.proposedHourlyRate != null && a.proposedFixed != null ? ' + ' : ''}
                            {a.proposedFixed != null ? `${formatMoney(a.proposedFixed, a.currency)}` : ''}
                          </Text>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" label="Shortlist" variant="background" startIcon={<CheckCircle2 className="w-4 h-4 shrink-0" />} onClick={() => updateStatus(a, 'shortlisted')} disabled={saving || a.status === 'shortlisted' || a.status === 'hired'} loading={saving} />
                      <Button size="sm" label="Reject" variant="background" startIcon={<XCircle className="w-4 h-4 shrink-0" />} onClick={() => updateStatus(a, 'rejected')} disabled={saving || a.status === 'rejected' || a.status === 'hired'} loading={saving} />
                      <Button size="sm" label="Hire" onClick={() => { setHireApp(a); setLeadId(''); setHireHourlyRate(''); setHireFixedBudget('') }} disabled={saving || a.status === 'hired'} loading={saving} />
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
            <CurrencyInput
              label="Hourly rate"
              value={hireHourlyRate}
              onChange={setHireHourlyRate}
              currency={(selected?.currency ?? hireApp?.currency ?? 'UGX').trim().toUpperCase() || 'UGX'}
              showCurrencySymbol={false}
            />
            <CurrencyInput
              label="Fixed budget"
              value={hireFixedBudget}
              onChange={setHireFixedBudget}
              currency={(selected?.currency ?? hireApp?.currency ?? 'UGX').trim().toUpperCase() || 'UGX'}
              showCurrencySymbol={false}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button label="Cancel" variant="background" onClick={() => setHireApp(null)} />
            <Button label="Hire" onClick={handleHire} disabled={saving || !leadId} loading={saving} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MarketplacePage
