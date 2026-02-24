import { useNavigate, Link } from 'react-router'
import Text from '../base/Text'
import Avatar from '../base/Avatar'
import { Authstore } from '../../data/Authstore'
import { Themestore } from '../../data/Themestore'
import { ChevronRight, ChevronLeft, Settings, Sun, Moon } from 'lucide-react'

type HeaderProps = {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

const Header = ({ sidebarOpen, onToggleSidebar }: HeaderProps) => {
  const { user, logout } = Authstore()
  const { current, mode, setTheme } = Themestore()
  const navigate = useNavigate()
  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }
  const toggleTheme = () => setTheme(mode === 'light' ? 'dark' : 'light')
  const dark = current?.system?.dark

  return (
    <div
      className="h-14 flex items-center justify-between px-4 border-b border-black/10 shrink-0"
      style={{ backgroundColor: current?.system?.foreground }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-base opacity-80 hover:opacity-100 transition"
          style={{ color: dark }}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        <Link to="/app/profile" className="flex items-center gap-2 rounded-base hover:opacity-90 transition" style={{ color: dark }}>
          <Avatar src={user?.avatarUrl} name={user?.name} size="md" />
        <Text className="font-medium">
          {user?.name ?? 'Guest'}
        </Text>
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <Link
          to="/app/settings"
          className="p-2 rounded-base opacity-80 hover:opacity-100 transition"
          style={{ color: dark }}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-base opacity-80 hover:opacity-100 transition"
          title={mode === 'light' ? 'Switch to dark' : 'Switch to light'}
          aria-label="Toggle theme"
        >
          {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button
          type="button"
          style={{
            backgroundColor: current?.system?.background
          }}
          onClick={handleLogout}
          className="px-3 py-2 rounded-base opacity-90 hover:opacity-100 transition font-medium text-[13.5px]"
        >
          Log out
        </button>
      </div>
    </div>
  )
}

export default Header
