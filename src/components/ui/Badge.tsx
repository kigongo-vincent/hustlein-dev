import View from '../base/View'
import Text from '../base/Text'
import { Themestore } from '../../data/Themestore'
import type { Priority } from '../../types'

type Variant = 'default' | 'success' | 'warning' | 'error' | Priority

export interface Props {
  children: string
  variant?: Variant
}

const Badge = ({ children, variant = 'default' }: Props) => {
  const { current } = Themestore()
  const color =
    variant === 'success'
      ? current?.system?.success
      : variant === 'warning'
        ? '#b45309'
        : variant === 'error'
          ? current?.system?.error
          : variant === 'high'
            ? current?.system?.error
            : variant === 'medium'
              ? '#b45309'
              : variant === 'low'
                ? '#0d9488'
                : current?.system?.dark
  return (
    <View
      bg="fg"
      className="rounded-base px-2 py-0.5 inline-block"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <Text variant="sm" color={color}>
        {children}
      </Text>
    </View>
  )
}

export default Badge
