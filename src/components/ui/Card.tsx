import { HTMLAttributes, ReactNode } from 'react'
import View from '../base/View'
import Text from '../base/Text'
import { Themestore } from '../../data/Themestore'

export interface Props extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  /** Rendered on the same row as title (e.g. progress % for stat cards) */
  titleSuffix?: ReactNode
  /** Icon shown on the right in a pale background (e.g. for stat cards) */
  rightIcon?: ReactNode
  /** When true, card has no shadow (e.g. project list cards) */
  noShadow?: boolean
}

const Card = ({
  title,
  subtitle,
  titleSuffix,
  rightIcon,
  children,
  className = '',
  noShadow,
  ...rest
}: Props) => {
  const { current } = Themestore()
  // const paleBg = current?.brand?.primary ? `${current.brand.primary}0C` : 'rgba(0,0,0,0.04)'
  const paleBg = current?.system?.background

  return (
    <View bg="fg" noShadow={noShadow} className={`rounded-base  p-3 ${className}`} {...rest}>
      {(title || subtitle || titleSuffix || rightIcon) && (
        <div className={`flex items-center justify-between gap-2 ${children ? 'mb-2' : ''}`}>
          <div className="min-w-0 flex-1 flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              {title && (
                <Text className="font-medium">
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text variant="sm" className="opacity-80 mt-0.5">
                  {subtitle}
                </Text>
              )}
            </div>
            {titleSuffix}
          </div>
          {rightIcon && (
            <div
              className="shrink-0 rounded-base flex items-center justify-center"
              style={{ backgroundColor: paleBg }}
            >
              <span className="inline-flex items-center justify-center [&>svg]:size-4 [&>svg]:shrink-0 p-2" style={{ color: current?.brand?.primary || current?.system?.dark }}>
                {rightIcon}
              </span>
            </div>
          )}
        </div>
      )}
      {children}
    </View>
  )
}

export default Card
