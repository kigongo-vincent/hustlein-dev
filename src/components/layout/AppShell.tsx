import { useState, useEffect } from 'react'
import { Outlet } from 'react-router'
import View from '../base/View'
import Sidebar from './Sidebar'
import Header from './Header'
import { Themestore } from '../../data/Themestore'

const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const current = Themestore((s) => s.current)

  useEffect(() => {
    const root = document.documentElement
    const bg = current?.system?.background ?? 'rgba(0,0,0,0.04)'
    const border = current?.system?.border ?? 'rgba(0,0,0,0.18)'
    root.style.setProperty('--scrollbar-track', bg)
    root.style.setProperty('--scrollbar-thumb', border)
    root.style.setProperty('--scrollbar-thumb-hover', border)
  }, [current])

  return (
    <View bg="bg" className="h-screen flex overflow-hidden">
      <Sidebar open={sidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 flex flex-col min-h-0 px-4 py-2 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto scroll-slim flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </View>
  )
}

export default AppShell
