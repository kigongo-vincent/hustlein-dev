import { Link } from 'react-router'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import Logo, { LOGIN_LOGO_URL } from '../../components/base/Logo'
import { Input, Button } from '../../components/ui'
import { useState } from 'react'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Placeholder: in a real app you would call a password reset API here
    await new Promise((r) => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  return (
    <View bg="bg" className="min-h-screen flex flex-col items-center justify-center p-6">
      <View bg="fg" className="w-full max-w-md rounded-base shadow-custom p-[3rem]">
        <div className="flex justify-center my-10">
          <Logo size="lg" src={LOGIN_LOGO_URL} />
        </div>
        <Text variant="md" className="font-bold text-center mb-2">
          Reset password
        </Text>
        <Text variant="sm" className="text-center opacity-80 mb-6">
          Enter your email and we’ll send you a link to reset your password.
        </Text>
        {sent ? (
          <div className="space-y-4 text-center">
            <Text variant="sm" className="opacity-90">
              If an account exists for <strong>{email}</strong>, you’ll receive a password reset link.
            </Text>
            <div className="flex flex-col gap-2">
              <Link to={`/auth/check-email?email=${encodeURIComponent(email)}`}>
                <Button type="button" variant="secondary" label="Check email" fullWidth />
              </Link>
              <Link to="/auth/login">
                <Button type="button" label="Back to sign in" fullWidth />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              label={loading ? 'Sending…' : 'Send reset link'}
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
    </View>
  )
}

export default ForgotPassword
