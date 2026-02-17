import { useNavigate } from 'react-router'
import View from '../base/View'
import Text from '../base/Text'
import Button from '../ui/Button'
import { Authstore } from '../../data/Authstore'

const Header = () => {
  const { user, logout } = Authstore()
  const navigate = useNavigate()
  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }
  return (
    <View bg="fg" className="h-14 shadow-custom flex items-center justify-between px-4">
      <Text variant="lg" className="font-medium">
        {user?.name ?? 'Guest'}
      </Text>
      <Button variant="ghost" size="sm" label="Log out" onClick={handleLogout} />
    </View>
  )
}

export default Header
