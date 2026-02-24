import { useMemo } from 'react'
import { NavLink } from 'react-router'
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
  Target,
  Users,
  Receipt,
  Settings,
  StickyNote,
} from 'lucide-react'

const ALL_NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/consultants', label: 'Consultants', icon: Users },
  { to: '/app/invoices', label: 'Invoices', icon: Receipt },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/notes', label: 'Notes', icon: StickyNote },
  { to: '/app/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/app/milestones', label: 'Milestones', icon: Flag },
  { to: '/app/calendar', label: 'Calendar', icon: Calendar },
  { to: '/app/reports', label: 'Reports', icon: BarChart3 },
  { to: '/app/focus', label: 'Focus', icon: Target },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

const HIDDEN_FOR_COMPANY_ADMIN = new Set(['/app/tasks', '/app/milestones', '/app/reports', '/app/focus'])

const SIDEBAR_WIDTH = 224

type SidebarProps = {
  open: boolean
}

const Sidebar = ({ open }: SidebarProps) => {
  const { current } = Themestore()
  const user = Authstore((s) => s.user)
  const nav = useMemo(() => {
    if (user?.role === 'company_admin') {
      return ALL_NAV.filter((item) => !HIDDEN_FOR_COMPANY_ADMIN.has(item.to))
    }
    return ALL_NAV
  }, [user?.role])
  return (
    <motion.div
      initial={false}
      animate={{ width: open ? SIDEBAR_WIDTH : 0 }}
      transition={{ type: 'tween', duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col shrink-0 overflow-hidden"
      style={{ height: 'var(--app-viewport-height)' }}
    >
      <View
          bg="fg"
          className="w-56 h-full flex flex-col border-r border-black/10 min-w-[14rem]"
          style={{ backgroundColor: current?.system?.foreground }}
        >
      <div className="px-4 py-3  flex items-center">
        <Logo size="md" src={LOGIN_LOGO_URL} />
      </div>
      <nav className="flex-1 p-2 flex-col flex gap-2">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-base mb-0.5 ${isActive ? 'opacity-100 font-medium' : ''} hover:opacity-100`
            }
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: current?.system?.background, color: current?.brand?.primary }
                : {}
            }
          >
            <Icon size={20} />
            <Text>{label}</Text>
          </NavLink>
        ))}
      </nav>
      </View>
    </motion.div>
  )
}

export default Sidebar
