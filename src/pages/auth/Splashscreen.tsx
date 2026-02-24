import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Authstore } from '../../data/Authstore'
import Logo from '../../components/base/Logo'
import Text from '../../components/base/Text'
import View from '../../components/base/View'

const SPLASH_DURATION_MS = 1200

const Splashscreen = () => {
  const user = Authstore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => {
      navigate(user ? '/app' : '/auth/login', { replace: true })
    }, SPLASH_DURATION_MS)
    return () => clearTimeout(t)
  }, [navigate, user])

  return (
    <View
      bg="p"
      className="flex-1 min-h-0 w-full py-10 flex flex-col items-center justify-between overflow-hidden"
    >
      <div />
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* <View bg="p" className="px-10 py-4"> */}
        <Logo />
        {/* </View> */}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Text variant="sm" mode='light' className="opacity-40">
          Powered by <span className="underline">tekjuice.co.uk</span>
        </Text>
      </motion.div>
    </View>
  )
}

export default Splashscreen
