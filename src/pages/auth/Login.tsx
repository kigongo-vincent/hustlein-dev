import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useGoogleLogin } from '@react-oauth/google'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import Logo, { LOGIN_LOGO_URL } from '../../components/base/Logo'
import { Input, Button, AlertModal } from '../../components/ui'
import SignupKindModal from './SignupKindModal'
import { authService } from '../../services/authService'
import { Themestore } from '../../data/Themestore'
import AuthBackground from './AuthBackground'
import { authCardAccentLinkColor, authCardCaptionColor, authCardMutedLinkColor } from './authCardTheme'

/** Multicolor G — avoid inheriting `color` from buttons (would flatten via currentColor). */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
    <path
      fill="#4285F4"
      style={{ fill: '#4285F4' }}
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      style={{ fill: '#34A853' }}
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      style={{ fill: '#FBBC05' }}
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      style={{ fill: '#EA4335' }}
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
  const [signupKindOpen, setSignupKindOpen] = useState(false)
  const current = Themestore((s) => s.current)
  const mode = Themestore((s) => s.mode)
  const navigate = useNavigate()

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setLoading(true)
      try {
        await authService.googleAuth(access_token)
        navigate('/app')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
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
      await authService.login({ email: email.trim().toLowerCase(), password })
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthBackground>
      <View bg="fg" className="w-full max-w-md rounded-base shadow-custom px-5 py-6 sm:px-7 sm:py-[3rem]">
        <div className="flex justify-center mb-4">
          <Logo size="md" src={LOGIN_LOGO_URL} />
        </div>
        <div className="mb-5 flex flex-col gap-1">
          <Text variant="md" className="font-bold text-center">
            Sign in
          </Text>
          <Text variant="sm" className="text-center px-2 sm:px-6" style={{ color: authCardCaptionColor(mode) }}>
            Welcome back. If you&apos;re not yet registered,{' '}
            <button
              type="button"
              className="underline font-medium bg-transparent border-0 p-0 cursor-pointer text-inherit font-inherit"
              style={{ color: authCardAccentLinkColor(current, mode) }}
              onClick={() => setSignupKindOpen(true)}
            >
              get started
            </button>
          </Text>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            name="email"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex justify-end">
              <Link
                to="/auth/forgot-password"
                className="text-xs underline mt-2 hover:opacity-90"
                style={{ color: authCardMutedLinkColor(mode) }}
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
              <div className="flex items-center gap-3 w-full py-0.5">
                <div className="border-b flex-1" style={{ borderColor: current?.system?.border }} />
                <Text variant="sm" style={{ color: authCardCaptionColor(mode) }}>
                  or
                </Text>
                <div className="border-b flex-1" style={{ borderColor: current?.system?.border }} />
              </div>
              <Button
                type="button"
                variant="background"
                fullWidth
                label="Continue with Google"
                startIcon={<GoogleIcon />}
                title="Google sign-in for freelancer accounts"
                onClick={() => googleLogin()}
                disabled={loading}
              />
              <Text variant="sm" className="text-center text-xs px-1 leading-snug" style={{ color: authCardCaptionColor(mode) }}>
                Google sign-in is for freelancers. Everyone else can use email and password above.
              </Text>
            </>
          ) : null}
        </form>
      </View>
      <SignupKindModal
        open={signupKindOpen}
        onClose={() => setSignupKindOpen(false)}
        onPickKind={(kind) => {
          setSignupKindOpen(false)
          navigate(`/auth/signup?kind=${kind}`)
        }}
      />
      <AlertModal
        open={!!error}
        title="Error"
        message={error}
        onClose={() => setError('')}
        variant="error"
      />
    </AuthBackground>
  )
}

export default Login
