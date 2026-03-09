import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
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
import Avatar from '../../components/base/Avatar'
import View from '../../components/base/View'
import { Card, Button, Skeleton, AddConsultantModal, Modal, CustomSelect, Badge } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { userService } from '../../services'
import type { User, UserRole, ConsultantDetailsSource, ConsultantProfile } from '../../types'
import { UserPlus, Users, UserCog, Briefcase, TrendingUp, Eye, Pencil, Trash2, CalendarOff, UserCheck, MapPin, Building2, Users as UsersIcon, DollarSign, FileText, Calendar, X, ListTodo, Receipt, ChevronLeft, ChevronRight, Search, SlidersHorizontal, BarChart3 } from 'lucide-react'

function isConsultantProfile(p: ConsultantDetailsSource): p is ConsultantProfile {
  return 'fullName' in p || 'jobTitle' in p || 'firstName' in p
}

function getDisplayName(p: ConsultantDetailsSource): string {
  if (isConsultantProfile(p)) {
    if (p.fullName) return p.fullName
    if (p.firstName || p.lastName) return [p.firstName, p.lastName].filter(Boolean).join(' ').trim()
  }
  return (p as User).name
}

function getAvatarUrl(p: ConsultantDetailsSource): string | undefined {
  if (isConsultantProfile(p) && p.profileImage) return p.profileImage
  return (p as User).avatarUrl
}

function getRoleDisplay(p: ConsultantDetailsSource): string {
  if (isConsultantProfile(p) && p.role && typeof p.role === 'object' && 'name' in p.role) return (p.role as { name: string }).name
  return roleLabel[(p as User).role]
}

function getStatusDisplay(p: ConsultantDetailsSource): string {
  const s = (p as ConsultantProfile).status ?? (p as User).status
  if (s === 'on_leave') return 'On leave'
  return s === 'inactive' ? 'Inactive' : 'Active'
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const chartTickStyle = { fontSize: 12 }
const legendStyle = { fontSize: 12 }

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

const roleLabel: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  company_admin: 'Company Admin',
  project_lead: 'Project Lead',
  consultant: 'Consultant',
}

const MANAGED_ROLES: UserRole[] = ['consultant', 'project_lead']

