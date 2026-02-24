import { useRoutes, useLocation, Navigate } from 'react-router'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { Authstore } from '../data/Authstore'
import Splashscreen from '../pages/auth/Splashscreen'
import Login from '../pages/auth/Login'
import Signup from '../pages/auth/Signup'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import VerifyEmail from '../pages/auth/VerifyEmail'
import CheckEmail from '../pages/auth/CheckEmail'

const pageTransition = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
}

const Auth = () => {
  const user = Authstore((s) => s.user)
  const location = useLocation()
  const element = useRoutes([
    { index: true, element: <Splashscreen /> },
    { path: 'login', element: <Login /> },
    { path: 'signup', element: <Signup /> },
    { path: 'forgot-password', element: <ForgotPassword /> },
    { path: 'reset-password', element: <ResetPassword /> },
    { path: 'verify-email', element: <VerifyEmail /> },
    { path: 'check-email', element: <CheckEmail /> },
  ])

  if (user) {
    return <Navigate to="/app" replace />
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
        transition={pageTransition.transition}
        className="w-full flex flex-col overflow-hidden"
        style={{ height: 'var(--app-viewport-height)' }}
      >
        {element}
      </motion.div>
    </AnimatePresence>
  )
}

export default Auth
