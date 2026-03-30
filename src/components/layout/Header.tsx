import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import Text, { baseFontSize } from '../base/Text'
import Avatar from '../base/Avatar'
import { Authstore } from '../../data/Authstore'
import { Themestore } from '../../data/Themestore'
import { Menu, X, Settings, Sun, Moon, LogOut } from 'lucide-react'
import { Button, Modal } from '../ui'
import { APP_ICON_SIZE, getMutedIconColor } from '../base/iconTokens'

type HeaderProps = {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

const Header = ({ sidebarOpen, onToggleSidebar }: HeaderProps) => {
  const { user, logout } = Authstore()
  const { current, mode, setTheme } = Themestore()
  const navigate = useNavigate()

  const [logoutOpen, setLogoutOpen] = useState(false)

  const onLogoutConfirm = () => {
    logout()
    setLogoutOpen(false)
    navigate('/auth/login', { replace: true })
  }

  const handleLogout = () => {
    setLogoutOpen(true)
  }
  const toggleTheme = () => setTheme(mode === 'light' ? 'dark' : 'light')
  const dark = current?.system?.dark ?? '#111827'
  const border = current?.system?.border ?? 'rgba(0,0,0,0.08)'
  const muted = getMutedIconColor(mode)

  return (
    <>
      <div
      className="flex items-center justify-between px-4 shrink-0 relative z-40"
      style={{
        backgroundColor: current?.system?.foreground,
        borderBottom: `1px solid ${border}`,
        fontSize: baseFontSize,
        lineHeight: 1.5,
        height: '64px', // taller header for improved visual balance
      }}
    >
      {/* Left: sidebar toggle + user */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-6 h-6 rounded-base opacity-55 hover:opacity-90 transition-opacity flex items-center justify-center"
          style={{ color: muted }}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
        <Link
          to="/app/profile"
          className="flex items-center gap-2.5 px-1 py-1 rounded-base hover:opacity-85 transition-opacity"
          style={{ color: dark }}
        >
          <Avatar src={user?.avatarUrl} name={user?.name} size="sm" />
          <Text className="font-semibold">{user?.name ?? 'Guest'}</Text>
        </Link>
      </div>

      {/* Right: icon actions */}
      <div className="flex items-center gap-2">
        <Link
          to="/app/settings"
          className="w-5 h-5 rounded-base hover:opacity-90 transition-opacity flex items-center justify-center"
          style={{ color: muted }}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={APP_ICON_SIZE} />
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="w-5 h-5 rounded-base hover:opacity-90 transition-opacity flex items-center justify-center"
          title={mode === 'light' ? 'Switch to dark' : 'Switch to light'}
          aria-label="Toggle theme"
          style={{ color: muted }}
        >
          {mode === 'light' ? <Moon size={APP_ICON_SIZE} /> : <Sun size={APP_ICON_SIZE} />}
        </button>
        <div
          className="mx-1 h-4 w-px opacity-40"
          style={{ background: border }}
        />
        <button
          type="button"
          onClick={handleLogout}
          className="w-5 h-5 rounded-base hover:opacity-90 transition-opacity flex items-center justify-center"
          title="Log out"
          aria-label="Log out"
          style={{ color: muted }}
        >
          <LogOut size={APP_ICON_SIZE} />
        </button>
      </div>
      </div>
      <Modal open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <div className="p-6">
          <Text className="font-semibold mb-2">Logout</Text>
          <Text>Are you sure you want to logout</Text>
          <div className="flex gap-2 items-center mt-4 justify-end">
            <Button onClick={() => setLogoutOpen(false)} label="CANCEL" variant="secondary" />
            <Button onClick={onLogoutConfirm} label="YES" />
          </div>
        </div>
      </Modal>
    </>
  )
}

export default Header
