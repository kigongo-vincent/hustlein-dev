import { ReactNode } from 'react'
import View from '../base/View'
import Text from '../base/Text'

export interface AppPageLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  /** If true, do not constrain max-width (e.g. for calendar) */
  fullWidth?: boolean
}

const AppPageLayout = ({ children, title, subtitle, fullWidth }: AppPageLayoutProps) => {
  return (
    <div className={`w-full ${fullWidth ? '' : 'max-w-6xl mx-auto'} space-y-4`}>
      {(title || subtitle) && (
        <View bg="fg" className="p-4">
          {title && <Text className="font-medium">{title}</Text>}
          {subtitle && <Text variant="sm" className="opacity-80 mt-1 block">{subtitle}</Text>}
        </View>
      )}
      {children}
    </div>
  )
}

export default AppPageLayout
