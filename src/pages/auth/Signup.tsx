import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import Logo, { LOGIN_LOGO_URL } from '../../components/base/Logo'
import { Input, Button, AlertModal } from '../../components/ui'
import { userService } from '../../services'
import { Authstore } from '../../data/Authstore'
import { Themestore } from '../../data/Themestore'
import type { AuthUser } from '../../types'

const Signup = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = Authstore()
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
    setLoading(true)
    try {
      // Placeholder: in a real app you would call a signup API, then redirect to verify-email or login
      const existing = await userService.getByEmail(email)
      if (existing) {
        setError('An account with this email already exists.')
        setLoading(false)
        return
      }
      // Demo: create in-memory and sign in (mock repo allows create)
      const user = await userService.create({
        email,
        name: name || email.split('@')[0],
        role: 'consultant',
        companyId: 'c1',
      })
      const authUser: AuthUser = { ...user }
      setUser(authUser)
      navigate('/app')
    } catch {
      setError('Something went wrong.')
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
          <Input
            label="Name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
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
