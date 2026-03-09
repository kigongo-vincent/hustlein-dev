import { useNavigate, Link } from 'react-router'
import Text from '../base/Text'
import Avatar from '../base/Avatar'
import { Authstore } from '../../data/Authstore'
import { Themestore } from '../../data/Themestore'
import { ChevronRight, ChevronLeft, Settings, Sun, Moon } from 'lucide-react'
import { Button } from '../ui'
import { publish } from '../../utils/publish'
import { toast } from 'react-toastify'

type HeaderProps = {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}



const Header = ({ sidebarOpen, onToggleSidebar }: HeaderProps) => {
  const { user, logout } = Authstore()
  const { current, mode, setTheme } = Themestore()
  const navigate = useNavigate()

  const onLogoutConfirm = () => {
    logout()
    navigate('/auth/login')
  }

  const LogutOutModal = ({ id: _id }: { id: string }) => {
    return (
      <div className='flex-1 pt-4 '>
        <Text variant='md' className='font-semibold' >Logout</Text>
        <Text>Are you sure you want to logout</Text>
        <div className='flex gap-2 items-center mt-4 justify-end'>
          <Button onClick={() => toast.dismiss()} label='CANCEL' variant='secondary' />
          <Button onClick={onLogoutConfirm} label='YES' />
        </div>
      </div>
    )
  }




  const handleLogout = () => {
    publish(<LogutOutModal id='header' />, "", false)
  }
  const toggleTheme = () => setTheme(mode === 'light' ? 'dark' : 'light')
  const dark = current?.system?.dark

  return (
    <div
      className="h-14 flex items-center justify-between px-4 border-b shrink-0"
      style={{
        backgroundColor: current?.system?.foreground,
        borderColor: current?.system?.border ?? 'rgba(0,0,0,0.1)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="min-h-[44px] min-w-[44px] p-2 rounded-base opacity-80 hover:opacity-100 transition flex items-center justify-center"
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
          className="min-h-[44px] min-w-[44px] p-2 rounded-base opacity-80 hover:opacity-100 transition flex items-center justify-center"
          style={{ color: dark }}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="min-h-[44px] min-w-[44px] p-2 rounded-base opacity-80 hover:opacity-100 transition flex items-center justify-center"
          title={mode === 'light' ? 'Switch to dark' : 'Switch to light'}
          aria-label="Toggle theme"
          style={{ color: dark }}
        >
          {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button
          type="button"
          style={{
            backgroundColor: current?.system?.background,
            color: dark,
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
