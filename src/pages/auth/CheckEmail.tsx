import { Link, useSearchParams } from 'react-router'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import Logo, { LOGIN_LOGO_URL } from '../../components/base/Logo'
import { Button } from '../../components/ui'
import { Themestore } from '../../data/Themestore'

const CheckEmail = () => {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const { current } = Themestore()

  return (
    <View bg="bg" className="min-h-screen flex flex-col items-center justify-center p-6">
      <View bg="fg" className="w-full max-w-md rounded-base shadow-custom p-[3rem]">
        <div className="flex justify-center my-10">
          <Logo size="lg" src={LOGIN_LOGO_URL} />
        </div>
        <Text variant="md" className="font-bold text-center mb-2">
          Check your email
        </Text>
        <Text variant="sm" className="text-center opacity-90 mb-6">
          We’ve sent a link to {email ? <strong>{email}</strong> : 'your email'}. Click it to sign in or reset your password.
        </Text>
        <Link to="/auth/login">
          <Button type="button" label="Back to sign in" fullWidth />
        </Link>
        <div className="mt-6 text-center">
          <Text variant="sm" className="opacity-70">
            Didn’t receive it?{' '}
            <Link to="/auth/forgot-password" className="underline" style={{ color: current?.brand?.secondary }}>
              Try again
            </Link>{' '}
            or{' '}
            <Link to="/auth/login" className="underline" style={{ color: current?.brand?.secondary }}>
              sign in
            </Link>
            .
          </Text>
        </div>
      </View>
    </View>
  )
}

export default CheckEmail
