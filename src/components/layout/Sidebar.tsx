import { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import View from '../base/View'
import Text from '../base/Text'
import Logo, { LOGIN_LOGO_URL } from '../base/Logo'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { APP_ICON_SIZE, getMutedIconColor } from '../base/iconTokens'
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
  '/app/marketplace',
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
      return ALL_NAV
        .map((item) =>
          item.to === '/app/marketplace' ? { ...item, label: 'Job board', icon: Sparkles } : item
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

  const isDark = Themestore((s) => s.mode) === 'dark'
  const text = current?.system?.dark ?? '#111827'
  const muted = getMutedIconColor(isDark ? 'dark' : 'light')
  // const activeBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.035)'
  const activeBg = current?.system?.background
  const hoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.028)'

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
        <div className="px-5 pt-4 pb-4 flex items-center shrink-0">
          <Logo size="md" src={LOGIN_LOGO_URL} />
        </div>
        <nav className="flex-1 overflow-y-auto scroll-slim pl-2 pb-6 flex flex-col gap-2" aria-label="Main navigation">
          {nav.map((item) => {
            if (item.to !== '/app/settings') {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app'}
                  className={() =>
                    `flex items-center gap-3 px-4 py-2 rounded-base text-left transition-colors duration-150 hover:bg-[rgba(0,0,0,0.028)]`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? activeBg : 'transparent',
                    color: isActive ? text : text,
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <span className="shrink-0" aria-hidden style={{ color: isActive ? current?.brand?.primary ?? text : muted }}>
                        <Icon size={APP_ICON_SIZE} />
                      </span>
                      <Text variant="md" className={`tracking-tight ${isActive ? 'font-medium' : 'font-normal'}`}>
                        {item.label}
                      </Text>
                      <span className="flex-1" />
                    </>
                  )}
                </NavLink>
              )
            }
            const Icon = item.icon
            return (
              <div key={item.to} className="pt-0.5 pb-0.5">
                <NavLink
                  to="/app/settings"
                  end={false}
                  className={() =>
                    `flex items-center gap-3 px-4 py-2 rounded-base text-left transition-colors duration-150 hover:bg-[rgba(0,0,0,0.028)]`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? activeBg : 'transparent',
                    color: isActive ? text : text,
                  })}
                >
                  {({ isActive }) => {
                    return (
                      <>
                        <span className="shrink-0" aria-hidden style={{ color: isActive ? current?.brand?.primary ?? text : muted }}>
                          <Icon size={APP_ICON_SIZE} />
                        </span>
                        <Text variant="md" className={`tracking-tight ${isActive ? 'font-medium' : 'font-normal'}`}>
                          {item.label}
                        </Text>
                        <span className="flex-1" />
                      </>
                    )
                  }}
                </NavLink>
                {isSettingsPage && settingsChildren.length > 0 && (
                  <ul className="mt-1 ml-5 pl-6 space-y-1" aria-label="Settings sections">
                    {settingsChildren.map((child) => {
                      const to = `/app/settings?section=${child.id}`
                      const isChildActive =
                        location.pathname === '/app/settings' &&
                        (location.search === `?section=${child.id}` || (child.id === 'appearance' && !location.search))
                      return (
                        <li key={child.id}>
                          <NavLink
                            to={to}
                            className="flex items-center py-2 pl-3 pr-3 rounded-base text-left transition-colors duration-150 border-l-2"
                            style={{
                              borderLeftColor: isChildActive ? (current?.brand?.primary ?? 'transparent') : 'transparent',
                              color: isChildActive ? (current?.brand?.primary ?? current?.system?.dark) : current?.system?.dark,
                              // fontWeight: isChildActive ? 600 : 500,
                              backgroundColor: isChildActive ? hoverBg : 'transparent',
                              opacity: isChildActive ? 1 : 0.75,
                            }}
                          >
                            <Text variant="sm" className={isChildActive ? 'font-medium' : 'font-normal'}>
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
