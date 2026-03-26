import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import View from '../base/View'
import Sidebar from './Sidebar'
import Header from './Header'
import { Themestore } from '../../data/Themestore'
import Toasts from '../ui/Toasts'
import { Authstore } from '../../data/Authstore'
import { companyService } from '../../services'
import type { Company } from '../../types'
import CompanyCompletionModal from '../../pages/company/CompanyCompletionModal'

const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)
  const current = Themestore((s) => s.current)
  const mode = Themestore((s) => s.mode)
  const user = Authstore((s) => s.user)
  const location = useLocation()

  const [companyForCompletion, setCompanyForCompletion] = useState<Company | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const sync = () => {
      const desktop = media.matches
      setIsDesktop(desktop)
      setSidebarOpen(desktop)
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false)
  }, [location.pathname, isDesktop])

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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user?.companyId) {
        setCompanyForCompletion(null)
        return
      }
      setLoadingCompany(true)
      try {
        const c = await companyService.get(user.companyId)
        if (!cancelled) setCompanyForCompletion(c)
      } finally {
        if (!cancelled) setLoadingCompany(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.companyId])

  const isCompanyComplete = (c: Company | null) => {
    if (!c) return false
    return (
      !!c.logoUrl &&
      c.name.trim().length > 0 &&
      !!c.email?.trim() &&
      !!c.phone?.trim() &&
      !!c.address?.trim() &&
      typeof c.taxRate === 'number' &&
      typeof c.storageLimitMb === 'number' &&
      typeof c.storageUsedMb === 'number'
    )
  }

  const shouldBlockCompanyCompletion =
    !!user?.companyId &&
    (user?.role === 'company_admin' || user?.role === 'super_admin') &&
    !loadingCompany &&
    !isCompanyComplete(companyForCompletion)

  return (
    <View bg="bg" className="flex w-full overflow-hidden" style={{ height: 'var(--app-viewport-height)' }}>
      <Sidebar open={sidebarOpen} />
      {!isDesktop && sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/35 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar backdrop"
        />
      )}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main
          className="flex-1 flex flex-col min-h-0 px-4 sm:px-5 py-3 overflow-hidden"
          style={current?.system?.backgroundImage ? {
            backgroundImage: current.system.backgroundImage,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          } : undefined}
        >
          <div className="flex-1 min-h-0 overflow-auto scroll-slim flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
      <CompanyCompletionModal
        open={shouldBlockCompanyCompletion}
        company={companyForCompletion}
        onUpdated={(updated) => setCompanyForCompletion(updated)}
      />
      <Toasts />
    </View>
  )
}

export default AppShell
