import { useMemo, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import Logo, { LOGIN_LOGO_URL } from '../../components/base/Logo'
import { Input, Button, AlertModal } from '../../components/ui'
import { authService } from '../../services/authService'
import { Themestore } from '../../data/Themestore'
import AuthBackground from './AuthBackground'
import { authCardAccentLinkColor, authCardCaptionColor, authCardMutedLinkColor } from './authCardTheme'
import type { SignupAccountKind } from './SignupKindModal'

const Signup = () => {
  const [searchParams] = useSearchParams()
  const signupKind: SignupAccountKind = useMemo(() => {
    const k = searchParams.get('kind')
    return k === 'company' ? 'company' : 'freelancer'
  }, [searchParams])
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const current = Themestore((s) => s.current)
  const mode = Themestore((s) => s.mode)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (signupKind === 'company' && !companyName.trim()) {
      setError('Company name is required.')
      return
    }
    setLoading(true)
    try {
      await authService.signup({
        email: email.trim().toLowerCase(),
        name: name || undefined,
        password,
        role: signupKind === 'freelancer' ? 'freelancer' : 'company_admin',
        companyName: signupKind === 'company' ? companyName.trim() : undefined,
      })
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const isCompany = signupKind === 'company'

  return (
    <AuthBackground>
      <View bg="fg" className="w-full max-w-md rounded-base shadow-custom px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex justify-center mb-4">
          <Logo size="md" src={LOGIN_LOGO_URL} />
        </div>
        <div className="mb-4 flex flex-col gap-1">
          <Text variant="md" className="font-bold text-center">
            Create account
          </Text>
          <Text variant="sm" className="text-center px-2 sm:px-6" style={{ color: authCardCaptionColor(mode) }}>
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="underline font-medium"
              style={{ color: authCardAccentLinkColor(current, mode) }}
            >
              Sign in
            </Link>
          </Text>
        </div>

        {/* <div className="mb-4 text-center space-y-1">
          <Text variant="sm" style={{ color: authCardCaptionColor(mode) }}>
            Signing up as{' '}
            <span className="font-semibold" style={{ color: current?.system?.dark }}>
              {isCompany ? 'an organization' : 'a freelancer'}
            </span>
          </Text>
          <div>
            <Link
              to="/auth/login"
              className="text-xs underline font-medium"
              style={{ color: authCardAccentLinkColor(current, mode) }}
            >
              Choose a different account type
            </Link>
          </div>
        </div> */}

        <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
          <Input
            label="Name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {isCompany && (
            <Input
              label="Company name"
              type="text"
              placeholder="Your company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          )}
          <Input
            label="Email"
            type="email"
            placeholder={isCompany ? 'you@company.com' : 'you@email.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            label={loading ? 'Creating account…' : 'Create account'}
            fullWidth
            disabled={loading}
            loading={loading}
          />
        </form>

        <div className="mt-3 text-center">
          <Link to="/auth/login" className="text-sm opacity-45" style={{ color: authCardMutedLinkColor(mode) }}>
            Back to sign in
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
    </AuthBackground>
  )
}

export default Signup
