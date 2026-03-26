import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import Text, { baseFontSize } from '../../components/base/Text'
import View from '../../components/base/View'
import Logo, { LOGIN_LOGO_URL } from '../../components/base/Logo'
import { Card, Button, Skeleton, Modal, CustomSelect, DatePicker, Input, CurrencyInput } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { companyService } from '../../services'
import { invoiceService } from '../../services/invoiceService'
import type { Invoice, InvoiceStatus, InvoiceLineItem, Company } from '../../types'
import { downloadInvoicePdf } from '../../utils/invoicePdf'
import {
  Receipt,
  Eye,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  CheckCircle,
  Undo2,
  Download,
} from 'lucide-react'

const chartTickStyle = { fontSize: baseFontSize }
const legendStyle = { fontSize: baseFontSize }

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

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format date as DD/MM/YYYY for invoice document */
function formatDateShort(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Consultant-based billing: rate = gross / hoursPerMonth, amount = min(hoursLogged × rate, gross).
 * Max is always the gross.
 */
function computeConsultantLine(
  _consultantName: string,
  hoursLogged: number,
  hoursPerMonth: number,
  gross: number,
  periodLabel?: string
): InvoiceLineItem {
  const rate = hoursPerMonth > 0 ? gross / hoursPerMonth : 0
  const uncapped = hoursLogged * rate
  const total = Math.min(uncapped, gross)
  // Period display should not include consultant names (avoid duplicates / multi-name strings)
  const description = periodLabel ? periodLabel : 'Services'
  return {
    description,
    quantity: hoursLogged,
    unitPrice: Math.round(rate),
    total: Math.round(total),
    hoursPerMonth,
    gross,
  }
}

function getInvoiceLineItems(inv: Invoice): InvoiceLineItem[] {
  if (inv.lineItems && inv.lineItems.length > 0) return inv.lineItems
  return [
    {
      description: inv.description ?? 'Services',
      quantity: 1,
      unitPrice: inv.amount,
      total: inv.amount,
    },
  ]
}

/** Invoices with issuedDate or dueDate in the given year-month (YYYY-MM) */
function getInvoicesForMonth(invoices: Invoice[], yearMonth: string): Invoice[] {
  return invoices.filter((inv) => {
    const issued = inv.issuedDate?.slice(0, 7)
    const due = inv.dueDate.slice(0, 7)
    return issued === yearMonth || due === yearMonth
  })
}

function escapeCsvCell(value: string | number): string {
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function exportInvoicesToCsv(invoices: Invoice[], filename: string) {
  const headers = ['Invoice #', 'Client', 'Amount', 'Currency', 'Due date', 'Issued date', 'Status']
  const rows = invoices.map((inv) => [
    inv.number,
    inv.clientName,
    inv.amount,
    inv.currency,
    inv.dueDate,
    inv.issuedDate ?? '',
    inv.status,
  ])
  const csv = [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.map(escapeCsvCell).join(','))].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Status badge matching consultant details modal: rounded-full, text-xs font-normal, theme success/border/error */
function InvoiceStatusBadge({
  status,
  systemSuccess,
  systemError,
  systemDark,
}: {
  status: InvoiceStatus
  systemSuccess?: string
  systemError?: string
  systemDark?: string
}) {
  const isPaid = status === 'paid'
  const isOverdue = status === 'overdue'
  const label = isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Unpaid'
  const backgroundColor = isPaid
    ? (systemSuccess && /^#[0-9A-Fa-f]{6}$/.test(systemSuccess) ? `${systemSuccess}12` : 'rgba(34, 197, 94, 0.1)')
    : isOverdue
      ? (systemError ? `${systemError}20` : 'rgba(185, 28, 28, 0.15)')
      : 'rgba(0,0,0,0.05)'
  const color = isPaid
    ? (systemSuccess ?? systemDark)
    : isOverdue
      ? (systemError ?? systemDark)
      : systemDark

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-normal"
      style={{ backgroundColor, color }}
    >
      {label}
    </span>
  )
}

/** Default issuer/bank when invoice has no data (invoices will come with data) */
const DEFAULT_ISSUER = {
  name: 'Your company',
  email: 'billing@company.com',
  phone: '+256 700 000 000',
  address: 'Company address',
  abn: undefined,
}

const DEFAULT_BANK = {
  bankName: 'Stanbic Bank',
  bsb: undefined,
  accountNumber: '9030001234567',
  accountName: 'Company account',
}

/** Mock data: consultant-based billing (rate = gross / hoursPerMonth, total = min(hoursLogged × rate, gross)) */
const MOCK_INVOICES: Invoice[] = (() => {
  const inv1Lines = [
    computeConsultantLine('Jane Lead', 128, 160, 4_500_000, 'January 2025'),
  ]
  const inv2Lines = [
    computeConsultantLine('Bob Consultant', 130, 160, 2_200_000, 'February 2025'),
  ]
  const inv3Lines = [
    computeConsultantLine('Alice Dev', 120, 160, 1_800_000, 'January 2025'),
  ]
  const inv4Lines = [
    computeConsultantLine('Jane Lead', 160, 160, 4_500_000, 'December 2024'),
    computeConsultantLine('Bob Consultant', 142, 160, 2_200_000, 'December 2024'),
  ]
  const inv5Lines = [
    computeConsultantLine('Bob Consultant', 170, 160, 2_200_000, 'Q1 2025'),
  ]
  return [
    {
      id: 'inv1',
      number: '001',
      clientName: 'Acme Corp',
      consultantName: 'Jane Lead',
      amount: inv1Lines.reduce((s, l) => s + l.total, 0),
      currency: 'UGX',
      dueDate: '2025-02-28',
      issuedDate: '2025-02-01',
      status: 'unpaid',
      description: 'Consultant services – January 2025',
      issuer: { ...DEFAULT_ISSUER },
      bank: DEFAULT_BANK,
      lineItems: inv1Lines,
    },
    {
      id: 'inv2',
      number: '002',
      clientName: 'Tech Solutions Ltd',
      consultantName: 'Bob Consultant',
      amount: inv2Lines.reduce((s, l) => s + l.total, 0),
      currency: 'UGX',
      dueDate: '2025-02-15',
      issuedDate: '2025-02-01',
      status: 'paid',
      paidAt: '2025-02-14',
      description: 'Consultant services – February 2025',
      issuer: DEFAULT_ISSUER,
      bank: DEFAULT_BANK,
      lineItems: inv2Lines,
    },
    {
      id: 'inv3',
      number: '003',
      clientName: 'Build Co',
      consultantName: 'Alice Dev',
      amount: inv3Lines.reduce((s, l) => s + l.total, 0),
      currency: 'UGX',
      dueDate: '2025-01-31',
      issuedDate: '2025-01-15',
      status: 'overdue',
      description: 'Consultant services – January 2025',
      issuer: DEFAULT_ISSUER,
      bank: DEFAULT_BANK,
      lineItems: inv3Lines,
    },
    {
      id: 'inv4',
      number: '012',
      clientName: 'Acme Corp',
      consultantName: 'Jane Lead, Bob Consultant',
      amount: inv4Lines.reduce((s, l) => s + l.total, 0),
      currency: 'UGX',
      dueDate: '2024-12-20',
      issuedDate: '2024-12-01',
      status: 'paid',
      paidAt: '2024-12-18',
      description: 'Consultant services – December 2024',
      issuer: DEFAULT_ISSUER,
      bank: DEFAULT_BANK,
      lineItems: inv4Lines,
    },
    {
      id: 'inv5',
      number: '004',
      clientName: 'Startup Inc',
      consultantName: 'Bob Consultant',
      amount: inv5Lines.reduce((s, l) => s + l.total, 0),
      currency: 'UGX',
      dueDate: '2025-03-10',
      issuedDate: '2025-02-15',
      status: 'unpaid',
      description: 'Consultant services – Q1 2025 (capped at gross)',
      issuer: DEFAULT_ISSUER,
      bank: DEFAULT_BANK,
      lineItems: inv5Lines,
    },
  ]
})()
void MOCK_INVOICES

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'overdue', label: 'Overdue' },
]

