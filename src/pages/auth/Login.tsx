import { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useGoogleLogin } from '@react-oauth/google'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import Logo, { LOGIN_LOGO_URL } from '../../components/base/Logo'
import { Input, Button, AlertModal } from '../../components/ui'
import { authService } from '../../services/authService'
import { Themestore } from '../../data/Themestore'
import AccountTypeModal, { type AccountType } from './AccountTypeModal'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { current } = Themestore()
  const navigate = useNavigate()
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const pendingGoogleAccountTypeRef = useRef<AccountType | null>(null)

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setLoading(true)
      try {
        await authService.googleAuth(access_token, {
          accountType: pendingGoogleAccountTypeRef.current ?? 'freelancer',
        })
        navigate('/app')
      } catch {
        setError('Google sign-in failed. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    onError: () => setError('Google sign-in failed. Please try again.'),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.login({ email, password })
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AccountTypeModal
        open={accountModalOpen}
        closeOnBackdrop
        onClose={() => setAccountModalOpen(false)}
        onSelect={(t) => {
          pendingGoogleAccountTypeRef.current = t
          setAccountModalOpen(false)
          googleLogin()
        }}
      />

      <View bg="bg" className="flex-1 min-h-0 overflow-auto scroll-slim flex flex-col items-center justify-center p-6">
        <View bg="fg" className="w-full max-w-md rounded-base shadow-custom p-[3rem]">
        <div className="flex justify-center  my-10">
          <Logo size="lg" src={LOGIN_LOGO_URL} />
        </div>
        <div className='mb-[3rem] flex flex-col gap-2'>
          <Text variant='md' className="font-bold  text-center">
            Sign in
          </Text>
          <Text variant='sm' className='text-center px-10'>Welcome back. If you&apos;re not yet registered, <Link to="/auth/signup" className='underline' style={{ color: current?.brand?.secondary }}>get started</Link></Text>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex justify-end">
              <Link
                to="/auth/forgot-password"
                className="text-xs opacity-50 mt-3 hover:opacity-100 underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          <Button
            type="submit"
            label={loading ? 'Signing in…' : 'Sign in'}
            fullWidth
            disabled={loading}
            loading={loading}
          />
          {googleClientId ? (
            <>
              <div className="flex items-center gap-3 w-full py-1">
                <div className='border-b flex-1 border-gray-200'></div>
                <Text variant="sm" className="">or</Text>
                <div className='border-b flex-1 border-gray-200'></div>
              </div>
              <Button
                type="button"
                variant="background"
                fullWidth
                label="Continue with Google"
                startIcon={<GoogleIcon />}
                title="Google sign-in (optional)"
                onClick={() => setAccountModalOpen(true)}
              />
            </>
          ) : null}
        </form>
        <div className="mt-4 text-center space-y-3">
          <Link to="/">
            <Text variant="sm" className="underline opacity-80">
              Back to splash
            </Text>
          </Link>
        </div>
        </View>
        <AlertModal
          open={!!error}
          title="Error"
          message={error}
          onClose={() => setError('')}
          variant="error"
        />
      </View>
    </>
  )
}

export default Login
