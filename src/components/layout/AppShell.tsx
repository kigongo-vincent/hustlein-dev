import { useState, useEffect } from 'react'
import { Outlet } from 'react-router'
import View from '../base/View'
import Sidebar from './Sidebar'
import Header from './Header'
import { Themestore } from '../../data/Themestore'
import Toasts from '../ui/Toasts'

const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const current = Themestore((s) => s.current)
  const mode = Themestore((s) => s.mode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  useEffect(() => {
    const root = document.documentElement
    const isDark = mode === 'dark'
    const track = isDark ? 'rgba(255,255,255,0.06)' : (current?.system?.background ?? 'rgba(0,0,0,0.04)')
    const thumb = isDark ? 'rgba(255,255,255,0.22)' : (current?.system?.border ?? 'rgba(0,0,0,0.18)')
    const thumbHover = isDark ? 'rgba(255,255,255,0.35)' : (current?.system?.border ?? 'rgba(0,0,0,0.28)')
    root.style.setProperty('--scrollbar-track', track)
    root.style.setProperty('--scrollbar-thumb', thumb)
    root.style.setProperty('--scrollbar-thumb-hover', thumbHover)
  }, [current, mode])

  return (
    <View bg="bg" className="flex overflow-hidden" style={{ height: 'var(--app-viewport-height)' }}>
      <Sidebar open={sidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 flex flex-col min-h-0 px-3 sm:px-4 py-2 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto scroll-slim flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
      <Toasts />
    </View>
  )
}

export default AppShell
