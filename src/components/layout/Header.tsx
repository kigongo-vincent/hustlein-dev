import { useNavigate, Link } from 'react-router'
import Text from '../base/Text'
import Avatar from '../base/Avatar'
import { Authstore } from '../../data/Authstore'
import { Themestore } from '../../data/Themestore'
import { User, Settings, Sun, Moon } from 'lucide-react'

const Header = () => {
  const { user, logout } = Authstore()
  const { current, mode, setTheme } = Themestore()
  const navigate = useNavigate()
  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }
  const toggleTheme = () => setTheme(mode === 'light' ? 'dark' : 'light')

  return (
    <div
      className="h-14 flex items-center justify-between px-4 border-b border-black/10 shrink-0"
      style={{ backgroundColor: current?.system?.foreground }}
    >
      <div className="flex items-center gap-3">
        <Avatar src={user?.avatarUrl} name={user?.name} size="md" />
        <Text className="font-medium">
          {user?.name ?? 'Guest'}
        </Text>
      </div>
      <div className="flex items-center gap-1">
        {/* <Link
          to="/app/profile"
          className="p-2 rounded-base opacity-80 hover:opacity-100 transition"
          title="Profile"
          aria-label="Profile"
        >
          <User size={18} />
        </Link> */}
        <Link
          to="/app/settings"
          className="p-2 rounded-base opacity-80 hover:opacity-100 transition"
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
