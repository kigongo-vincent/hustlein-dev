import { NavLink } from 'react-router'
import View from '../base/View'
import Text from '../base/Text'
import Logo from '../base/Logo'
import { Themestore } from '../../data/Themestore'
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Flag,
  Calendar,
  BarChart3,
  Target,
} from 'lucide-react'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
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
    <View bg="fg" className="w-56 min-h-screen shadow-custom flex flex-col">
      <div className="p-4 border-b">
        <Logo />
      </div>
      <nav className="flex-1 p-2">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-base mb-0.5 ${isActive ? 'opacity-100' : 'opacity-70'} hover:opacity-100`
            }
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: current?.brand?.primary + '20', color: current?.brand?.primary }
                : {}
            }
          >
            <Icon size={20} />
            <Text variant="md">{label}</Text>
          </NavLink>
        ))}
      </nav>
    </View>
  )
}

export default Sidebar
