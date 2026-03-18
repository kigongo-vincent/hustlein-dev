import { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import View from '../base/View'
import Text from '../base/Text'
import Logo, { LOGIN_LOGO_URL } from '../base/Logo'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Flag,
  Calendar,
  BarChart3,
  Users,
  Receipt,
  Settings,
  StickyNote,
  Building2,
  BriefcaseBusiness,
  Sparkles,
  Inbox,
  Handshake,
  Activity,
} from 'lucide-react'

type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

function getIconTint(to: string, accent?: { blue: string; purple: string; pink: string; green: string; yellow: string; teal: string }, fallback?: string) {
  const a = accent
  const map: Record<string, string | undefined> = {
    '/app': a?.purple,
    '/app/marketplace': a?.blue,
    '/app/applications': a?.pink,
    '/app/contracts': a?.teal,
    '/app/analytics': a?.yellow,
    '/app/projects': a?.purple,
    '/app/assigned': a?.blue,
    '/app/tasks': a?.green,
    '/app/milestones': a?.yellow,
    '/app/calendar': a?.teal,
    '/app/notes': a?.pink,
    '/app/reports': a?.purple,
    '/app/invoices': a?.yellow,
    '/app/consultants': a?.blue,
    '/app/departments': a?.teal,
    '/app/settings': a?.green,
  }
  return map[to] ?? fallback ?? '#FF9600'
}

function IconChip({
  Icon,
  isActive,
  tint,
}: {
  Icon: React.ComponentType<{ size?: number }>
  isActive: boolean
  tint: string
}) {
  const bg = isActive ? `linear-gradient(135deg, ${tint} 0%, ${tint}CC 100%)` : `${tint}18`
  const color = isActive ? '#fff' : tint
  return (
    <span
      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
      style={{
        background: bg,
        boxShadow: isActive ? '0 10px 24px rgba(0,0,0,0.16)' : 'none',
        color,
      }}
      aria-hidden
    >
      <Icon size={18} />
    </span>
  )
}

type SettingsSectionId = 'general' | 'appearance' | 'account'

const SETTINGS_CHILDREN: { id: SettingsSectionId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'account', label: 'Account' },
]

const ALL_NAV: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/consultants', label: 'Consultants', icon: Users },
  { to: '/app/invoices', label: 'Invoices', icon: Receipt },
  { to: '/app/departments', label: 'Departments', icon: Building2 },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/marketplace', label: 'Marketplace', icon: Sparkles },
  { to: '/app/applications', label: 'Applications', icon: Inbox },
  { to: '/app/contracts', label: 'Contracts', icon: Handshake },
  { to: '/app/analytics', label: 'Analytics', icon: Activity },
  { to: '/app/notes', label: 'Notes', icon: StickyNote },
  { to: '/app/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/app/milestones', label: 'Milestones', icon: Flag },
  { to: '/app/calendar', label: 'Calendar', icon: Calendar },
  { to: '/app/reports', label: 'Reports', icon: BarChart3 },
  { to: '/app/assigned', label: 'Projects', icon: BriefcaseBusiness },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

const HIDDEN_FOR_COMPANY_ADMIN = new Set([
  '/app/tasks',
  '/app/milestones',
  '/app/reports',
  '/app/focus',
  '/app/dashboard',
  '/app/applications',
  '/app/contracts',
  '/app/analytics',
])
const CONSULTANT_ROUTES = new Set([
  '/app',
  '/app/notes',
  '/app/tasks',
  '/app/calendar',
  '/app/settings',
  '/app/assigned',
])
const FREELANCER_ROUTES = new Set([
  '/app',
  '/app/applications',
  '/app/contracts',
  '/app/analytics',
  '/app/notes',
  '/app/tasks',
  '/app/calendar',
  '/app/settings',
  '/app/assigned',
])
const PROJECT_LEAD_ROUTES = new Set([
  '/app',
  '/app/projects',
  '/app/assigned',
  '/app/tasks',
  '/app/milestones',
  '/app/notes',
  '/app/calendar',
  '/app/reports',
  '/app/settings',
])

const SIDEBAR_WIDTH = 240

type SidebarProps = {
  open: boolean
}

