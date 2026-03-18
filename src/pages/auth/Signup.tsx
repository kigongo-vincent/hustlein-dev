import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import Logo, { LOGIN_LOGO_URL } from '../../components/base/Logo'
import { Input, Button, AlertModal } from '../../components/ui'
import { authService } from '../../services/authService'
import { Themestore } from '../../data/Themestore'

const Signup = () => {
  const [accountType, setAccountType] = useState<'freelancer' | 'company'>('freelancer')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { current } = Themestore()
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
    if (accountType === 'company' && !companyName.trim()) {
      setError('Company name is required.')
      return
    }
    setLoading(true)
    try {
      await authService.signup({
        email,
        name: name || undefined,
        password,
        role: accountType === 'freelancer' ? 'freelancer' : 'company_admin',
        companyName: accountType === 'company' ? companyName.trim() : undefined,
      })
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View bg="bg" className="flex-1 min-h-0 overflow-auto scroll-slim flex flex-col items-center justify-center p-6">
      <View bg="fg" className="w-full max-w-md rounded-base shadow-custom p-[3rem]">
        <div className="flex justify-center my-10">
          <Logo size="lg" src={LOGIN_LOGO_URL} />
        </div>
        <div className="mb-[2rem] flex flex-col gap-2">
          <Text variant="md" className="font-bold text-center">
            Create account
          </Text>
          <Text variant="sm" className="text-center opacity-80">
            Already have an account?{' '}
            <Link to="/auth/login" className="underline" style={{ color: current?.brand?.secondary }}>
              Sign in
            </Link>
          </Text>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Text variant="sm" className="font-medium">
              Account type
            </Text>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType('freelancer')}
                className="px-3 py-2 rounded-base text-sm  transition opacity-90 hover:opacity-100"
                style={{
                  // borderColor: current?.system?.border ?? 'rgba(0,0,0,0.12)',
                  backgroundColor: accountType === 'freelancer' ? current?.system?.background : current?.system?.foreground,
                  color: current?.system?.dark,
                  fontWeight: accountType === 'freelancer' ? 600 : 500,
                }}
                aria-pressed={accountType === 'freelancer'}
              >
                Freelancer
              </button>
              <button
                type="button"
                onClick={() => setAccountType('company')}
                className="px-3 py-2 rounded-base text-sm  transition opacity-90 hover:opacity-100"
                style={{
                  // borderColor: current?.system?.border ?? 'rgba(0,0,0,0.12)',
                  backgroundColor: accountType === 'company' ? current?.system?.background : current?.system?.foreground,
                  color: current?.system?.dark,
                  fontWeight: accountType === 'company' ? 600 : 500,
                }}
                aria-pressed={accountType === 'company'}
              >
                Company
              </button>
            </div>
          </div>

          <Input
            label="Name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          {accountType === 'company' && (
            <Input
              label="Company name"
              type="text"
              placeholder="Your company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoComplete="organization"
            />
          )}
          <Input
            label="Email"
            type="email"
            placeholder={accountType === 'company' ? 'you@company.com' : 'you@email.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <Button
            type="submit"
            label={loading ? 'Creating account…' : 'Create account'}
            fullWidth
            disabled={loading}
            loading={loading}
          />
        </form>
        <div className="mt-4 text-center">
          <Link to="/auth/login">
            <Text variant="sm" className="underline opacity-80">
              ← Back to sign in
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
  )
}

export default Signup
