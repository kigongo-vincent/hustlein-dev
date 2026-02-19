import Text from '../../components/base/Text'
import Avatar from '../../components/base/Avatar'
import { AppPageLayout } from '../../components/layout'
import { Authstore } from '../../data/Authstore'

const ProfilePage = () => {
  const { user } = Authstore()
  return (
    <AppPageLayout title="Profile" subtitle={user?.email ?? undefined}>
      <div className="flex items-center gap-4">
        <Avatar src={user?.avatarUrl} name={user?.name} size="md" />
        <div>
          <Text className="font-medium">{user?.name ?? 'Guest'}</Text>
          <Text variant="sm" className="opacity-80">{user?.email ?? '—'}</Text>
        </div>
      </div>
    </AppPageLayout>
  )
}

export default ProfilePage
