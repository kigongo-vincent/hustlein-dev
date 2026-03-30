import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import Logo, { LOGIN_LOGO_URL } from '../../components/base/Logo'
import { Input, Button, AlertModal } from '../../components/ui'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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
      // Placeholder: in a real app you would call a reset-password API with token + new password
      await new Promise((r) => setTimeout(r, 600))
      setSuccess(true)
    } catch {
      setError('Something went wrong. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  const hasToken = Boolean(token)

  return (
    <View bg="bg" className="flex-1 min-h-0 overflow-auto scroll-slim flex flex-col items-center justify-center p-6">
      <View bg="fg" className="w-full max-w-md rounded-base shadow-custom p-[3rem]">
        <div className="flex justify-center my-10">
          <Logo size="lg" src={LOGIN_LOGO_URL} />
        </div>
        <Text variant="md" className="font-bold text-center mb-2">
          Set new password
        </Text>
        {!hasToken ? (
          <div className="space-y-4 text-center">
            <Text variant="sm" className="opacity-90">
              This page is only valid when opened from the link in your email. Request a new link from the sign-in page.
            </Text>
            <Link to="/auth/forgot-password">
              <Button type="button" label="Request reset link" fullWidth />
            </Link>
          </div>
        ) : success ? (
          <div className="space-y-4 text-center">
            <Text variant="sm" className="opacity-90">
              Your password has been updated. You can now sign in with your new password.
            </Text>
            <Link to="/auth/login">
              <Button type="button" label="Sign in" fullWidth />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4" autoComplete="off">
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              label={loading ? 'Updating…' : 'Update password'}
              fullWidth
              disabled={loading}
            />
          </form>
        )}
        <div className="mt-6 text-center">
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

export default ResetPassword
