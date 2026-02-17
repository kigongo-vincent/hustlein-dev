import { HTMLAttributes } from 'react'
import View from '../base/View'
import Text from '../base/Text'

export interface Props extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

const Card = ({
  title,
  subtitle,
  children,
  className = '',
  ...rest
}: Props) => {
  return (
    <View bg="fg" className={`rounded-base shadow-custom p-4 ${className}`} {...rest}>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && (
            <Text variant="lg" className="font-medium">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text variant="sm" className="opacity-80 mt-0.5">
              {subtitle}
            </Text>
          )}
        </div>
      )}
      {children}
    </View>
  )
}

export default Card