/** Full sample profiles for demo (Pexels images). Key = user id from userRepo. */
const FULL_PROFILE_SAMPLES: Record<string, ConsultantProfile> = {
  u2: {
    id: 'u2',
    fullName: 'Jane Lead',
    firstName: 'Jane',
    lastName: 'Lead',
    email: 'lead@acme.com',
    status: 'active',
    jobTitle: 'Senior Project Manager',
    bio: 'Leading delivery and teams for Acme since 2020.',
    profileImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
    phoneNumber: '+256 700 123 456',
    employeeId: 'EMP-2001',
    grossPay: '4500000.00',
    hourlyRate: '28125.00',
    currency: 'UGX',
    totalHoursPerMonth: 160,
    dateOfBirth: '1990-03-15',
    officeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    nextOfKin: { name: 'John Lead', phoneNumber: '256700654321', relationship: 'Spouse' },
    address: { street: 'Plot 12 Kololo', city: 'Kampala', state: 'Central', country: 'Uganda', postalCode: '256' },
    bankDetails: { bankName: 'Stanbic Bank', branch: 'Kampala Road', accountName: 'Jane Lead', accountNumber: '9030001234567' },
    attachments: [{ url: 'https://example.com/cv-jane.pdf', name: 'Jane Lead - CV.pdf' }],
    createdAt: '2024-01-10T09:00:00.000Z',
    updatedAt: '2025-02-01T14:30:00.000Z',
    role: { id: 'r1', name: 'Project Lead' },
    company: { id: 'c1', name: 'Acme Corp', sector: 'Technology' },
    department: { id: 'd1', name: 'Delivery', description: 'Project delivery' },
  },
  u3: {
    id: 'u3',
    fullName: 'Bob Consultant',
    firstName: 'Bob',
    lastName: 'Consultant',
    email: 'consultant@acme.com',
    status: 'active',
    jobTitle: 'Full Stack Developer',
    bio: 'Building web and mobile apps. React & Node enthusiast.',
    profileImage: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
    phoneNumber: '+256 782 147 143',
    employeeId: 'EMP-3002',
    grossPay: '2200000.00',
    hourlyRate: '13750.00',
    currency: 'UGX',
    totalHoursPerMonth: 160,
    dateOfBirth: '1995-08-22',
    officeDays: ['Mon', 'Wed', 'Fri'],
    nextOfKin: { name: 'Sarah Consultant', phoneNumber: '256774111222', relationship: 'Sister' },
    address: { street: 'Ntinda Road', city: 'Kampala', state: 'Central', country: 'Uganda', postalCode: '256' },
    bankDetails: { bankName: 'Centenary Bank', branch: 'Kampala', accountName: 'Bob Consultant', accountNumber: '3204885561' },
    attachments: [{ url: 'https://example.com/bob-id.pdf', name: 'Bob - National ID.pdf' }],
    createdAt: '2024-06-01T08:00:00.000Z',
    updatedAt: '2025-01-15T11:00:00.000Z',
    role: { id: 'r2', name: 'Consultant' },
    company: { id: 'c1', name: 'Acme Corp', sector: 'Technology' },
    department: { id: 'd2', name: 'Engineering', description: 'Software development' },
  },
  u4: {
    id: 'u4',
    fullName: 'Alice Dev',
    firstName: 'Alice',
    lastName: 'Dev',
    email: 'alice@acme.com',
    status: 'active',
    jobTitle: 'Frontend Developer',
    bio: 'Focused on UI/UX and accessibility.',
    profileImage: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=200',
    phoneNumber: '+256 755 987 654',
    employeeId: 'EMP-4003',
    grossPay: '1800000.00',
    hourlyRate: '11250.00',
    currency: 'UGX',
    totalHoursPerMonth: 160,
    dateOfBirth: '1998-11-05',
    officeDays: ['Tue', 'Wed', 'Thu'],
    nextOfKin: { name: 'James Dev', phoneNumber: '256700333444', relationship: 'Brother' },
    address: { street: 'Garden City', city: 'Kampala', state: 'Central', country: 'Uganda', postalCode: '256' },
    bankDetails: { bankName: 'Equity Bank', branch: 'Oasis Mall', accountName: 'Alice Dev', accountNumber: '0123456789' },
    attachments: [],
    createdAt: '2024-09-01T10:00:00.000Z',
    updatedAt: '2025-02-10T09:00:00.000Z',
    role: { id: 'r2', name: 'Consultant' },
    company: { id: 'c1', name: 'Acme Corp', sector: 'Technology' },
    department: { id: 'd2', name: 'Engineering', description: 'Software development' },
  },
}

/** Sample hours logged for performance analytics (today, this week, this month). Key = user id. */
const HOURS_LOGGED_SAMPLES: Record<string, { today: number; week: number; month: number }> = {
  u2: { today: 6.5, week: 32, month: 128 },
  u3: { today: 8, week: 38, month: 142 },
  u4: { today: 4, week: 28, month: 120 },
}

function getHoursLogged(userId: string): { today: number; week: number; month: number } {
  return HOURS_LOGGED_SAMPLES[userId] ?? { today: 0, week: 0, month: 0 }
}

function getStatIcon(label: string) {
  const n = label.toLowerCase()
  if (n.includes('total') || n.includes('team')) return <Users />
  if (n.includes('lead')) return <UserCog />
  if (n.includes('consultant')) return <Briefcase />
  return <TrendingUp />
}

