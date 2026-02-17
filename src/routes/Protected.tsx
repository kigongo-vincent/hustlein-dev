import { Navigate, Outlet, useLocation } from 'react-router'
import { Authstore } from '../data/Authstore'

const Protected = () => {
  const { user } = Authstore()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }
  return <Outlet />
}

export default Protected
