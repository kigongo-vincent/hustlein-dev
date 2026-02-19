import { NavLink } from 'react-router'
import View from '../base/View'
import Text from '../base/Text'
import Logo, { LOGIN_LOGO_URL } from '../base/Logo'
import { Themestore } from '../../data/Themestore'
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Flag,
  Calendar,
  BarChart3,
  Target,
  Users,
} from 'lucide-react'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/consultants', label: 'Consultants', icon: Users },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/app/milestones', label: 'Milestones', icon: Flag },
  { to: '/app/calendar', label: 'Calendar', icon: Calendar },
  { to: '/app/reports', label: 'Reports', icon: BarChart3 },
  { to: '/app/focus', label: 'Focus', icon: Target },
]

const Sidebar = () => {
  const { current } = Themestore()
  return (
    <View
      bg='fg'
      className="w-56 h-screen  flex flex-col border-r border-black/10 shrink-0"
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
  )
}

export default Sidebar
