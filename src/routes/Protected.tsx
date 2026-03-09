import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { Authstore } from '../data/Authstore'
import { authService } from '../services/authService'
import { getStoredToken } from '../api'
import { Spinner } from '../components/ui'

const Protected = () => {
  const user = Authstore((s) => s.user)
  const location = useLocation()
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    if (user) {
      setRestoring(false)
      return
    }
    if (!getStoredToken()) {
      setRestoring(false)
      return
    }
    let cancelled = false
    authService.restoreSession().then(() => {
      if (!cancelled) setRestoring(false)
    })
    return () => { cancelled = true }
  }, [user])

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Spinner size="md" />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }
  return <Outlet />
}
export default Protected
