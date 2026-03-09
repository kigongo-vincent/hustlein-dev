import { Navigate, Outlet } from 'react-router'
import { Authstore } from '../data/Authstore'
import type { UserRole } from '../types'

type RoleProtectedProps = {
  /** Only these roles can access the nested routes; others redirect to /app */
  allowedRoles: UserRole[]
}

const RoleProtected = ({ allowedRoles }: RoleProtectedProps) => {
  const user = Authstore((s) => s.user)
  const allowed = user && allowedRoles.includes(user.role)
  if (!allowed) {
    return <Navigate to="/app" replace />
  }
  return <Outlet />
}

export default RoleProtected