const FILTER_SIDEBAR_DURATION_MS = 220

function getStatIcon(label: string) {
  const n = label.toLowerCase()
  if (n.includes('total')) return <Receipt />
  if (n.includes('paid')) return <CheckCircle />
  if (n.includes('unpaid')) return <FileText />
  return <Calendar />
}

const InvoicesPage = () => {
  const { current, mode } = Themestore()
  const { user } = Authstore()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)
  const [markPaidIds, setMarkPaidIds] = useState<string[] | null>(null)
  const [unmarkPaidIds, setUnmarkPaidIds] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | ''>('')
  const [filterIssuedFrom, setFilterIssuedFrom] = useState('')
  const [filterIssuedTo, setFilterIssuedTo] = useState('')
  const [filterDueFrom, setFilterDueFrom] = useState('')
  const [filterDueTo, setFilterDueTo] = useState('')
  const [filterAmountMin, setFilterAmountMin] = useState('')
  const [filterAmountMax, setFilterAmountMax] = useState('')
  const [filterCurrency, setFilterCurrency] = useState('')
  const [filterSidebarExiting, setFilterSidebarExiting] = useState(false)
  const [filterSidebarEntered, setFilterSidebarEntered] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'processing' | 'pending' | 'paid'>('all')
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [draftStatus, setDraftStatus] = useState<InvoiceStatus | ''>('')
  const [draftIssuedFrom, setDraftIssuedFrom] = useState('')
  const [draftIssuedTo, setDraftIssuedTo] = useState('')
  const [draftDueFrom, setDraftDueFrom] = useState('')
  const [draftDueTo, setDraftDueTo] = useState('')
  const [draftAmountMin, setDraftAmountMin] = useState('')
  const [draftAmountMax, setDraftAmountMax] = useState('')
  const [draftCurrency, setDraftCurrency] = useState('')
  const PAGE_SIZE = 10

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user?.companyId) return
      const c = await companyService.get(user.companyId)
      if (!cancelled) setCompany(c)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.companyId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user?.companyId) {
        setInvoices([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const list = await invoiceService.listByCompany(user.companyId)
        if (!cancelled) setInvoices(list)
      } catch {
        if (!cancelled) setInvoices([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.companyId])

  const searchLower = searchQuery.trim().toLowerCase()
  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      !searchLower ||
      inv.number.toLowerCase().includes(searchLower) ||
      inv.clientName.toLowerCase().includes(searchLower)
    const matchStatus = !filterStatus || inv.status === filterStatus
    const matchIssuedFrom = !filterIssuedFrom || (inv.issuedDate ?? '') >= filterIssuedFrom
    const matchIssuedTo = !filterIssuedTo || (inv.issuedDate ?? inv.dueDate) <= filterIssuedTo
    const matchDueFrom = !filterDueFrom || inv.dueDate >= filterDueFrom
    const matchDueTo = !filterDueTo || inv.dueDate <= filterDueTo
    const amountMin = filterAmountMin ? Number(filterAmountMin) : NaN
    const amountMax = filterAmountMax ? Number(filterAmountMax) : NaN
    const matchAmountMin = isNaN(amountMin) || inv.amount >= amountMin
    const matchAmountMax = isNaN(amountMax) || inv.amount <= amountMax
    const matchCurrency = !filterCurrency || inv.currency === filterCurrency
    const matchTab =
      activeTab === 'all'
        ? true
        : activeTab === 'paid'
          ? inv.status === 'paid'
          : activeTab === 'processing'
            ? inv.status === 'unpaid'
            : inv.status === 'overdue'
    return (
      matchSearch &&
      matchStatus &&
      matchIssuedFrom &&
      matchIssuedTo &&
      matchDueFrom &&
      matchDueTo &&
      matchAmountMin &&
      matchAmountMax &&
      matchCurrency &&
      matchTab
    )
  })

  // Sorting removed from filter UI; keep a consistent default ordering (due date earliest first)
  const sortedInvoices = [...filteredInvoices].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

  const totalInvoices = sortedInvoices.length
  const totalPages = Math.max(1, Math.ceil(totalInvoices / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const paginatedInvoices = sortedInvoices.slice(start, start + PAGE_SIZE)

  useEffect(() => {
    if (safePage !== page) setPage(safePage)
  }, [safePage, page])

  useEffect(() => {
    setPage(1)
  }, [
    searchQuery,
    filterStatus,
    filterIssuedFrom,
    filterIssuedTo,
    filterDueFrom,
    filterDueTo,
    filterAmountMin,
    filterAmountMax,
    filterCurrency,
  ])

  useEffect(() => {
    if (filterOpen) {
      setFilterSidebarExiting(false)
      setFilterSidebarEntered(false)
      const start = requestAnimationFrame(() => {
        requestAnimationFrame(() => setFilterSidebarEntered(true))
      })
      return () => cancelAnimationFrame(start)
    } else {
      setFilterSidebarEntered(false)
    }
  }, [filterOpen])

  useEffect(() => {
    if (!filterOpen) return
    setDraftStatus(filterStatus)
    setDraftIssuedFrom(filterIssuedFrom)
    setDraftIssuedTo(filterIssuedTo)
    setDraftDueFrom(filterDueFrom)
    setDraftDueTo(filterDueTo)
    setDraftAmountMin(filterAmountMin)
    setDraftAmountMax(filterAmountMax)
    setDraftCurrency(filterCurrency)
  }, [
    filterOpen,
    filterStatus,
    filterIssuedFrom,
    filterIssuedTo,
    filterDueFrom,
    filterDueTo,
    filterAmountMin,
    filterAmountMax,
    filterCurrency,
  ])

  const closeFilterSidebar = useCallback(() => {
    setFilterSidebarExiting(true)
    const t = setTimeout(() => {
      setFilterOpen(false)
      setFilterSidebarExiting(false)
    }, FILTER_SIDEBAR_DURATION_MS)
    return () => clearTimeout(t)
  }, [])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const onPage = paginatedInvoices.map((i) => i.id)
    const allSelected = onPage.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      onPage.forEach((id) => (allSelected ? next.delete(id) : next.add(id)))
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const openMarkPaid = (ids: string[]) => {
    const unpaid = ids.filter((id) => {
      const inv = invoices.find((i) => i.id === id)
      return inv && inv.status !== 'paid'
    })
    if (unpaid.length > 0) setMarkPaidIds(unpaid)
  }

  const openUnmarkPaid = (ids: string[]) => {
    const paid = ids.filter((id) => invoices.find((i) => i.id === id)?.status === 'paid')
    if (paid.length > 0) setUnmarkPaidIds(paid)
  }

  const handleMarkPaidConfirm = () => {
    if (!markPaidIds?.length) return
    setSaving(true)
    ;(async () => {
      try {
        const updated = await Promise.all(
          markPaidIds.map(async (id) => (await invoiceService.markPaid(id)) ?? null)
        )
        setInvoices((prev) =>
          prev.map((inv) => {
            const u = updated.find((x) => x?.id === inv.id)
            return u ? u : inv
          })
        )
        setMarkPaidIds(null)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          markPaidIds.forEach((id) => next.delete(id))
          return next
        })
      } finally {
        setSaving(false)
      }
    })()
  }

  const handleUnmarkPaidConfirm = () => {
    if (!unmarkPaidIds?.length) return
    setSaving(true)
    ;(async () => {
      try {
        const updated = await Promise.all(
          unmarkPaidIds.map(async (id) => (await invoiceService.update(id, { status: 'unpaid', paidAt: '' })) ?? null)
        )
        setInvoices((prev) =>
          prev.map((inv) => {
            const u = updated.find((x) => x?.id === inv.id)
            return u ? u : inv
          })
        )
        setUnmarkPaidIds(null)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          unmarkPaidIds.forEach((id) => next.delete(id))
          return next
        })
      } finally {
        setSaving(false)
      }
    })()
  }

  const total = invoices.length
  const paidCount = invoices.filter((i) => i.status === 'paid').length
  const unpaidCount = invoices.filter((i) => i.status === 'unpaid').length
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length
  const amountSpent = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const statCards = [
    { label: 'Total invoices', value: total, caption: 'All time' },
    { label: 'Paid', value: paidCount, caption: 'Completed' },
    { label: 'Unpaid', value: unpaidCount, caption: 'Pending' },
    {
      label: 'Amount spent',
      value: formatCurrency(amountSpent, 'UGX'),
      caption: 'Total paid so far',
    },
  ]

  const byStatusData = [
    { name: 'Paid', count: paidCount },
    { name: 'Unpaid', count: unpaidCount },
    { name: 'Overdue', count: overdueCount },
  ].filter((d) => d.count > 0)

  const trendData = useMemo(() => {
    const now = new Date()
    const months: { month: string; amount: number; count: number }[] = []
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = d.toISOString().slice(0, 7)
      const monthLabel = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
      const invs = invoices.filter((inv) => {
        const issued = inv.issuedDate?.slice(0, 7) ?? inv.dueDate.slice(0, 7)
        return issued === monthKey
      })
      months.push({
        month: monthLabel,
        amount: invs.reduce((s, inv) => s + inv.amount, 0),
        count: invs.length,
      })
    }
    return months
  }, [invoices])

  const dark = current?.system?.dark
  const gridColor = dark ? `${dark}40` : 'rgba(0,0,0,0.08)'
  const primaryColor = current?.brand?.primary ?? '#682308'
  const secondaryColor = current?.brand?.secondary ?? '#FF9600'
  const chartColors = getChartColors(primaryColor, secondaryColor, Math.max(byStatusData.length, 2))
  const tickProps = dark ? { ...chartTickStyle, fill: dark } : chartTickStyle
  const tooltipContentStyle = {
    fontSize: baseFontSize * 1.08,
    backgroundColor: current?.system?.foreground,
    border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
    borderRadius: 4,
    color: dark,
  }
  const tooltipCursor =
    mode === 'dark'
      ? { fill: dark ? `${dark}18` : 'rgba(255,255,255,0.06)', stroke: current?.system?.border ?? 'rgba(255,255,255,0.08)' }
      : { fill: 'rgba(0,0,0,0.04)', stroke: current?.system?.border ?? 'rgba(0,0,0,0.1)' }

  const selectedUnpaidCount = markPaidIds
    ? markPaidIds.length
    : [...selectedIds].filter((id) => invoices.find((i) => i.id === id)?.status !== 'paid').length
  const selectedPaidCount = unmarkPaidIds
    ? unmarkPaidIds.length
    : [...selectedIds].filter((id) => invoices.find((i) => i.id === id)?.status === 'paid').length

  const currencyOptions = useMemo(() => {
    const set = new Set(invoices.map((i) => i.currency).filter(Boolean))
    return [{ value: '', label: 'All currencies' }, ...[...set].sort().map((c) => ({ value: c, label: c }))]
  }, [invoices])

  const hasActiveFilters =
    !!filterStatus ||
    !!filterIssuedFrom ||
    !!filterIssuedTo ||
    !!filterDueFrom ||
    !!filterDueTo ||
    !!filterAmountMin ||
    !!filterAmountMax ||
    !!filterCurrency

  const currentYearMonth = useMemo(() => new Date().toISOString().slice(0, 7), [])
  const invoicesForCurrentMonth = useMemo(
    () => getInvoicesForMonth(invoices, currentYearMonth),
    [invoices, currentYearMonth]
  )

  const handleExportCurrentMonth = () => {
    exportInvoicesToCsv(invoicesForCurrentMonth, `invoices-${currentYearMonth}.csv`)
  }

  const handleDownloadInvoicePdf = (inv: Invoice) => {
    const items = getInvoiceLineItems(inv)
    downloadInvoicePdf({
      invoice: inv,
      company,
      taxRate: company?.taxRate ?? 0,
      lineItems: items,
    })
  }

  const handleExportSelected = () => {
    const selected = invoices.filter((inv) => selectedIds.has(inv.id))
    if (selected.length === 0) return
    exportInvoicesToCsv(selected, `invoices-selected-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="w-full mx-auto space-y-4">
      <View bg="bg" className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Text className="font-medium">Invoices</Text>
            <Text variant="sm" className="opacity-80">
              Track consultant hours and billing
            </Text>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondaryBrand"
              size="sm"
              label="View analytics"
              startIcon={<BarChart className="w-4 h-4 shrink-0" />}
              onClick={() => setAnalyticsOpen(true)}
              disabled={loading || invoices.length === 0}
            />
            <Button
              size="sm"
              label="Export for current month"
              startIcon={<Download className="w-4 h-4 shrink-0" />}
              onClick={handleExportCurrentMonth}
              disabled={invoicesForCurrentMonth.length === 0}
            />
          </div>
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

      {/* Top charts moved to analytics modal */}

      <div
        role="tablist"
        aria-label="Invoice status"
        className="flex flex-wrap items-center gap-2 pb-2 border-b"
        style={{ borderColor: current?.system?.border ?? 'rgba(0,0,0,0.08)' }}
      >
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'processing', label: 'Processing' },
            { id: 'pending', label: 'Pending' },
            { id: 'paid', label: 'Paid' },
          ] as const
        ).map((t) => {
          const selected = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className="px-3 py-2 rounded-md font-medium opacity-90 hover:opacity-100 transition"
              style={{
                fontSize: Math.max(11, baseFontSize * 0.95),
                backgroundColor: selected
                  ? `${current?.brand?.primary ?? '#682308'}14`
                  : (current?.system?.foreground ?? '#fff'),
                color: selected ? (current?.brand?.primary ?? current?.system?.dark) : current?.system?.dark,
                border: `1px solid ${selected ? `${current?.brand?.primary ?? '#682308'}44` : (current?.system?.border ?? 'rgba(0,0,0,0.12)')}`,
              }}
              aria-pressed={selected}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <Card
        title="Invoices"
        subtitle="Consultant billing by hours & rate"
        className="p-0 overflow-hidden"
        titleSuffix={
          <div
            className="flex items-center flex-1 min-w-0 max-w-md justify-end rounded-base overflow-hidden"
            style={{ backgroundColor: current?.system?.background ?? 'rgba(0,0,0,0.03)' }}
          >
            <div className="flex-1 min-w-0">
              <Input
                label="Search"
                placeholder="Search by invoice number or client…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search invoices"
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="shrink-0 p-2.5 transition-opacity hover:opacity-100 opacity-90 focus:outline-none focus:ring-0"
              style={{
                color: current?.system?.dark,
                backgroundColor: filterOpen ? `${current?.brand?.primary ?? '#682308'}14` : 'transparent',
              }}
              title="Filter"
              aria-label="Open filters"
              aria-expanded={filterOpen}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton height="h-4" width="w-4" />
                <div className="flex-1 space-y-1">
                  <Skeleton height="h-4" width="w-32" />
                  <Skeleton height="h-3" width="w-48" />
                </div>
                <Skeleton height="h-6" width="w-20" />
              </div>
            ))}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <Text variant="sm" className="opacity-80">
              {invoices.length === 0
                ? 'No invoices yet.'
                : 'No invoices match your search or filters.'}
            </Text>
          </div>
        ) : (
          <div className="overflow-x-auto scroll-slim">
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b overflow-hidden"
                  style={{
                    backgroundColor: current?.system?.background,
                    borderColor: current?.system?.border ?? 'rgba(0,0,0,0.08)',
                  }}
                >
                <Text variant="sm" style={{ color: dark }}>
                  {selectedIds.size} selected
                </Text>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    label="Export"
                    startIcon={<Download className="w-4 h-4 shrink-0" />}
                    onClick={handleExportSelected}
                  />
                  <Button
                    size="sm"
                    label="Mark as paid"
                    startIcon={<CheckCircle className="w-4 h-4 shrink-0" />}
                    onClick={() => openMarkPaid([...selectedIds])}
                    disabled={selectedUnpaidCount === 0}
                  />
                  <Button
                    size="sm"
                    label="Unmark"
                    startIcon={<Undo2 className="w-4 h-4 shrink-0" />}
                    onClick={() => openUnmarkPaid([...selectedIds])}
                    disabled={selectedPaidCount === 0}
                  />
                  <Button size="sm" label="Clear selection" variant="secondary" onClick={clearSelection} />
                </div>
                </motion.div>
              )}
            </AnimatePresence>

            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}` }}>
                  <th className="text-left px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        paginatedInvoices.length > 0 &&
                        paginatedInvoices.every((i) => selectedIds.has(i.id))
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                      style={{ accentColor: current?.brand?.primary }}
                      aria-label="Select all on page"
                    />
                  </th>
                  <th className="text-left px-4 py-3">
                    <Text variant="sm" className="font-medium">
                      Invoice #
                    </Text>
                  </th>
                  <th className="text-left px-4 py-3">
                    <Text variant="sm" className="font-medium">
                      Client
                    </Text>
                  </th>
                  <th className="text-left px-4 py-3">
                    <Text variant="sm" className="font-medium">
                      Consultant
                    </Text>
                  </th>
                  <th className="text-left px-4 py-3">
                    <Text variant="sm" className="font-medium">
                      Amount
                    </Text>
                  </th>
                  <th className="text-left px-4 py-3">
                    <Text variant="sm" className="font-medium">
                      Due date
                    </Text>
                  </th>
                  <th className="text-left px-4 py-3">
                    <Text variant="sm" className="font-medium">
                      Status
                    </Text>
                  </th>
                  <th className="text-right px-4 py-3 w-[1%] whitespace-nowrap">
                    <Text variant="sm" className="font-medium">
                      Actions
                    </Text>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((inv, index) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: index * 0.02 }}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? current?.system?.foreground : current?.system?.background,
                      borderBottom: `1px solid ${current?.system?.border ?? (mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                    }}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(inv.id)}
                        onChange={() => toggleSelect(inv.id)}
                        className="rounded border-gray-300"
                        style={{ accentColor: current?.brand?.primary }}
                        aria-label={`Select ${inv.number}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Text className="font-medium">{inv.number}</Text>
                    </td>
                    <td className="px-4 py-3">
                      <Text variant="sm" className="opacity-80">
                        {inv.clientName}
                      </Text>
                    </td>
                    <td className="px-4 py-3">
                      <Text variant="sm" className="opacity-80">
                        {inv.consultantName ?? '—'}
                      </Text>
                    </td>
                    <td className="px-4 py-3">
                      <Text variant="sm">{formatCurrency(inv.amount, inv.currency)}</Text>
                    </td>
                    <td className="px-4 py-3">
                      <Text variant="sm" className="opacity-80">
                        {formatDate(inv.dueDate)}
                      </Text>
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge
                        status={inv.status}
                        systemSuccess={current?.system?.success}
                        systemError={current?.system?.error}
                        systemDark={dark}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoicePdf(inv)}
                          className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
                          style={{ color: dark }}
                          title="Download PDF"
                          aria-label="Download invoice PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewInvoice(inv)}
                          className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
                          style={{ color: dark }}
                          title="View"
                          aria-label="View invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => openMarkPaid([inv.id])}
                            className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
                            style={{ color: dark }}
                            title="Mark as paid"
                            aria-label="Mark as paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {inv.status === 'paid' && (
                          <button
                            type="button"
                            onClick={() => openUnmarkPaid([inv.id])}
                            className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
                            style={{ color: dark }}
                            title="Unmark as paid"
                            aria-label="Unmark as paid"
                          >
                            <Undo2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {totalInvoices > 0 && (
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t"
                style={{ borderColor: current?.system?.border ?? 'rgba(0,0,0,0.08)' }}
              >
                <Text variant="sm" style={{ color: current?.system?.dark }}>
                  Showing {start + 1}–{Math.min(start + PAGE_SIZE, totalInvoices)} of {totalInvoices}
                </Text>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="p-2 rounded-base disabled:opacity-40 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{ color: current?.system?.dark }}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <Text variant="sm" style={{ color: current?.system?.dark }}>
                    Page {safePage} of {totalPages}
                  </Text>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="p-2 rounded-base disabled:opacity-40 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{ color: current?.system?.dark }}
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Filter sidebar */}
      <AnimatePresence>
        {(filterOpen || filterSidebarExiting) && (
          <>
            <motion.div
              key="filter-overlay"
              role="presentation"
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: filterSidebarEntered && !filterSidebarExiting ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FILTER_SIDEBAR_DURATION_MS / 1000 }}
              style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
              onClick={closeFilterSidebar}
              aria-hidden
            />
            <motion.aside
              key="filter-aside"
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col shadow-lg"
              initial={{ x: '100%' }}
              animate={{ x: filterSidebarEntered && !filterSidebarExiting ? 0 : '100%' }}
              exit={{ x: '100%' }}
              transition={{ duration: FILTER_SIDEBAR_DURATION_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
              style={{
                backgroundColor: current?.system?.foreground ?? '#fff',
                borderLeft: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
              }}
              aria-label="Filter invoices"
            >
            <div
              className="flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0"
              style={{ borderColor: current?.system?.border }}
            >
              <Text className="font-medium">Filters</Text>
              <button
                type="button"
                onClick={closeFilterSidebar}
                className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{ color: current?.system?.dark }}
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto scroll-slim flex-1 min-h-0 space-y-5">
              <CustomSelect
                label="Status"
                options={STATUS_OPTIONS}
                value={draftStatus}
                onChange={(v) => setDraftStatus((v || '') as InvoiceStatus | '')}
                placeholder="All statuses"
                aria-label="Filter by status"
                placement="below"
              />
              <CustomSelect
                label="Currency"
                options={currencyOptions}
                value={draftCurrency}
                onChange={(v) => setDraftCurrency(v || '')}
                placeholder="All currencies"
                aria-label="Filter by currency"
                placement="below"
              />
              <div className="relative min-h-[3.5rem]">
                <DatePicker
                  label="Issued date from"
                  value={draftIssuedFrom}
                  onChange={setDraftIssuedFrom}
                  placeholder="dd/mm/yyyy"
                  mode="outline"
                />
              </div>
              <div className="relative min-h-[3.5rem]">
                <DatePicker
                  label="Issued date to"
                  value={draftIssuedTo}
                  onChange={setDraftIssuedTo}
                  placeholder="dd/mm/yyyy"
                  mode="outline"
                />
              </div>
              <div className="relative min-h-[3.5rem]">
                <DatePicker
                  label="Due date from"
                  value={draftDueFrom}
                  onChange={setDraftDueFrom}
                  placeholder="dd/mm/yyyy"
                  mode="outline"
                />
              </div>
              <div className="relative min-h-[3.5rem]">
                <DatePicker
                  label="Due date to"
                  value={draftDueTo}
                  onChange={setDraftDueTo}
                  placeholder="dd/mm/yyyy"
                  mode="outline"
                />
              </div>
              <CurrencyInput
                label="Amount min"
                value={draftAmountMin}
                currency={draftCurrency || 'UGX'}
                onChange={setDraftAmountMin}
                placeholder="Min amount"
                ariaLabel="Amount minimum"
                showCurrencySymbol={false}
              />
              <CurrencyInput
                label="Amount max"
                value={draftAmountMax}
                currency={draftCurrency || 'UGX'}
                onChange={setDraftAmountMax}
                placeholder="Max amount"
                ariaLabel="Amount maximum"
                showCurrencySymbol={false}
              />
              <div className="pt-3 mt-1 space-y-3 border-t" style={{ borderColor: current?.system?.border ?? 'rgba(0,0,0,0.08)' }}>
                <Button
                  size="sm"
                  fullWidth
                  label="Apply filters"
                  onClick={() => {
                    setFilterStatus(draftStatus)
                    setFilterIssuedFrom(draftIssuedFrom)
                    setFilterIssuedTo(draftIssuedTo)
                    setFilterDueFrom(draftDueFrom)
                    setFilterDueTo(draftDueTo)
                    setFilterAmountMin(draftAmountMin)
                    setFilterAmountMax(draftAmountMax)
                    setFilterCurrency(draftCurrency)
                    closeFilterSidebar()
                  }}
                />
                <Button
                  size="sm"
                  fullWidth
                  variant="background"
                  label="Reset filters"
                  onClick={() => {
                    setDraftStatus('')
                    setDraftIssuedFrom('')
                    setDraftIssuedTo('')
                    setDraftDueFrom('')
                    setDraftDueTo('')
                    setDraftAmountMin('')
                    setDraftAmountMax('')
                    setDraftCurrency('')
                    setFilterStatus('')
                    setFilterIssuedFrom('')
                    setFilterIssuedTo('')
                    setFilterDueFrom('')
                    setFilterDueTo('')
                    setFilterAmountMin('')
                    setFilterAmountMax('')
                    setFilterCurrency('')
                  }}
                  disabled={!hasActiveFilters}
                />
              </div>
            </div>
          </motion.aside>
        </>
        )}
      </AnimatePresence>

      {/* View invoice modal — professional document layout (benchmarked) */}
      <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} variant="wide">
        {viewInvoice && (() => {
          const issuer = viewInvoice.issuer ?? DEFAULT_ISSUER
          const bank = viewInvoice.bank ?? DEFAULT_BANK
          const lineItems = getInvoiceLineItems(viewInvoice)
          const logoUrl = viewInvoice.logoUrl ?? LOGIN_LOGO_URL
          const taxRate = company?.taxRate ?? 0
          const subtotal = viewInvoice.amount
          const taxAmount = taxRate > 0 ? Math.round((subtotal * taxRate) / 100) : 0
          const totalWithTax = subtotal + taxAmount
          return (
            <motion.div
              className="min-w-0 w-full flex flex-col flex-1 min-h-0"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{ backgroundColor: current?.system?.foreground }}
            >
              {/* Header: left = Invoice + issuer; right = logo + recipient & meta */}
              <div className="px-8 pt-16 pb-8 shrink-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="min-w-0">
                  <h1
                    className="font-bold m-0"
                    style={{ fontSize: baseFontSize * 1.75, color: dark }}
                  >
                    Invoice
                  </h1>
                  {issuer.name && (
                    <Text variant="sm" className="mt-1.5 block" style={{ color: dark }}>
                      {issuer.name}
                    </Text>
                  )}
                  <div className="mt-2 space-y-0.5" style={{ color: dark }}>
                    {issuer.abn && (
                      <Text variant="sm" className="block">ABN: {issuer.abn}</Text>
                    )}
                    {issuer.email && (
                      <Text variant="sm" className="block">Email: {issuer.email}</Text>
                    )}
                    {issuer.phone && (
                      <Text variant="sm" className="block">Phone: {issuer.phone}</Text>
                    )}
                    {issuer.address && (
                      <Text variant="sm" className="block">Address: {issuer.address}</Text>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-5">
                  <Logo size="lg" src={logoUrl} className="shrink-0" />
                  <div className="text-right space-y-0.5" style={{ color: dark }}>
                    <Text variant="sm" className="block">Bill to: {viewInvoice.clientName}</Text>
                    <Text variant="sm" className="block">Invoice ID: {viewInvoice.number}</Text>
                    <Text variant="sm" className="block">Date of issue: {formatDateShort(viewInvoice.issuedDate)}</Text>
                    <Text variant="sm" className="block">Payment due: {formatDateShort(viewInvoice.dueDate)}</Text>
                  </div>
                </div>
              </div>

              {/* Consultant hours & rate — table benchmarked from invoices list (fg/bg) */}
              <div
                className="px-10 py-6 overflow-y-auto scroll-slim flex-1 min-h-0 rounded-base"
                style={{ color: dark, backgroundColor: current?.system?.background }}
              >
                <h2
                  className="font-bold mb-3"
                  style={{ fontSize: baseFontSize * 1.1, color: dark }}
                >
                  Consultant hours & rate
                </h2>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-3">
                        <Text variant="sm" className="font-medium" style={{ color: dark }}>Period</Text>
                      </th>
                      <th className="text-right px-4 py-3 w-20">
                        <Text variant="sm" className="font-medium" style={{ color: dark }}>Hours</Text>
                      </th>
                      <th className="text-right px-4 py-3 w-28">
                        <Text variant="sm" className="font-medium" style={{ color: dark }}>Hourly rate</Text>
                      </th>
                      <th className="text-right px-4 py-3 w-28">
                        <Text variant="sm" className="font-medium" style={{ color: dark }}>Amount</Text>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          backgroundColor:
                            i % 2 === 0 ? current?.system?.foreground : current?.system?.background,
                        }}
                      >
                        <td className="px-4 py-3" style={{ fontSize: baseFontSize, color: dark }}>{row.description}</td>
                        <td className="px-4 py-3 text-right" style={{ fontSize: baseFontSize, color: dark }}>{row.quantity}</td>
                        <td className="px-4 py-3 text-right" style={{ fontSize: baseFontSize, color: dark }}>
                          {formatCurrency(row.unitPrice, viewInvoice.currency)}
                        </td>
                        <td className="px-4 py-3 text-right" style={{ fontSize: baseFontSize, color: dark }}>
                          {formatCurrency(row.total, viewInvoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Amount due — right-aligned, prominent */}
                <div className="mt-6 flex flex-col items-end">
                  <Text variant="sm" className="opacity-90">Subtotal:</Text>
                  <span className="mt-0.5" style={{ fontSize: baseFontSize * 1.1, color: dark }}>
                    {formatCurrency(subtotal, viewInvoice.currency)}
                  </span>
                  {taxRate > 0 && (
                    <>
                      <Text variant="sm" className="opacity-90 mt-2">
                        Tax ({taxRate}%):
                      </Text>
                      <span className="mt-0.5" style={{ fontSize: baseFontSize * 1.1, color: dark }}>
                        {formatCurrency(taxAmount, viewInvoice.currency)}
                      </span>
                    </>
                  )}
                  <Text variant="sm" className="opacity-90 mt-3">Total amount due:</Text>
                  <span className="font-bold mt-0.5" style={{ fontSize: baseFontSize * 1.5, color: dark }}>
                    {formatCurrency(totalWithTax, viewInvoice.currency)}
                  </span>
                </div>
              </div>

              {/* Bank details + Paid on — on fg, not in bg */}
              <div className="px-10 py-6 shrink-0 overflow-y-auto scroll-slim" style={{ color: dark }}>
                {(bank.bankName || bank.bsb || bank.accountNumber || bank.accountName) && (
                  <div>
                    <h2
                      className="font-bold mb-2"
                      style={{ fontSize: baseFontSize * 1.1, color: dark }}
                    >
                      Bank details for payment:
                    </h2>
                    <div className="space-y-0.5" style={{ fontSize: baseFontSize }}>
                      {bank.bankName && <Text variant="sm" className="block">Bank: {bank.bankName}</Text>}
                      {bank.bsb && <Text variant="sm" className="block">BSB: {bank.bsb}</Text>}
                      {bank.accountNumber && (
                        <Text variant="sm" className="block">Account number: {bank.accountNumber}</Text>
                      )}
                      {bank.accountName && <Text variant="sm" className="block">Name: {bank.accountName}</Text>}
                    </div>
                  </div>
                )}
                {viewInvoice.status === 'paid' && viewInvoice.paidAt && (
                  <Text variant="sm" className="opacity-70 mt-4 block">
                    Paid on {formatDate(viewInvoice.paidAt)}
                  </Text>
                )}
              </div>

              <footer
                className="shrink-0 flex flex-row justify-end gap-3 py-4 px-8 border-t"
                style={{ borderColor: current?.system?.border }}
              >
                <Button
                  label="Download PDF"
                  startIcon={<Download className="w-4 h-4 shrink-0" />}
                  variant="secondary"
                  onClick={() => handleDownloadInvoicePdf(viewInvoice)}
                />
                {viewInvoice.status !== 'paid' ? (
                  <Button
                    label="Mark as paid"
                    startIcon={<CheckCircle className="w-4 h-4 shrink-0" />}
                    onClick={() => {
                      setViewInvoice(null)
                      openMarkPaid([viewInvoice.id])
                    }}
                  />
                ) : (
                  <Button
                    label="Unmark"
                    startIcon={<Undo2 className="w-4 h-4 shrink-0" />}
                    onClick={() => {
                      setViewInvoice(null)
                      openUnmarkPaid([viewInvoice.id])
                    }}
                  />
                )}
                <Button label="Close" variant="background" onClick={() => setViewInvoice(null)} />
              </footer>
            </motion.div>
          )
        })()}
      </Modal>

      {/* Analytics modal */}
      <Modal open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} variant="wide">
        <div className="p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
          <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.15 }}>
            Invoice analytics
          </Text>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card
              key="by-status"
              title="By status"
              subtitle="Invoice count by status"
              className="px-4 pb-4"
            >
              <div className="h-[260px] w-full">
                {loading ? (
                  <div className="h-full w-full flex flex-col justify-end gap-3 pb-8">
                    {[60, 80].map((pct, i) => (
                      <Skeleton key={i} height="h-6" className="max-w-full" style={{ width: `${pct}%` }} />
                    ))}
                  </div>
                ) : byStatusData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <Text variant="sm" className="opacity-70">
                      No invoices yet
                    </Text>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byStatusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="name" tick={tickProps} />
                      <YAxis tick={tickProps} allowDecimals={false} />
                      <Tooltip
                        formatter={(value: number | undefined) => [value ?? 0, 'Count']}
                        contentStyle={tooltipContentStyle}
                        cursor={tooltipCursor}
                      />
                      <Bar key="count" dataKey="count" radius={[4, 4, 0, 0]}>
                        {byStatusData.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
            <Card
              key="invoice-trend"
              title="Invoice trend"
              subtitle="Amount & count by month"
              className="px-4 pb-4"
            >
              <div className="h-[260px] w-full">
                {loading ? (
                  <div className="h-full w-full flex flex-col justify-end gap-3 pb-8">
                    {[50, 70, 60, 85].map((pct, i) => (
                      <Skeleton key={i} height="h-6" className="max-w-full" style={{ width: `${pct}%` }} />
                    ))}
                  </div>
                ) : trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <Text variant="sm" className="opacity-70">
                      No data yet
                    </Text>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="month" tick={tickProps} />
                      <YAxis tick={tickProps} allowDecimals={false} />
                      <Tooltip
                        formatter={(value: number | undefined, name?: string) =>
                          [name === 'Amount' ? formatCurrency(Number(value ?? 0), 'UGX') : (value ?? 0), name ?? '']
                        }
                        contentStyle={tooltipContentStyle}
                        cursor={tooltipCursor}
                      />
                      <Legend wrapperStyle={legendStyle} />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke={primaryColor}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Amount"
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={secondaryColor}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Count"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Modal>

      {/* Mark as paid confirm modal */}
      <Modal open={!!markPaidIds?.length} onClose={() => setMarkPaidIds(null)}>
        <div className="p-6">
          <Text className="font-semibold mb-2 block">Mark as paid</Text>
          <Text variant="sm" className="opacity-90 mb-6 block">
            {markPaidIds && markPaidIds.length === 1
              ? `Mark invoice ${invoices.find((i) => i.id === markPaidIds[0])?.number ?? ''} as paid?`
              : `Mark ${markPaidIds?.length ?? 0} invoices as paid?`}
          </Text>
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="background" onClick={() => setMarkPaidIds(null)} />
            <Button
              label="Mark as paid"
              startIcon={<CheckCircle className="w-4 h-4 shrink-0" />}
              onClick={handleMarkPaidConfirm}
              disabled={saving}
            />
          </div>
        </div>
      </Modal>

      {/* Unmark as paid confirm modal */}
      <Modal open={!!unmarkPaidIds?.length} onClose={() => setUnmarkPaidIds(null)}>
        <div className="p-6">
          <Text className="font-semibold mb-2 block">Unmark as paid</Text>
          <Text variant="sm" className="opacity-90 mb-6 block">
            {unmarkPaidIds && unmarkPaidIds.length === 1
              ? `Unmark invoice ${invoices.find((i) => i.id === unmarkPaidIds[0])?.number ?? ''}? It will be set back to Unpaid.`
              : `Unmark ${unmarkPaidIds?.length ?? 0} invoices? They will be set back to Unpaid.`}
          </Text>
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="background" onClick={() => setUnmarkPaidIds(null)} />
            <Button
              label="Unmark"
              startIcon={<Undo2 className="w-4 h-4 shrink-0" />}
              onClick={handleUnmarkPaidConfirm}
              disabled={saving}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default InvoicesPage