const ConsultantsPage = () => {
  const { user } = Authstore()
  const { current } = Themestore()
  const navigate = useNavigate()
  const [consultants, setConsultants] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [viewUser, setViewUser] = useState<ConsultantDetailsSource | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [leaveUser, setLeaveUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterRole, setFilterRole] = useState<UserRole | ''>('')
  const [filterStatus, setFilterStatus] = useState<'active' | 'on_leave' | ''>('')
  const [filterSort, setFilterSort] = useState<string>('name_asc')
  const [filterSidebarExiting, setFilterSidebarExiting] = useState(false)
  const [filterSidebarEntered, setFilterSidebarEntered] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [draftFilterRole, setDraftFilterRole] = useState<UserRole | ''>('')
  const [draftFilterStatus, setDraftFilterStatus] = useState<'active' | 'on_leave' | ''>('')
  const [draftFilterSort, setDraftFilterSort] = useState<string>('name_asc')
  const PAGE_SIZE = 10

  const ROLE_OPTIONS = [
    { value: '', label: 'All roles' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'project_lead', label: 'Project Lead' },
  ]
  const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'on_leave', label: 'On leave' },
  ]
  const SORT_OPTIONS = [
    { value: 'name_asc', label: 'Name A–Z' },
    { value: 'name_desc', label: 'Name Z–A' },
    { value: 'role', label: 'Role' },
    { value: 'status', label: 'Status' },
  ]
  const FILTER_SIDEBAR_DURATION_MS = 220

  const fetchConsultants = useCallback(() => {
    if (!user?.companyId) return
    setLoading(true)
    userService
      .getByCompany(user.companyId)
      .then((users) => {
        setConsultants(users.filter((u) => MANAGED_ROLES.includes(u.role)))
      })
      .finally(() => setLoading(false))
  }, [user?.companyId])

  useEffect(() => {
    fetchConsultants()
  }, [fetchConsultants])

  const searchLower = searchQuery.trim().toLowerCase()
  const filteredConsultants = consultants.filter((u) => {
    const matchSearch =
      !searchLower ||
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    const matchRole = !filterRole || u.role === filterRole
    const matchStatus =
      !filterStatus || (filterStatus === 'on_leave' ? u.status === 'on_leave' : u.status !== 'on_leave')
    return matchSearch && matchRole && matchStatus
  })
  const sortedConsultants = [...filteredConsultants].sort((a, b) => {
    if (filterSort === 'name_asc') return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    if (filterSort === 'name_desc') return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' })
    if (filterSort === 'role') return a.role.localeCompare(b.role) || a.name.localeCompare(b.name)
    if (filterSort === 'status') {
      const sa = a.status === 'on_leave' ? 1 : 0
      const sb = b.status === 'on_leave' ? 1 : 0
      return sa - sb || a.name.localeCompare(b.name)
    }
    return 0
  })
  const totalConsultants = sortedConsultants.length
  const totalPages = Math.max(1, Math.ceil(totalConsultants / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const paginatedConsultants = sortedConsultants.slice(start, start + PAGE_SIZE)

  useEffect(() => {
    if (safePage !== page) setPage(safePage)
  }, [safePage, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, filterRole, filterStatus, filterSort])

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
    if (filterOpen) {
      setDraftFilterRole(filterRole)
      setDraftFilterStatus(filterStatus)
      setDraftFilterSort(filterSort)
    }
  }, [filterOpen, filterRole, filterStatus, filterSort])

  const closeFilterSidebar = useCallback(() => {
    setFilterSidebarExiting(true)
    const t = setTimeout(() => {
      setFilterOpen(false)
      setFilterSidebarExiting(false)
    }, FILTER_SIDEBAR_DURATION_MS)
    return () => clearTimeout(t)
  }, [])

  const handleCloseAddOrEdit = () => {
    setAddModalOpen(false)
    setEditUser(null)
  }

  const handleDeleteConfirm = () => {
    if (!deleteUser) return
    setSaving(true)
    userService
      .delete(deleteUser.id)
      .then(() => {
        setDeleteUser(null)
        fetchConsultants()
      })
      .finally(() => setSaving(false))
  }

  const handleLeaveConfirm = () => {
    if (!leaveUser) return
    const nextStatus = leaveUser.status === 'on_leave' ? 'active' : 'on_leave'
    setSaving(true)
    userService
      .update(leaveUser.id, { status: nextStatus })
      .then(() => {
        setLeaveUser(null)
        fetchConsultants()
      })
      .finally(() => setSaving(false))
  }

  const total = consultants.length
  const projectLeads = consultants.filter((u) => u.role === 'project_lead').length
  const consultantCount = consultants.filter((u) => u.role === 'consultant').length

  const statCards = [
    { label: 'Total team', value: total, caption: 'Consultants & leads' },
    { label: 'Project leads', value: projectLeads, caption: 'Can manage projects' },
    { label: 'Consultants', value: consultantCount, caption: 'Team members' },
    { label: 'Active', value: total, caption: 'Currently in company' },
  ]

  const byRoleData = [
    { name: 'Consultant', count: consultantCount },
    { name: 'Project Lead', count: projectLeads },
  ].filter((d) => d.count > 0)

  const trendData = [
    { week: 'W1', headcount: Math.max(1, total - 2), joined: 0 },
    { week: 'W2', headcount: Math.max(1, total - 1), joined: 1 },
    { week: 'W3', headcount: total, joined: 0 },
    { week: 'W4', headcount: total, joined: 0 },
  ]

  const dark = current?.system?.dark
  const mode = Themestore((s) => s.mode)
  const chartPrimary = mode === 'dark' ? (dark ?? '#e0e0e0') : (current?.brand?.primary ?? '#682308')
  const secondaryColor = current?.brand?.secondary ?? '#FF9600'
  const chartColors = getChartColors(chartPrimary, secondaryColor, Math.max(byRoleData.length, 2))
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
            <Text className="font-medium">Consultants</Text>
            <Text variant="sm" className="opacity-80">
              Manage your team members and project leads
            </Text>
          </div>
          <div className="flex items-center gap-2 flex-nowrap">
            <Button
              size="sm"
              label="Create consultant"
              startIcon={<UserPlus className="w-4 h-4 shrink-0" />}
              onClick={() => setAddModalOpen(true)}
            />
            <Button
              variant="secondaryBrand"
              size="sm"
              label="View analytics"
              startIcon={<BarChart3 className="w-4 h-4 shrink-0" />}
              onClick={() => setAnalyticsOpen(true)}
              disabled={loading || consultants.length === 0}
            />
          </div>
        </div>
        <AddConsultantModal
          open={addModalOpen || !!editUser}
          onClose={handleCloseAddOrEdit}
          onSuccess={(createdOrUpdated) => {
            fetchConsultants()
            handleCloseAddOrEdit()
            if (createdOrUpdated && !editUser) {
              setViewUser(createdOrUpdated)
            }
          }}
          editUser={editUser}
        />
      </View>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="min-h-[7rem] py-4 px-4">
                <Skeleton height="h-4" width="w-24" className="mb-2" />
                <Skeleton height="h-4" width="w-16" className="mb-1" />
                <Skeleton height="h-8" width="w-12" />
              </Card>
            ))}
          </>
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
        <Card
          key="by-role"
          title="By role"
          subtitle="Headcount per role"
          className="px-4 pb-4"
        >
          <div className="h-[280px] w-full">
            {loading ? (
              <div className="h-full w-full flex flex-col justify-end gap-3 pb-8">
                {[60, 80].map((pct, i) => (
                  <Skeleton key={i} height="h-6" className="max-w-full" style={{ width: `${pct}%` }} />
                ))}
              </div>
            ) : byRoleData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Text variant="sm" className="opacity-70">
                  No consultants yet
                </Text>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byRoleData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={tickProps} />
                  <YAxis tick={tickProps} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number | undefined) => [value ?? 0, 'Count']}
                    contentStyle={tooltipContentStyle}
                    cursor={tooltipCursor}
                  />
                  <Bar key="count" dataKey="count" radius={[4, 4, 0, 0]}>
                    {byRoleData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card
          key="team-trend"
          title="Team trend"
          subtitle="Headcount over recent weeks"
          className="px-4 pb-4"
        >
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
                  <Legend wrapperStyle={legendStyle} />
                  <Line
                    type="monotone"
                    dataKey="headcount"
                    stroke={chartPrimary}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Headcount"
                  />
                  <Line
                    type="monotone"
                    dataKey="joined"
                    stroke={secondaryColor}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Joined"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card
        title="Consultants"
        subtitle="All team members"
        className="p-0 overflow-hidden"
        titleSuffix={
          <div
            className="flex items-center flex-1 min-w-0 max-w-md justify-end rounded-base overflow-hidden"
            style={{
              border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.12)'}`,
            }}
          >
            <div className="flex-1 min-w-0 relative flex items-center">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 pointer-events-none shrink-0"
                style={{ color: current?.system?.dark }}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full py-2 pl-9 pr-3 bg-transparent focus:outline-none focus:ring-0 border-0 placeholder:opacity-60"
                style={{
                  fontSize: baseFontSize,
                  lineHeight: 1.5,
                  color: current?.system?.dark,
                }}
                aria-label="Search consultants"
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="shrink-0 p-2.5 transition-opacity hover:opacity-100 opacity-90 focus:outline-none focus:ring-0"
              style={{
                color: current?.system?.dark,
                backgroundColor: filterOpen ? current?.system?.background : 'transparent',
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
                <Skeleton height="h-10" width="w-10" rounded="full" />
                <div className="flex-1 space-y-1">
                  <Skeleton height="h-4" width="w-32" />
                  <Skeleton height="h-3" width="w-48" />
                </div>
                <Skeleton height="h-6" width="w-20" />
              </div>
            ))}
          </div>
        ) : filteredConsultants.length === 0 ? (
          <div className="p-8 text-center">
            <Text variant="sm" className="opacity-80">
              {consultants.length === 0
                ? 'No consultants yet. Add team members to get started.'
                : 'No consultants match your search or filters.'}
            </Text>
          </div>
        ) : (
          <div className="overflow-x-auto scroll-slim">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}` }}>
                  <th className="text-left px-4 py-3">
                    <Text variant="sm" className="font-medium">Name</Text>
                  </th>
                  <th className="text-left px-4 py-3">
                    <Text variant="sm" className="font-medium">Email</Text>
                  </th>
                  <th className="text-left px-4 py-3">
                    <Text variant="sm" className="font-medium">Role</Text>
                  </th>
                  <th className="text-right px-4 py-3 w-[1%] whitespace-nowrap">
                    <Text variant="sm" className="font-medium">Actions</Text>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedConsultants.map((u, index) => (
                  <tr
                    key={u.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? current?.system?.foreground : current?.system?.background,
                      ...(mode === 'dark' && { borderBottom: `1px solid ${current?.system?.border ?? 'rgba(255,255,255,0.08)'}` }),
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" src={FULL_PROFILE_SAMPLES[u.id]?.profileImage ?? u.avatarUrl} />
                        <Text className="font-medium">{u.name}</Text>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Text variant="sm" className="opacity-80">
                        {u.email}
                      </Text>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={u.role === 'project_lead' ? 'success' : 'default'}>
                          {roleLabel[u.role]}
                        </Badge>
                        {u.status === 'on_leave' && (
                          <Badge variant="warning">On leave</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewUser(u)}
                          className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
                          style={{ color: current?.system?.dark }}
                          title="View"
                          aria-label="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditUser(u)}
                          className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
                          style={{ color: current?.system?.dark }}
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeaveUser(u)}
                          className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
                          style={{ color: current?.system?.dark }}
                          title={u.status === 'on_leave' ? 'Reactivate' : 'Put on leave'}
                          aria-label={u.status === 'on_leave' ? 'Reactivate' : 'Put on leave'}
                        >
                          {u.status === 'on_leave' ? <UserCheck className="w-4 h-4" /> : <CalendarOff className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteUser(u)}
                          className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
                          style={{ color: current?.system?.error ?? '#b91c1c' }}
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalConsultants > 0 && (
              <div
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t"
                style={{ borderColor: current?.system?.border ?? 'rgba(0,0,0,0.08)' }}
              >
                <Text variant="sm" style={{ color: current?.system?.dark }}>
                  Showing {start + 1}–{Math.min(start + PAGE_SIZE, totalConsultants)} of {totalConsultants}
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

      {/* Filter right sidebar */}
      {(filterOpen || filterSidebarExiting) && (
        <>
          <div
            role="presentation"
            className="fixed inset-0 z-40 transition-opacity ease-out"
            style={{
              backgroundColor: 'rgba(0,0,0,0.35)',
              opacity: filterSidebarEntered && !filterSidebarExiting ? 1 : 0,
              transitionDuration: `${FILTER_SIDEBAR_DURATION_MS}ms`,
            }}
            onClick={closeFilterSidebar}
            aria-hidden
          />
          <aside
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col shadow-lg transition-transform ease-out"
            style={{
              backgroundColor: current?.system?.foreground ?? '#fff',
              borderLeft: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
              transform: filterSidebarEntered && !filterSidebarExiting ? 'translateX(0)' : 'translateX(100%)',
              transitionDuration: `${FILTER_SIDEBAR_DURATION_MS}ms`,
            }}
            aria-label="Filter consultants"
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
                label="Role"
                options={ROLE_OPTIONS}
                value={draftFilterRole}
                onChange={(v) => setDraftFilterRole((v || '') as UserRole | '')}
                placeholder="All roles"
                aria-label="Filter by role"
                placement="below"
              />
              <CustomSelect
                label="Status"
                options={STATUS_OPTIONS}
                value={draftFilterStatus}
                onChange={(v) => setDraftFilterStatus((v || '') as 'active' | 'on_leave' | '')}
                placeholder="All statuses"
                aria-label="Filter by status"
                placement="below"
              />
              <CustomSelect
                label="Sort by"
                options={SORT_OPTIONS}
                value={draftFilterSort}
                onChange={(v) => setDraftFilterSort(v || 'name_asc')}
                placeholder="Sort by"
                aria-label="Sort consultants"
                placement="below"
              />
              <Button
                size="sm"
                label="Apply filters"
                onClick={() => {
                  setFilterRole(draftFilterRole)
                  setFilterStatus(draftFilterStatus)
                  setFilterSort(draftFilterSort || 'name_asc')
                  closeFilterSidebar()
                }}
              />
              <Button
                size="sm"
                label="Reset filters"
                onClick={() => {
                  setDraftFilterRole('')
                  setDraftFilterStatus('')
                  setDraftFilterSort('name_asc')
                  setFilterRole('')
                  setFilterStatus('')
                  setFilterSort('name_asc')
                }}
                disabled={!filterRole && !filterStatus && filterSort === 'name_asc'}
              />
            </div>
          </aside>
        </>
      )}

      {/* Profile / details modal — organized sections, all fields */}
      <Modal open={!!viewUser} onClose={() => setViewUser(null)}>
        {viewUser && (() => {
          const p: ConsultantDetailsSource = FULL_PROFILE_SAMPLES[viewUser.id] ?? viewUser
          const isFull = isConsultantProfile(p)
          const bg = current?.system?.background
          const fg = current?.system?.foreground
          const dark = current?.system?.dark
          const primary = current?.brand?.primary

          const Section = ({ title, icon: Icon, children }: { title: string; icon: ComponentType<{ className?: string }>; children: ReactNode }) => (
            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-70" style={{ color: dark }}>
                <Icon className="w-3.5 h-3.5 shrink-0" /> {title}
              </h3>
              <div className="rounded-base overflow-hidden" style={{ backgroundColor: bg }}>
                {children}
              </div>
            </section>
          )

          const Row = ({ label, value, href }: { label: string; value: ReactNode; href?: string }) => (
            <div className="flex justify-between gap-4 py-2.5 px-4 border-b last:border-b-0" style={{ borderColor: current?.system?.border ?? 'rgba(0,0,0,0.06)' }}>
              <Text variant="sm" className="opacity-70 shrink-0" style={{ color: dark }}>{label}</Text>
              {href ? (
                <a href={href} className="text-sm font-medium truncate text-right hover:opacity-80 min-w-0" style={{ color: primary || dark }}>{value}</a>
              ) : (
                <Text className="text-sm font-medium truncate text-right min-w-0" style={{ color: dark }}>{value ?? '—'}</Text>
              )}
            </div>
          )

          const dept = isFull && p.department && typeof p.department === 'object' ? (p.department as { name?: string }).name : null
          const company = isFull && p.company && typeof p.company === 'object' ? (p.company as { name?: string }).name : null

          return (
            <div className="min-w-0 max-w-lg max-h-[90vh] flex flex-col">
              {/* Hero — image and content on same row, border-b, same typography */}
              <div
                className="relative pt-8 pb-8 px-6 shrink-0 rounded-t-base border-b"
                style={{ backgroundColor: fg ?? bg, borderColor: current?.system?.border ?? 'rgba(0,0,0,0.06)' }}
              >
                <button
                  type="button"
                  onClick={() => setViewUser(null)}
                  className="absolute top-4 right-4 p-2 rounded-base hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-black/10"
                  style={{ color: dark }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex flex-row items-center gap-6 text-left">
                  <div className="shrink-0">
                    <Avatar name={getDisplayName(p)} size="xl" src={getAvatarUrl(p)} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-base font-normal m-0" style={{ color: dark, lineHeight: 1.4 }}>{getDisplayName(p)}</p>
                    <div className="space-y-0.5 m-0">
                      <Text variant="sm" className="m-0">
                        <a href={`mailto:${p.email}`} className="hover:opacity-100 transition-opacity no-underline" style={{ color: dark, opacity: 0.9 }}>{p.email}</a>
                      </Text>
                      {isFull && p.phoneNumber && (
                        <Text variant="sm" className="m-0">
                          <a href={`tel:${p.phoneNumber}`} className="hover:opacity-100 transition-opacity no-underline" style={{ color: dark, opacity: 0.9 }}>{p.phoneNumber}</a>
                        </Text>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-normal"
                        style={{
                          backgroundColor: (p as unknown as User).status === 'on_leave' || (p as ConsultantProfile).status === 'inactive'
                            ? 'rgba(0,0,0,0.05)'
                            : (current?.system?.success && /^#[0-9A-Fa-f]{6}$/.test(current.system.success)
                              ? `${current.system.success}12`
                              : 'rgba(34, 197, 94, 0.1)'),
                          color: (p as unknown as User).status === 'on_leave' || (p as ConsultantProfile).status === 'inactive' ? dark : (current?.system?.success ?? dark),
                        }}
                      >
                        {getStatusDisplay(p)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pt-8 pb-6 overflow-y-auto scroll-slim flex-1 min-h-0 space-y-5">
                {/* Performance analytics — hours logged */}
                <Section title="Performance" icon={TrendingUp}>
                  {(() => {
                    const hours = getHoursLogged(p.id)
                    return (
                      <>
                        <Row label="Hours logged today" value={hours.today > 0 ? `${hours.today} h` : '—'} />
                        <Row label="Hours logged this week" value={hours.week > 0 ? `${hours.week} h` : '—'} />
                        <Row label="Hours logged this month" value={hours.month > 0 ? `${hours.month} h` : '—'} />
                      </>
                    )
                  })()}
                </Section>

                {/* 1. Personal */}
                <Section title="Personal" icon={UserCog}>
                  {isFull && (p.firstName || p.lastName) && <Row label="First name" value={p.firstName} />}
                  {isFull && (p.firstName || p.lastName) && <Row label="Last name" value={p.lastName} />}
                  <Row label="Date of birth" value={isFull && p.dateOfBirth ? formatDate(p.dateOfBirth) : undefined} />
                  <Row label="Bio" value={isFull && p.bio ? p.bio : undefined} />
                </Section>

                {/* 3. Role & employment */}
                <Section title="Role & employment" icon={Briefcase}>
                  <Row label="Role" value={getRoleDisplay(p)} />
                  <Row label="Status" value={getStatusDisplay(p)} />
                  <Row label="Job title" value={isFull ? (p.jobTitle ?? undefined) : undefined} />
                  <Row label="Employee ID" value={isFull ? (p.employeeId ?? undefined) : undefined} />
                  <Row label="Department" value={dept ?? undefined} />
                  <Row label="Company" value={company ?? undefined} />
                  <Row label="Office days" value={isFull && p.officeDays?.length ? p.officeDays.join(', ') : undefined} />
                </Section>

                {/* 4. Compensation */}
                <Section title="Compensation" icon={DollarSign}>
                  <Row label="Currency" value={isFull ? (p.currency ?? undefined) : undefined} />
                  <Row label="Gross pay" value={isFull && p.grossPay != null ? `${p.currency ?? ''} ${p.grossPay}`.trim() : undefined} />
                  <Row label="Hourly rate" value={isFull && p.hourlyRate != null ? `${p.currency ?? ''} ${p.hourlyRate}`.trim() : undefined} />
                  <Row label="Hours per month" value={isFull && p.totalHoursPerMonth != null ? String(p.totalHoursPerMonth) : undefined} />
                </Section>

                {/* 5. Address */}
                <Section title="Address" icon={MapPin}>
                  <Row label="Street" value={isFull && p.address?.street} />
                  <Row label="City" value={isFull && p.address?.city} />
                  <Row label="State / region" value={isFull && p.address?.state} />
                  <Row label="Country" value={isFull && p.address?.country} />
                  <Row label="Postal code" value={isFull && p.address?.postalCode} />
                </Section>

                {/* 6. Next of kin */}
                <Section title="Next of kin" icon={UsersIcon}>
                  <Row label="Name" value={isFull && p.nextOfKin?.name} />
                  <Row label="Relationship" value={isFull && p.nextOfKin?.relationship} />
                  <Row label="Phone" value={isFull && p.nextOfKin?.phoneNumber} href={isFull && p.nextOfKin?.phoneNumber ? `tel:${p.nextOfKin.phoneNumber}` : undefined} />
                </Section>

                {/* 7. Bank details */}
                <Section title="Bank details" icon={Building2}>
                  <Row label="Bank name" value={isFull && p.bankDetails?.bankName} />
                  <Row label="Branch" value={isFull && p.bankDetails?.branch} />
                  <Row label="Account name" value={isFull && p.bankDetails?.accountName} />
                  <Row label="Account number" value={isFull && p.bankDetails?.accountNumber ? `•••• ${String(p.bankDetails.accountNumber).slice(-4)}` : undefined} />
                </Section>

                {/* 8. Attachments */}
                {isFull && p.attachments && p.attachments.length > 0 && (
                  <Section title="Attachments" icon={FileText}>
                    {p.attachments.map((att, i) => (
                      <div key={i} className="py-2.5 px-4 border-b last:border-b-0" style={{ borderColor: current?.system?.border ?? 'rgba(0,0,0,0.06)' }}>
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate block hover:opacity-80" style={{ color: primary || dark }}>
                          {att.name || 'Document'}
                        </a>
                      </div>
                    ))}
                  </Section>
                )}

                {/* 9. Record */}
                {(isFull && (p.createdAt || p.updatedAt)) && (
                  <Section title="Record" icon={Calendar}>
                    {p.createdAt && <Row label="Added" value={formatDate(p.createdAt)} />}
                    {p.updatedAt && <Row label="Updated" value={formatDate(p.updatedAt)} />}
                  </Section>
                )}
              </div>

              {/* Footer actions — theme background from Themestore */}
              <footer
                className="shrink-0 flex flex-row gap-3 py-4 px-6 rounded-b-base border-t"
                style={{
                  backgroundColor: current?.system?.foreground ?? undefined,
                  borderColor: current?.system?.border ?? 'rgba(0,0,0,0.08)',
                }}
              >
                <button
                  type="button"
                  className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-base px-4 py-2.5 text-sm font-normal transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: current?.system?.background ?? 'rgba(0,0,0,0.06)',
                    color: current?.brand?.primary || current?.system?.dark,
                  }}
                  onClick={() => {
                    setViewUser(null)
                    navigate(`/app/tasks?ownerId=${p.id}`)
                  }}
                >
                  <ListTodo className="w-4 h-4 shrink-0" />
                  View tasks
                </button>
                <button
                  type="button"
                  className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-base px-4 py-2.5 text-sm font-normal transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: current?.system?.background ?? 'rgba(0,0,0,0.06)',
                    color: current?.brand?.primary || current?.system?.dark,
                  }}
                  onClick={() => {
                    setViewUser(null)
                    navigate(`/app/reports?userId=${p.id}`)
                  }}
                >
                  <Receipt className="w-4 h-4 shrink-0" />
                  View invoice
                </button>
              </footer>
            </div>
          )
        })()}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteUser} onClose={() => setDeleteUser(null)}>
        <div className="p-6">
          <Text className="font-semibold mb-2 block" style={{ color: current?.system?.error }}>Delete consultant</Text>
          <Text variant="sm" className="opacity-90 mb-6 block">
            {deleteUser ? `Are you sure you want to delete ${deleteUser.name}? This cannot be undone.` : ''}
          </Text>
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="background" onClick={() => setDeleteUser(null)} />
            <Button variant="danger" label="Delete" onClick={handleDeleteConfirm} disabled={saving} />
          </div>
        </div>
      </Modal>

      {/* Put on leave / reactivate modal */}
      <Modal open={!!leaveUser} onClose={() => setLeaveUser(null)}>
        <div className="p-6">
          <Text className="font-semibold mb-2 block">
            {leaveUser?.status === 'on_leave' ? 'Reactivate consultant' : 'Put on leave'}
          </Text>
          <Text variant="sm" className="opacity-90 mb-6 block">
            {leaveUser && (
              leaveUser.status === 'on_leave'
                ? `Reactivate ${leaveUser.name}? They will appear as active again.`
                : `Put ${leaveUser.name} on leave? They will be marked as on leave and can be reactivated later.`
            )}
          </Text>
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="background" onClick={() => setLeaveUser(null)} />
            <Button label={leaveUser?.status === 'on_leave' ? 'Reactivate' : 'Put on leave'} onClick={handleLeaveConfirm} disabled={saving} />
          </div>
        </div>
      </Modal>

      {/* Analytics modal */}
      <Modal open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} variant="wide">
        <div className="p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
          <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.15 }}>
            Team analytics
          </Text>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card
              key="by-role"
              title="By role"
              subtitle="Headcount per role"
              className="px-4 pb-4"
            >
              <div className="h-[260px] w-full">
                {loading ? (
                  <div className="h-full w-full flex flex-col justify-end gap-3 pb-8">
                    {[60, 80].map((pct, i) => (
                      <Skeleton key={i} height="h-6" className="max-w-full" style={{ width: `${pct}%` }} />
                    ))}
                  </div>
                ) : byRoleData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <Text variant="sm" className="opacity-70">
                      No consultants yet
                    </Text>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byRoleData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="name" tick={tickProps} />
                      <YAxis tick={tickProps} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number | undefined) => [value ?? 0, 'Count']}
                    contentStyle={tooltipContentStyle}
                    cursor={tooltipCursor}
                  />
                      <Bar key="count" dataKey="count" radius={[4, 4, 0, 0]}>
                        {byRoleData.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
            <Card
              key="team-trend"
              title="Team trend"
              subtitle="Headcount over recent weeks"
              className="px-4 pb-4"
            >
              <div className="h-[260px] w-full">
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
                      <Legend wrapperStyle={legendStyle} />
                      <Line
                        type="monotone"
                        dataKey="headcount"
                        stroke={chartPrimary}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Headcount"
                      />
                      <Line
                        type="monotone"
                        dataKey="joined"
                        stroke={secondaryColor}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Joined"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ConsultantsPage
