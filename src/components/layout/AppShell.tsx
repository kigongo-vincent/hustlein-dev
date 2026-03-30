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
  const initialIsDesktop =
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  const [sidebarOpen, setSidebarOpen] = useState(initialIsDesktop)
  const [isDesktop, setIsDesktop] = useState(initialIsDesktop)
  const current = Themestore((s) => s.current)
  const user = Authstore((s) => s.user)
  const location = useLocation()

  const [companyForCompletion, setCompanyForCompletion] = useState<Company | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const sync = () => {
      const desktop = media.matches
      setIsDesktop(desktop)
      // On desktop, keep the sidebar expanded by default.
      // On mobile, the sidebar behaves like a slide-in drawer and starts closed.
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
      } catch {
        // Freelancers and other roles may have a company id but no GET /companies/:id access.
        if (!cancelled) setCompanyForCompletion(null)
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
      <Sidebar open={sidebarOpen} isDesktop={isDesktop} />
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
