import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import Logo, { LOGIN_LOGO_URL } from '../../components/base/Logo'
import { Button } from '../../components/ui'
import { Themestore } from '../../data/Themestore'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email') ?? ''
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [verified, setVerified] = useState(!!token)
  const { current } = Themestore()

  const handleResend = async () => {
    setResending(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      setResent(true)
    } finally {
      setResending(false)
    }
  }

  return (
    <View bg="bg" className="min-h-screen flex flex-col items-center justify-center p-6">
      <View bg="fg" className="w-full max-w-md rounded-base shadow-custom p-[3rem]">
        <div className="flex justify-center my-10">
          <Logo size="lg" src={LOGIN_LOGO_URL} />
        </div>
        <Text variant="md" className="font-bold text-center mb-2">
          {verified ? 'Email verified' : 'Check your email'}
        </Text>
        {verified ? (
          <div className="space-y-4 text-center">
            <Text variant="sm" className="opacity-90">
              Your email has been verified. You can now sign in.
            </Text>
            <Link to="/auth/login">
              <Button type="button" label="Sign in" fullWidth />
            </Link>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <Text variant="sm" className="opacity-90">
              We’ve sent a verification link to{' '}
              {email ? <strong>{email}</strong> : 'your email'}. Click the link to verify your account.
            </Text>
            <Text variant="sm" className="opacity-70 text-xs">
              Didn’t receive the email? Check spam or resend.
            </Text>
            <Button
              type="button"
              variant="secondary"
              label={resending ? 'Sending…' : resent ? 'Sent! Check your inbox' : 'Resend verification email'}
              fullWidth
              disabled={resending || resent}
              onClick={handleResend}
            />
          </div>
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

export default VerifyEmail