const Sidebar = ({ open }: SidebarProps) => {
  const { current } = Themestore()
  const user = Authstore((s) => s.user)
  const location = useLocation()
  const isSettingsPage = location.pathname === '/app/settings'

  const nav = useMemo(() => {
    if (user?.role === 'consultant') {
      return ALL_NAV.filter((item) => CONSULTANT_ROUTES.has(item.to))
    }
    if (user?.role === 'freelancer') {
      // Freelancer UX: treat /app as Job board.
      return ALL_NAV
        .map((item) =>
          item.to === '/app' ? { ...item, label: 'Job board', icon: Sparkles } : item
        )
        .filter((item) => FREELANCER_ROUTES.has(item.to))
    }
    if (user?.role === 'project_lead') {
      return ALL_NAV.filter((item) => PROJECT_LEAD_ROUTES.has(item.to))
    }
    if (user?.role === 'company_admin' || user?.role === 'super_admin') {
      return ALL_NAV.filter((item) => !HIDDEN_FOR_COMPANY_ADMIN.has(item.to))
    }
    return ALL_NAV
  }, [user?.role])

  const settingsChildren = useMemo(() => {
    const isCompanyAdmin = user?.role === 'company_admin' || user?.role === 'super_admin'
    return SETTINGS_CHILDREN.filter((s) => s.id !== 'general' || isCompanyAdmin)
  }, [user?.role])

  const linkStyle = (isActive: boolean) =>
    isActive
      ? {
          backgroundColor: current?.system?.background,
          color: current?.brand?.primary,
        }
      : { color: current?.system?.dark }

  return (
    <motion.div
      initial={false}
      animate={{ width: open ? SIDEBAR_WIDTH : 0 }}
      transition={{ type: 'tween', duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col shrink-0 overflow-hidden fixed inset-y-0 left-0 z-30 md:relative md:inset-auto"
      style={{ height: 'var(--app-viewport-height)' }}
    >
      <View
        bg="fg"
        className="h-full flex flex-col border-r min-w-0"
        style={{
          width: SIDEBAR_WIDTH,
          backgroundColor: current?.system?.foreground,
          borderColor: current?.system?.border ?? 'rgba(0,0,0,0.1)',
        }}
      >
        <div className="px-4 pt-5 pb-4 flex items-center shrink-0">
          <Logo size="md" src={LOGIN_LOGO_URL} />
        </div>
        <nav className="flex-1 overflow-y-auto scroll-slim px-3 pb-4 flex flex-col gap-0.5" aria-label="Main navigation">
          {nav.map((item) => {
            if (item.to !== '/app/settings') {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors duration-150 opacity-90 hover:opacity-100 ${isActive ? 'opacity-100 font-semibold' : ''}`
                  }
                  style={({ isActive }) => linkStyle(isActive)}
                >
                  {({ isActive }) => {
                    const tint = getIconTint(item.to, current?.accent, current?.brand?.secondary)
                    const Icon = item.icon
                    return (
                      <>
                        <IconChip Icon={Icon} isActive={isActive} tint={tint} />
                        <Text variant="sm" className="font-medium tracking-tight">
                          {item.label}
                        </Text>
                      </>
                    )
                  }}
                </NavLink>
              )
            }
            const Icon = item.icon
            return (
              <div key={item.to} className="pt-0.5 pb-0.5">
                <NavLink
                  to="/app/settings"
                  end={false}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 opacity-90 hover:opacity-100 ${isActive ? 'opacity-100 font-medium' : ''}`
                  }
                  style={({ isActive }) => linkStyle(isActive)}
                >
                  {({ isActive }) => {
                    const tint = getIconTint(item.to, current?.accent, current?.brand?.secondary)
                    return (
                      <>
                        <IconChip Icon={Icon} isActive={isActive} tint={tint} />
                        <Text variant="sm" className="font-medium tracking-tight">
                          {item.label}
                        </Text>
                      </>
                    )
                  }}
                </NavLink>
                {isSettingsPage && settingsChildren.length > 0 && (
                  <ul className="mt-0.5 ml-3 pl-4 space-y-0.5" aria-label="Settings sections">
                    {settingsChildren.map((child) => {
                      const to = `/app/settings?section=${child.id}`
                      const isChildActive =
                        location.pathname === '/app/settings' &&
                        (location.search === `?section=${child.id}` || (child.id === 'appearance' && !location.search))
                      return (
                        <li key={child.id}>
                          <NavLink
                            to={to}
                            className="flex items-center py-2 pl-3 pr-3 rounded-md text-left transition-colors duration-150 opacity-80 hover:opacity-100 border-l-2"
                            style={{
                              borderLeftColor: isChildActive ? (current?.brand?.primary ?? 'transparent') : 'transparent',
                              color: isChildActive ? (current?.brand?.primary ?? current?.system?.dark) : current?.system?.dark,
                              fontWeight: isChildActive ? 600 : 500,
                            }}
                          >
                            <Text variant="sm" style={{ fontSize: '0.8125rem' }}>
                              {child.label}
                            </Text>
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>
      </View>
    </motion.div>
  )
}

export default Sidebar
